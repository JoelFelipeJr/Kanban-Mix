import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { type Card, type Column } from "../types";
import { TaskCard } from "./TaskCard";

interface DroppableCellProps {
  column: Column;
  swimlaneId: string | null;
  cards: Card[];
  allCards: Card[];
  columns: Column[];
  members: any[];
  onCardClick: (cardId: string) => void;
  isDragDisabled?: boolean;
}

export const DroppableCell: React.FC<DroppableCellProps> = React.memo(({ column, swimlaneId, cards, allCards, columns, members, onCardClick, isDragDisabled }) => {
  const droppableId = `${swimlaneId}|${column.id}`;

  return (
    <div className="flex-1 min-w-[240px] p-2 flex flex-col relative min-h-[120px] border-l border-[#1e293b]/50 first:border-l-0">
      <Droppable droppableId={droppableId} isDropDisabled={isDragDisabled}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 flex flex-col gap-2 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-[#0F1117]/50" : "bg-transparent"
            }`}
          >
            {cards.map((card, index) => (
              <TaskCard key={card.id} card={card} index={index} onClick={onCardClick} isDragDisabled={isDragDisabled} allCards={allCards} columns={columns} members={members} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});
