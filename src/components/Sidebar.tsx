import React, { useState, useEffect } from "react";
import { FolderKanban, Link2, Users, ChevronLeft, ChevronRight, PlusSquare, LayoutTemplate, Rows3, Settings } from "lucide-react";
import { api } from "../services/api";
import type { Member, UsefulLink } from "../types";
import { cn, getInitials } from "../lib/utils";
import { TeamModal, LinksModal, CreateBoardModal, CreateCardModal, ProfileModal, SelectBoardModal, CreateSwimlaneModal, EditBoardModal } from "./SidebarModals";
import { useBoardAccess } from "../hooks/useBoardAccess";

export function Sidebar({ boardId, onBoardChange, onGlobalUpdate, refreshTrigger, onLogout }: { boardId: string, onBoardChange: (id: string) => void, onGlobalUpdate: () => void, refreshTrigger?: number, onLogout?: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({});

  const { role: userRole, canManageTeam, canEditCards, canEditBoard } = useBoardAccess(boardId);

  // Modal states
  const [modalType, setModalType] = useState<"BOARD" | "SWIMLANE" | "CARD" | "TEAM" | "LINKS" | "PROFILE" | "SELECT_BOARD" | "EDIT_BOARD" | null>(null);
  const [editBoardId, setEditBoardId] = useState<string | null>(null);

  useEffect(() => {
    loadSidebarData();
  }, [boardId, refreshTrigger]);

  const loadSidebarData = async () => {
    const user = await api.getCurrentUser();
    setCurrentUser(user || {});
    
    if (boardId) {
      try {
        const data = await api.getBoardData(boardId);
        setMembers(data.members || []);
        setLinks(data.links || []);
      } catch (err) {
        setMembers([]);
        setLinks([]);
      }
    }
  };

  const handleInvite = async (email: string, role: string) => {
    if (!email || !canManageTeam) return;
    try {
      await api.addMember(boardId, email, role);
      loadSidebarData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!canManageTeam) return;
    try {
      await api.changeMemberRole(boardId, memberId, newRole);
      loadSidebarData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddLink = async (title: string, url: string, description?: string) => {
    if (!title || !url) return;
    await api.addLink(boardId, title, url, description);
    loadSidebarData();
  };

  const handleRemoveLink = async (id: string) => {
    await api.removeLink(id);
    loadSidebarData();
  };

  const handleCreateBoard = async (name: string, description: string, cols: string[], swims: string[]) => {
    try {
      const newBoard = await api.addBoard(name, description, cols, swims);
      if (!newBoard) {
        console.error("Failed to create board (returned null)");
        return;
      }
      setModalType(null);
      onBoardChange(newBoard.id);
      onGlobalUpdate();
    } catch (err: any) {
      alert(err.message || "Falha ao criar o board");
    }
  };

  const handleCreateSwimlane = async (data: any) => {
    await api.addSwimlane(data.boardId, data.name);
    setModalType(null);
    onGlobalUpdate();
  };

  const handleCreateCard = async (data: any) => {
    try {
      await api.addCard(data.boardId, data.title, data.type, data.colId, data.desc, data.parentId);
      setModalType(null);
      onGlobalUpdate();
    } catch (err: any) {
      alert(err.message || "Falha ao criar o card");
    }
  };

  const handleEditBoard = async (bid: string, name: string, description: string, cols: any[], swims: any[]) => {
    await api.updateBoardSettings(bid, name, description, cols, swims);
    onGlobalUpdate();
  };

  const handleDeleteBoard = async (bid: string) => {
    try {
      await api.deleteBoard(bid);
      setModalType(null);
      setEditBoardId(null);
      onBoardChange("");
      onGlobalUpdate();
    } catch (err: any) {
      alert(err.message || "Falha ao excluir o board");
    }
  };

  return (
    <div className={cn("border-r border-[#1e293b] bg-[#0F1117] flex flex-col h-full shrink-0 transition-all duration-300 relative", isCollapsed ? "w-16" : "w-64")}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-5 w-6 h-6 bg-[#1e293b] rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-indigo-600 transition-colors z-50 border border-[#0B0C10]"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand */}
      <div className={cn("p-6 flex items-center gap-3 shrink-0 h-16 border-b border-[#1e293b]", isCollapsed && "justify-center !px-0")}>
        <div className="w-8 h-8 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
          K
        </div>
        {!isCollapsed && (
          <h1 className="font-bold text-white tracking-tight leading-none whitespace-nowrap overflow-hidden">
            KANBAN MIX
          </h1>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 py-4 px-4">
        <div className="space-y-1">
          <button onClick={() => setModalType("SELECT_BOARD")} className={cn("w-full flex items-center gap-2 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 group", isCollapsed ? "justify-center px-0" : "px-2")}>
            <FolderKanban className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
            {!isCollapsed && <span className="text-xs font-medium truncate">Meus Boards</span>}
          </button>
          {!boardId && (
            <button onClick={() => setModalType("BOARD")} className={cn("w-full flex items-center gap-2 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 group", isCollapsed ? "justify-center px-0" : "px-2")}>
               <PlusSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
               {!isCollapsed && <span className="text-xs font-medium truncate">Novo Board</span>}
            </button>
          )}
          {boardId && canEditBoard && (
            <button onClick={() => setModalType("SWIMLANE")} className={cn("w-full flex items-center gap-2 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 group", isCollapsed ? "justify-center px-0" : "px-2")}>
              <Rows3 className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
              {!isCollapsed && <span className="text-xs font-medium truncate">Nova Raia</span>}
            </button>
          )}
          {boardId && canEditCards && (
            <button onClick={() => setModalType("CARD")} className={cn("w-full flex items-center gap-2 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 group", isCollapsed ? "justify-center px-0" : "px-2")}>
              <PlusSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
              {!isCollapsed && <span className="text-xs font-medium truncate">Novo Card</span>}
            </button>
          )}
        </div>

        <div className="space-y-1">
          {boardId && (
            <>
              <button onClick={() => setModalType("TEAM")} className={cn("w-full flex items-center gap-2 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 group", isCollapsed ? "justify-center px-0" : "px-2")}>
                <Users className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                {!isCollapsed && <span className="text-xs font-medium truncate">Equipe</span>}
              </button>
              <button onClick={() => setModalType("LINKS")} className={cn("w-full flex items-center gap-2 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 group", isCollapsed ? "justify-center px-0" : "px-2")}>
                <Link2 className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                {!isCollapsed && <span className="text-xs font-medium truncate">Links Úteis</span>}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Profile Section Footer */}
      <div className="shrink-0 p-4 border-t border-[#1e293b]/50">
        <div className="space-y-2">
          <button 
            onClick={() => setModalType("PROFILE")}
            className={cn("w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-800 transition-colors", isCollapsed && "justify-center")}
          >
          {currentUser.avatarUrl ? (
             <img referrerPolicy="no-referrer" src={currentUser.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-indigo-500/30 shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-500/30">
              {getInitials(currentUser.name, currentUser.email)}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.name || currentUser.email || 'Usuário'}</p>
              <p className="text-[10px] text-slate-500 truncate font-mono uppercase">{boardId ? (userRole !== 'none' ? userRole : 'Sem acesso') : 'Navegando'}</p>
            </div>
          )}
        </button>
        </div>
      </div>

      {/* Modals */}
      {modalType === "BOARD" && (
        <CreateBoardModal onClose={() => setModalType(null)} onSubmit={handleCreateBoard} />
      )}
      {modalType === "SWIMLANE" && (
        <CreateSwimlaneModal boardId={boardId} onClose={() => setModalType(null)} onSubmit={handleCreateSwimlane} />
      )}
      {modalType === "CARD" && (
        <CreateCardModal boardId={boardId} onClose={() => setModalType(null)} onSubmit={handleCreateCard} />
      )}
      {modalType === "TEAM" && (
        <TeamModal members={members} currentUserRole={userRole} onClose={() => setModalType(null)} onInvite={handleInvite} onRoleChange={handleRoleChange} />
      )}
      {modalType === "LINKS" && (
        <LinksModal links={links} onClose={() => setModalType(null)} onAdd={handleAddLink} onRemove={handleRemoveLink} canEdit={canEditCards} />
      )}
      {modalType === "PROFILE" && (
        <ProfileModal currentUser={currentUser} onClose={() => setModalType(null)} onProfileUpdate={onGlobalUpdate} onLogout={onLogout} />
      )}
      {modalType === "SELECT_BOARD" && (
        <SelectBoardModal 
          onClose={() => setModalType(null)} 
          onSelect={(id: string) => { setModalType(null); onBoardChange(id); }} 
          onCreateNew={() => setModalType("BOARD")}
          onEditBoard={(id: string) => { setEditBoardId(id); setModalType("EDIT_BOARD"); }}
        />
      )}
      {modalType === "EDIT_BOARD" && editBoardId && (
        <EditBoardModal 
          boardId={editBoardId} 
          onClose={() => { setModalType(null); setEditBoardId(null); }} 
          onSubmit={handleEditBoard} 
          onDelete={handleDeleteBoard}
        />
      )}
    </div>
  );
}
