import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  MessageSquare,
  Link as LinkIcon,
  Send,
  ArrowDown,
  Plus,
  Check,
} from "lucide-react";
import { type Card, type Comment } from "../types";
import { api } from "../services/api";
import { cn, getTypeColor, getInitials } from "../lib/utils";
import { useBoardAccess } from "../hooks/useBoardAccess";
import { CustomSelect } from "./CustomSelect";

const FormattedCardTitle = ({ type, title, className }: { type: string, title?: string, className?: string }) => (
  <span className={cn("truncate", className)}>
    [<span className={getTypeColor(type)}>{type}</span>] {title || ""}
  </span>
);

interface CardDetailsModalProps {
  cardId: string;
  boardId: string;
  onClose: () => void;
  onUpdate: () => void; // Trigger reload on parent
}

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  cardId,
  boardId,
  onClose,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<"detalhes" | "ligacoes">(
    "detalhes",
  );
  const [card, setCard] = useState<Card | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { canEditCards, role } = useBoardAccess(boardId);

  useEffect(() => {
    loadDetails();
  }, [cardId]);

  const loadDetails = async () => {
    const data = await api.getBoardData(boardId);
    const foundCard = data.cards.find((c) => c.id === cardId);
    if (foundCard) {
      setCard(foundCard);
      setDescInput(foundCard.description || "");
      setTitleInput(foundCard.title || "");
    }
    setAllCards(data.cards);

    const currentUser = await api.getCurrentUser();
    let boardMembers = data.members || [];
    if (currentUser && !boardMembers.some((m: any) => m.id === currentUser.id)) {
      boardMembers.push({
        id: currentUser.id,
        boardId: boardId,
        email: currentUser.email || 'Unknown',
        name: currentUser.name || 'Unknown',
        role: 'admin'
      });
    }
    setMembers(boardMembers);

    const cardComments = await api.getComments(cardId);
    setComments(cardComments);
  };

  const handleSaveDesc = async () => {
    if (!canEditCards) return;
    if (card) {
      setErrorMsg("");
      try {
        await api.updateCard(card.id, { description: descInput });
        setIsEditingDesc(false);
        onUpdate();
        loadDetails();
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Erro ao atualizar a descrição.");
      }
    }
  };

  const handleSaveTitle = async () => {
    if (!canEditCards) return;
    if (card && titleInput.trim()) {
      setErrorMsg("");
      try {
        await api.updateCard(card.id, { title: titleInput });
        setIsEditingTitle(false);
        onUpdate();
        loadDetails();
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Erro ao atualizar o título.");
      }
    }
  };

  const handleParentSelect = async (parentId: string) => {
    if (!canEditCards) return;
    if (card) {
      const pId = parentId === "none" ? null : parentId;
      await api.updateCard(card.id, { parentId: pId });
      onUpdate();
      loadDetails();
    }
  };

  const handleDelete = async () => {
    if (!canEditCards) return;
    if (card && deleteConfirm === "EXCLUIR") {
      await api.deleteCard(card.id);
      onUpdate();
      onClose();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditCards) return;
    if (!newComment.trim() || !card) return;
    const currentUser = await api.getCurrentUser();
    await api.addComment(
      card.id,
      newComment,
      currentUser?.name || "Current User",
    );
    setNewComment("");
    loadDetails();
  };

  const handleToggleAssignee = async (memberId: string) => {
    if (!canEditCards) return;
    if (!card) return;
    const currentAssignees = card.assignees || [];
    const newAssignees = currentAssignees.includes(memberId)
      ? currentAssignees.filter((id) => id !== memberId)
      : [...currentAssignees, memberId];
    await api.updateCard(card.id, { assignees: newAssignees });
    onUpdate();
    loadDetails();
  };

  const handleToggleChild = async (childId: string) => {
    if (!canEditCards) return;
    if (!card) return;
    const childC = allCards.find((c) => c.id === childId);
    if (!childC) return;
    const pId = childC.parentId === card.id ? null : card.id;
    await api.updateCard(childId, { parentId: pId });
    onUpdate();
    loadDetails();
  };

  if (!card) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white/5 border-t border-white/10 rounded-2xl shadow-2xl shadow-black w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh] ring-1 ring-white/5"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0A0B0E] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10 flex-1 mr-4">
              <div className="px-2 py-1 rounded bg-white/5 border border-white/10 shrink-0">
                <span className="text-xs font-mono text-slate-400">
                  #{card.id.substring(0, 4)}
                </span>
              </div>
              {isEditingTitle && canEditCards ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    autoFocus
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xl font-bold text-white outline-none focus:border-indigo-500"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') {
                        setIsEditingTitle(false);
                        setTitleInput(card.title);
                      }
                    }}
                  />
                  <button onClick={handleSaveTitle} className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium">Salvar</button>
                  <button onClick={() => { setIsEditingTitle(false); setTitleInput(card.title); }} className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white">Cancelar</button>
                </div>
              ) : (
                <h2 
                  onClick={() => canEditCards && setIsEditingTitle(true)}
                  className={cn("text-xl font-bold text-white tracking-tight truncate", canEditCards && "cursor-pointer hover:text-indigo-300 transition-colors")}
                >
                  {card.title}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors relative z-10 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-white/5 px-6 bg-[#0A0B0E]">
            <button
              onClick={() => setActiveTab("detalhes")}
              className={cn(
                "px-4 py-3.5 text-xs font-bold uppercase tracking-wider relative transition-colors",
                activeTab === "detalhes"
                  ? "text-indigo-400"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              Detalhes
              {activeTab === "detalhes" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("ligacoes")}
              className={cn(
                "px-4 py-3.5 text-xs font-bold uppercase tracking-wider relative transition-colors",
                activeTab === "ligacoes"
                  ? "text-indigo-400"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              Ligações
              {activeTab === "ligacoes" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500"
                />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#0F1117]">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium mb-4">
                {errorMsg}
              </div>
            )}
            {activeTab === "detalhes" ? (
              <div className="flex gap-6">
                <div className="flex-1 space-y-6">
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-300">
                        Descrição
                      </h3>
                      {!isEditingDesc && canEditCards && (
                        <button
                          onClick={() => setIsEditingDesc(true)}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    {isEditingDesc && canEditCards ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:bg-white/10 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                          value={descInput}
                          onChange={(e) => setDescInput(e.target.value)}
                          placeholder="Adicione uma descrição mais detalhada..."
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setIsEditingDesc(false)}
                            className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveDesc}
                            className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-500/20"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "text-sm p-4 rounded-xl bg-white/5 border border-white/5 min-h-[80px] transition-colors hover:bg-white/10",
                          !card.description && "text-slate-500 italic",
                          canEditCards && "cursor-pointer",
                        )}
                        onClick={() => canEditCards && setIsEditingDesc(true)}
                      >
                        {card.description || "Nenhuma descrição informada."}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Comentários
                    </h3>

                    <div className="space-y-4 mb-4">
                      {comments.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          Nenhum comentário ainda.
                        </p>
                      ) : (
                        comments.map((c) => (
                          <div
                            key={c.id}
                            className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-indigo-400">
                                {c.authorName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300">
                              {c.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {canEditCards && (
                      <form
                        onSubmit={handleAddComment}
                        className="flex flex-col gap-2"
                      >
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:bg-white/10 focus:border-indigo-500 transition-all min-h-[140px] resize-none"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Escreva um comentário..."
                        />
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="self-end flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar
                        </button>
                      </form>
                    )}
                  </section>
                </div>

                <aside className="w-72 space-y-6 shrink-0 border-l border-white/5 pl-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-3">
                      Detalhes
                    </h4>
                    <div className="space-y-4 text-sm">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase mb-1">
                          Tipo
                        </span>
                        <CustomSelect
                          value={card.type}
                          disabled={!canEditCards}
                          onChange={async (value) => {
                            if (!canEditCards) return;
                            await api.updateCard(card.id, {
                              type: value as any,
                            });
                            onUpdate();
                            loadDetails();
                          }}
                          options={[
                            { value: "INI", label: <FormattedCardTitle type="INI" title="Iniciativa" className="truncate" /> },
                            { value: "EPI", label: <FormattedCardTitle type="EPI" title="Épico" className="truncate" /> },
                            { value: "STY", label: <FormattedCardTitle type="STY" title="Story" className="truncate" /> },
                            { value: "TSK", label: <FormattedCardTitle type="TSK" title="Tarefa" className="truncate" /> },
                            { value: "BUG", label: <FormattedCardTitle type="BUG" title="Falha" className="truncate" /> },
                            { value: "REV", label: <FormattedCardTitle type="REV" title="Revisão" className="truncate" /> },
                            { value: "IMP", label: <FormattedCardTitle type="IMP" title="Impedimento" className="truncate" /> },
                          ]}
                        />
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase mb-1">
                          Início
                        </span>
                        <input
                          type="date"
                          disabled={!canEditCards}
                          className="w-full bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-2 text-slate-300 outline-none focus:bg-white/10 focus:border-indigo-500 transition-all [color-scheme:dark] disabled:opacity-60"
                          value={
                            card.startDate ? card.startDate.split("T")[0] : ""
                          }
                          onChange={async (e) => {
                            if (!canEditCards) return;
                            await api.updateCard(card.id, {
                              startDate: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : (null as any),
                            });
                            onUpdate();
                            loadDetails();
                          }}
                        />
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase mb-1">
                          Prazo Estimado
                        </span>
                        <input
                          type="date"
                          disabled={!canEditCards}
                          className="w-full bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-2 text-slate-300 outline-none focus:bg-white/10 focus:border-indigo-500 transition-all [color-scheme:dark] disabled:opacity-60"
                          value={card.dueDate ? card.dueDate.split("T")[0] : ""}
                          onChange={async (e) => {
                            if (!canEditCards) return;
                            await api.updateCard(card.id, {
                              dueDate: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : (null as any),
                            });
                            onUpdate();
                            loadDetails();
                          }}
                        />
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase mb-2">
                          Responsáveis
                        </span>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {members
                            .filter(m => (card.assignees || []).includes(m.id))
                            .map(member => (
                              <div
                                key={member.id}
                                className="flex items-center gap-2 bg-white/5 border border-white/10 pl-1 pr-2 py-1.5 rounded-full group hover:border-indigo-500/30 transition-colors"
                              >
                                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                                  {member.avatarUrl ? (
                                    <img referrerPolicy="no-referrer" src={member.avatarUrl} alt={member.name !== 'Unknown' ? member.name : member.email} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    getInitials(member.name !== 'Unknown' ? member.name : member.email, member.email)
                                  )}
                                </div>
                                <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                                  {member.name !== 'Unknown' && member.name ? member.name : member.email.split('@')[0]}
                                </span>
                                {canEditCards && (
                                  <button
                                    onClick={() => handleToggleAssignee(member.id)}
                                    className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
                                    title="Remover responsável"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          
                          {(card.assignees || []).length === 0 && (
                            <span className="text-xs text-slate-500 italic py-1">
                              Nenhum responsável definido
                            </span>
                          )}
                        </div>

                        {canEditCards && members.length > 0 && (
                          <div className="mt-2 text-left">
                            <details className="group">
                              <summary className="list-none w-full flex items-center justify-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer p-2 rounded-lg hover:bg-indigo-500/10 transition-colors border border-dashed border-indigo-500/30 hover:border-indigo-500/50">
                                <Plus className="w-3.5 h-3.5" />
                                Gerenciar responsáveis...
                              </summary>
                              
                              <div className="mt-2 bg-[#13151A] border border-white/10 rounded-xl overflow-hidden ring-1 ring-white/5 p-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                                {members.map(member => {
                                  const isAssigned = (card.assignees || []).includes(member.id);
                                  return (
                                    <label
                                      key={member.id}
                                      className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors hover:bg-white/5"
                                    >
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isAssigned}
                                        onChange={() => handleToggleAssignee(member.id)}
                                      />
                                      <div className={cn(
                                        "w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0",
                                        isAssigned 
                                          ? "bg-indigo-500 border-indigo-500 text-white" 
                                          : "border-slate-600 bg-black/20"
                                      )}>
                                        {isAssigned && <Check className="w-3 h-3" />}
                                      </div>
                                      
                                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                                        {member.avatarUrl ? (
                                          <img referrerPolicy="no-referrer" src={member.avatarUrl} alt={member.name !== 'Unknown' ? member.name : member.email} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                          getInitials(member.name !== 'Unknown' ? member.name : member.email, member.email)
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-col overflow-hidden">
                                        <span className="text-slate-200 text-xs font-medium truncate">
                                          {member.name !== 'Unknown' && member.name ? member.name : member.email.split('@')[0]}
                                        </span>
                                        {member.name !== 'Unknown' && member.name && (
                                          <span className="text-slate-500 text-[10px] truncate mt-0.5">
                                            {member.email}
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                        )}
                        {members.length === 0 && (
                          <div className="text-xs text-slate-500 italic mt-2">
                             Nenhum membro no projeto
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {role === "admin" && (
                    <div className="mt-8 pt-6 border-t border-red-500/10">
                      {!showDelete ? (
                        <button
                          onClick={() => setShowDelete(true)}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors border border-red-500/20"
                        >
                          Excluir este card
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[10px] text-red-300/70">
                            Digite <strong>EXCLUIR</strong>:
                          </p>
                          <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            className="w-full bg-white/5 border border-red-500/30 rounded-lg text-xs px-3 py-2 text-slate-200 outline-none focus:border-red-500 transition-colors"
                            placeholder="EXCLUIR"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDelete(false)}
                              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={deleteConfirm !== "EXCLUIR"}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors font-medium"
                            >
                              Confirmar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </aside>
              </div>
            ) : (
              <div className="flex gap-6">
                <div className="flex-1 max-w-md mx-auto space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center justify-center gap-2 mb-4">
                      <LinkIcon className="w-3.5 h-3.5" /> Ancestralidade
                    </h4>

                    {/* Flowchart visual */}
                    <div className="mb-6 flex flex-col items-center">
                      {(() => {
                        const parent = allCards.find(
                          (c) => c.id === card.parentId,
                        );
                        if (parent) {
                          return (
                            <div className="w-full border border-white/10 bg-white/5 p-3 rounded-xl text-sm text-center text-slate-300 truncate font-mono">
                              <FormattedCardTitle type={parent.type} title={parent.title} />
                            </div>
                          );
                        }
                        return (
                          <div className="w-full border border-dashed border-white/10 p-3 rounded-xl text-sm text-center text-slate-500 italic">
                            Nenhum pai vinculado
                          </div>
                        );
                      })()}
                      <ArrowDown className="w-5 h-5 text-indigo-500/50 my-2" />
                      <div className="w-full border border-indigo-500/50 bg-indigo-500/10 p-3 rounded-xl text-sm text-center text-indigo-300 font-bold truncate font-mono shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]">
                        <FormattedCardTitle type={card.type} title={card.title} />
                      </div>
                      <ArrowDown className="w-5 h-5 text-indigo-500/50 my-2" />
                      {(() => {
                        const children = allCards.filter(
                          (c) => c.parentId === card.id,
                        );
                        if (children.length > 0) {
                          return (
                            <div className="w-full space-y-2">
                              {children.map((child) => (
                                <div
                                  key={child.id}
                                  className="w-full border border-white/10 bg-white/5 p-3 rounded-xl text-sm text-center text-slate-300 truncate font-mono"
                                >
                                  <FormattedCardTitle type={child.type} title={child.title} />
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div className="w-full border border-dashed border-white/10 p-3 rounded-xl text-sm text-center text-slate-500 italic">
                            Nenhum filho vinculado
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {canEditCards && (
                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">
                          Definir Pai
                        </h4>
                        <CustomSelect
                          value={card.parentId || "none"}
                          onChange={(value) => handleParentSelect(value)}
                          options={[
                            { value: "none", label: "Nenhum pai vinculado" },
                            ...allCards
                              .filter((c) => c.id !== card.id && c.parentId !== card.id)
                              .map((c) => ({
                                value: c.id,
                                label: <FormattedCardTitle type={c.type} title={c.title} className="truncate" />
                              }))
                          ]}
                        />
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">
                          Adicionar/Remover Filhos
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border border-white/5 rounded-xl p-3 bg-white/5">
                          {allCards
                            .filter(
                              (c) =>
                                c.id !== card.id &&
                                c.id !== card.parentId &&
                                (!c.parentId || c.parentId === card.id),
                            )
                            .map((c) => {
                              const isChild = c.parentId === card.id;
                              return (
                                <label
                                  key={c.id}
                                  className={cn(
                                    "flex flex-col gap-0.5 text-xs cursor-pointer p-2.5 rounded-lg transition-all border",
                                    isChild
                                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-200 shadow-sm"
                                      : "bg-transparent border-transparent text-slate-300 hover:bg-white/5",
                                  )}
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <FormattedCardTitle type={c.type} title={c.title} className="font-medium" />
                                    <input
                                      type="checkbox"
                                      checked={isChild}
                                      onChange={() => handleToggleChild(c.id)}
                                      className="accent-indigo-500 w-3.5 h-3.5"
                                    />
                                  </div>
                                </label>
                              );
                            })}
                          {allCards.filter(
                            (c) =>
                              c.id !== card.id &&
                              c.id !== card.parentId &&
                              (!c.parentId || c.parentId === card.id),
                          ).length === 0 && (
                            <div className="text-xs text-slate-500 p-2 text-center">
                              Nenhum card disponível.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
