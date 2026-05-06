import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { type Card, type Column } from "../types";
import { cn, getInitials } from "../lib/utils";
import { GripVertical, Calendar } from "lucide-react";

interface TaskCardProps {
  card: Card;
  index: number;
  onClick: (cardId: string) => void;
  isDragDisabled?: boolean;
  allCards?: Card[];
  columns?: Column[];
  members?: any[];
}

const typeConfig: Record<Card["type"], { label: string; tagClass: string; borderClass: string }> = {

  INI: { label: "INI", tagClass: "bg-purple-500/10 text-purple-400 border border-purple-500/20", borderClass: "border-purple-500" },
  EPI: { label: "EPI", tagClass: "bg-orange-500/10 text-orange-400 border border-orange-500/20", borderClass: "border-orange-500" },
  STY: { label: "STY", tagClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20", borderClass: "border-blue-500" },
  TSK: { label: "TSK", tagClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", borderClass: "border-emerald-500" },
  BUG: { label: "BUG", tagClass: "bg-red-500/10 text-red-400 border border-red-500/20", borderClass: "border-red-500" },
  REV: { label: "REV", tagClass: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20", borderClass: "border-cyan-500" },
  IMP: { label: "IMP", tagClass: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20", borderClass: "border-yellow-500" },
};

export const TaskCard: React.FC<TaskCardProps> = React.memo(({ card, index, onClick, isDragDisabled, allCards = [], columns = [], members = [] }) => {
  const config = typeConfig[card.type];

  // Calculate progress based on children
  let progress = -1;
  const children = allCards.filter(c => c.parentId === card.id);
  if (children.length > 0 && columns.length > 0) {
    const sortedCols = [...columns].sort((a,b) => a.order - b.order);
    const lastColId = sortedCols[sortedCols.length - 1].id;
    const doneChildren = children.filter(c => c.columnId === lastColId).length;
    progress = Math.round((doneChildren / children.length) * 100);
  }

  const assignedMembers = members.filter(m => (card.assignees || []).includes(m.id));

  return (
    <Draggable draggableId={card.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card.id)}
          className={cn(
            "group relative flex flex-col gap-2 rounded-lg border-l-4 bg-bg-surface p-3 transition-colors card-shadow cursor-pointer",
            config.borderClass,
            snapshot.isDragging ? "shadow-xl shadow-black/50 opacity-90 z-50 scale-[1.02]" : "hover:brightness-110"
          )}
          style={provided.draggableProps.style}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1", config.tagClass)}>
              {config.label} {progress >= 0 && <span className="opacity-70">({progress}%)</span>}
            </span>
            <div className="flex items-center gap-2">
              {card.parentId && (
                 <span className="text-[9px] text-slate-600 font-mono" title={`Parent: ${card.parentId}`}>
                    P:#{card.parentId.substring(0, 4)}
                 </span>
              )}
              <span className="text-[9px] text-slate-500 font-mono">#{card.id.substring(0, 4)}</span>
            </div>
          </div>

          <div className="">
            <h4 className="text-xs font-semibold text-slate-200 leading-relaxed overflow-hidden text-ellipsis">
              {card.title}
            </h4>
          </div>

          {((card.startDate || card.dueDate) || assignedMembers.length > 0) && (
            <div className="flex items-center justify-between border-t border-[#1e293b]/50 pt-2 mt-1">
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                {(card.startDate || card.dueDate) && (
                  <>
                    <Calendar className="w-3 h-3" />
                    <span>
                      {card.startDate ? new Date(card.startDate).toLocaleDateString() : '--'} 
                      {" - "} 
                      {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : '--'}
                    </span>
                  </>
                )}
              </div>
              
              {assignedMembers.length > 0 && (
                <div className="flex -space-x-1">
                  {assignedMembers.map(m => (
                    <div key={m.id} title={m.name !== 'Unknown' && m.name ? m.name : m.email} className="w-5 h-5 rounded-full bg-slate-700 border border-[#16181D] flex items-center justify-center text-[8px] font-bold text-slate-300 pointer-events-auto">
                      {m.avatarUrl ? (
                        <img referrerPolicy="no-referrer" src={m.avatarUrl} alt={m.name !== 'Unknown' && m.name ? m.name : m.email} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(m.name !== 'Unknown' && m.name ? m.name : m.email, m.email)
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});
