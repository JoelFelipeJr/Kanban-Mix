import React, { useState, useEffect } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Search } from "lucide-react";
import { api } from "../services/api";
import type { Board, Card, Column, Swimlane } from "../types";
import { DroppableCell } from "./DroppableCell";
import { CardDetailsModal } from "./CardModal";
import { cn } from "../lib/utils";
import { useBoardAccess } from "../hooks/useBoardAccess";

export const KanbanBoard: React.FC<{ boardId: string, refreshTrigger?: number }> = ({ boardId, refreshTrigger }) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [swimlanes, setSwimlanes] = useState<Swimlane[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { role, loading: accessLoading, canMoveCards } = useBoardAccess(boardId);

  const filteredCards = React.useMemo(() => cards.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.id.includes(searchQuery)
  ), [cards, searchQuery]);

  const cardsByCell = React.useMemo(() => {
    const grouped: Record<string, Card[]> = {};
    filteredCards.forEach(c => {
      const sId = c.swimlaneId || 'default';
      const key = `${sId}|${c.columnId}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });
    // Sort each group
    Object.values(grouped).forEach(list => list.sort((a, b) => a.order - b.order));
    return grouped;
  }, [filteredCards]);

  const handleCardClick = React.useCallback((id: string) => {
    setSelectedCardId(id);
  }, []);

  useEffect(() => {
    loadData(true);
  }, [boardId]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadData(false);
    }
  }, [refreshTrigger]);

  const loadData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.getBoardData(boardId);
      setBoard(data.board || null);
      setColumns(data.columns);
      setSwimlanes(data.swimlanes);
      setCards(data.cards);
      setMembers(data.members || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!canMoveCards) return;
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const [destSwimlaneId, destColumnId] = destination.droppableId.split("|");
    const [sourceSwimlaneId, sourceColumnId] = source.droppableId.split("|");

    // Optimistic Update
    const cardIndex = cards.findIndex((c) => c.id === draggableId);
    if (cardIndex === -1) return;

    const newCards = Array.from(cards);
    const [movedCard] = newCards.splice(cardIndex, 1) as [Card];

    movedCard.columnId = destColumnId;
    movedCard.swimlaneId = destSwimlaneId;

    // Get cards in destination to correctly place by index
    const destCards = newCards
      .filter((c: Card) => c.columnId === destColumnId && c.swimlaneId === destSwimlaneId)
      .sort((a: Card, b: Card) => a.order - b.order);

    destCards.splice(destination.index, 0, movedCard);

    // Reorder destination cards
    destCards.forEach((c: Card, idx: number) => {
      c.order = idx;
    });

    const otherCards = newCards.filter(
      (c: Card) => !(c.columnId === destColumnId && c.swimlaneId === destSwimlaneId)
    );

    setCards([...otherCards, ...destCards]);

    // Send to API
    await api.moveCard(draggableId, destColumnId, destSwimlaneId, destination.index);

    const sortedCols = [...columns].sort((a,b) => a.order - b.order);
    if (sortedCols.length > 0) {
      const lastColId = sortedCols[sortedCols.length - 1].id;
      if (destColumnId === lastColId && sourceColumnId !== lastColId) {
        import("canvas-confetti").then((module) => {
          module.default({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4f46e5', '#d946ef', '#10b981', '#f59e0b']
          });
        });
      }
    }

    loadData(); // reload because parents might have been auto-completed
  };

  if (loading || accessLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!board) return <div className="p-8 text-slate-400">Board não encontrado.</div>;
  if (role === 'none') {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <div className="text-slate-400 flex flex-col items-center">
           <Search className="w-12 h-12 mb-4 opacity-50" />
           <p>Você não tem acesso a este board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-base">
      <header className="py-3 border-b border-border-subtle flex items-center justify-between px-6 bg-[#0B0C10]/80 backdrop-blur-md sticky top-0 z-20 shrink-0 min-h-[64px]">
        <div className="flex flex-col justify-center">
          <div className="text-sm flex items-center gap-2">
            <span className="text-slate-500">Boards</span>
            <span className="text-slate-700">/</span>
            <span className="font-semibold text-white">{board.name}</span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium uppercase border border-indigo-500/20">{role}</span>
          </div>
          {board.description && (
            <p className="text-xs text-slate-400 mt-1">{board.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cards..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#16181D] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm outline-none w-64 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:w-72 transition-all cursor-text"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="inline-flex flex-col w-full min-w-max pb-8">
            {(swimlanes.length > 0 ? swimlanes : [{ id: 'default', name: 'Board', order: 0, boardId }]).map((swimlane) => (
              <div key={swimlane.id} className="flex flex-col group/swimlane">
                {swimlanes.length > 0 && (
                  <div className="swimlane-header px-4 py-2 border-y border-border-subtle/40 bg-[#0F1117] text-[10px] font-bold text-indigo-400 uppercase tracking-tighter sticky left-0 z-10 w-max min-w-full flex items-center gap-2">
                    <span>✦ {swimlane.name}</span>
                  </div>
                )}
                
                <div className="flex border-b border-border-subtle/50 bg-[#0F1117]/30 w-full min-w-max">
                  {columns.map((column, index) => {
                    const cellKey = `${swimlane.id}|${column.id}`;
                    const cardsInCell = cardsByCell[cellKey] || [];
                    return (
                      <div key={column.id} className={cn("flex-1 min-w-[240px] px-4 py-3 text-xs font-extrabold text-slate-200 uppercase tracking-widest text-center border-white/10 bg-[#16181D]/50 drop-shadow-sm", index > 0 && "border-l")}>
                        {column.name} ({cardsInCell.length})
                      </div>
                    );
                  })}
                </div>

                <div className="flex">
                  {columns.map((column) => {
                    const cellKey = `${swimlane.id}|${column.id}`;
                    const cellCards = cardsByCell[cellKey] || [];
                    return (
                      <DroppableCell
                        key={column.id}
                        column={column}
                        swimlaneId={swimlane.id === 'default' ? null : swimlane.id}
                        onCardClick={handleCardClick}
                        isDragDisabled={!canMoveCards}
                        allCards={cards}
                        columns={columns}
                        members={members}
                        cards={cellCards}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {selectedCardId && (
        <CardDetailsModal 
          cardId={selectedCardId} 
          boardId={boardId} 
          onClose={() => setSelectedCardId(null)} 
          onUpdate={() => loadData(false)} 
        />
      )}
    </div>
  );
}
