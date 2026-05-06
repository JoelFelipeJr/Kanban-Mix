import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  LayoutTemplate,
  Rows3,
  PlusSquare,
  Users,
  Link2,
  Trash2,
  MailPlus,
  UserCircle,
  LogOut,
  FolderKanban,
  Pencil,
} from "lucide-react";
import { type Member, type UsefulLink, type Column, type Card } from "../types";
import { api } from "../services/api";
import { cn, getTypeColor, getInitials } from "../lib/utils";
import { CustomSelect } from "./CustomSelect";

const FormattedCardTitle = ({ type, title, className }: { type: string, title?: string, className?: string }) => (
  <span className={cn("truncate", className)}>
    [<span className={getTypeColor(type)}>{type}</span>] {title || ""}
  </span>
);

export const CreateBoardModal = ({ onClose, onSubmit }: any) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cols, setCols] = useState([
    { name: "To Do" },
    { name: "In Progress" },
    { name: "Done" },
  ]);
  const [swims, setSwims] = useState([{ name: "Geral" }]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/5 border-t border-white/10 rounded-2xl shadow-2xl shadow-black max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col ring-1 ring-indigo-500/20"
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none" />
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 relative z-10">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-white relative z-10">
            Criar Novo Board
          </h2>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-[#0F1117]">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Nome do Board
            </label>
            <input
              autoFocus
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
              placeholder="Ex: Projeto Integrador"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Descrição
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 min-h-[60px] resize-none"
              placeholder="Opcional. Ex: Planejamento Q3..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Colunas
              </label>
              <button
                onClick={() => setCols([...cols, { name: "" }])}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Adicionar Coluna
              </button>
            </div>
            <div className="space-y-2">
              {cols.map((col, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    value={col.name}
                    onChange={(e) => {
                      const newCols = [...cols];
                      newCols[idx].name = e.target.value;
                      setCols(newCols);
                    }}
                    placeholder={`Coluna ${idx + 1}`}
                  />
                  <button
                    onClick={() => setCols(cols.filter((_, i) => i !== idx))}
                    className="px-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Raias (Swimlanes)
              </label>
              <button
                onClick={() => setSwims([...swims, { name: "" }])}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Adicionar Raia
              </button>
            </div>
            <div className="space-y-2">
              {swims.map((swim, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    value={swim.name}
                    onChange={(e) => {
                      const newSwims = [...swims];
                      newSwims[idx].name = e.target.value;
                      setSwims(newSwims);
                    }}
                    placeholder={`Raia ${idx + 1}`}
                  />
                  <button
                    onClick={() => setSwims(swims.filter((_, i) => i !== idx))}
                    className="px-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg hover:bg-white/5 text-slate-300 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onSubmit(
                name,
                description,
                cols.map((c) => c.name).filter(Boolean),
                swims.map((s) => s.name).filter(Boolean),
              )
            }
            disabled={!name.trim()}
            className="px-4 py-2 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20"
          >
            Criar Board
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const CreateCardModal = ({ boardId, onClose, onSubmit }: any) => {
  const [selectedBoardId, setSelectedBoardId] = useState(boardId);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("TSK");
  const [colId, setColId] = useState("");
  const [parentId, setParentId] = useState("");

  const [boards, setBoards] = useState<any[]>([]);
  const [cols, setCols] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    api.getAllBoards().then((bs) => setBoards(bs));
  }, []);

  useEffect(() => {
    if (!selectedBoardId) return;
    api.getBoardData(selectedBoardId).then((data) => {
      setCols(data.columns);
      if (data.columns.length > 0) setColId(data.columns[0].id);
      else setColId("");
      setCards(data.cards);
    });
  }, [selectedBoardId]);

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
          className="bg-white/5 border-t border-white/10 rounded-2xl shadow-2xl shadow-black max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-indigo-500/20"
        >
          <div className="flex items-center gap-3 p-5 border-b border-white/5 relative overflow-hidden bg-[#0A0B0E]">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none" />
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 relative z-10">
              <PlusSquare className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white relative z-10">
              Criar Novo Card
            </h2>
            <button
              onClick={onClose}
              className="ml-auto p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-[#0F1117]">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Board Destino
              </label>
              <CustomSelect
                value={selectedBoardId}
                onChange={(value) => setSelectedBoardId(value)}
                options={boards.map((b) => ({ value: b.id, label: b.name }))}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Título
              </label>
              <input
                autoFocus
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Descrição
              </label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 min-h-[60px]"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Tipo
                </label>
                <CustomSelect
                  value={type}
                  onChange={(value) => setType(value)}
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Coluna Inicial
                </label>
                <CustomSelect
                  value={colId}
                  onChange={(value) => setColId(value)}
                  disabled={cols.length === 0}
                  options={cols.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Relacionar com Pai
              </label>
              <CustomSelect
                value={parentId}
                onChange={(value) => setParentId(value)}
                options={[
                  { value: "", label: "Nenhum" },
                  ...cards.map((c) => ({
                    value: c.id,
                    label: <FormattedCardTitle type={c.type} title={c.title} className="truncate" />
                  }))
                ]}
              />
            </div>
          </div>
          <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg hover:bg-white/5 text-slate-300 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() =>
                onSubmit({
                  boardId: selectedBoardId,
                  title,
                  desc,
                  type,
                  colId,
                  parentId,
                })
              }
              disabled={!title.trim() || !colId}
              className="px-4 py-2 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20"
            >
              Criar Card
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const ProfileModal = ({
  currentUser,
  onClose,
  onProfileUpdate,
  onLogout,
}: any) => {
  const [view, setView] = useState("profile"); // profile | settings | password
  const [firstName, setFirstName] = useState(
    () => (currentUser.name || "").split(" ")[0] || "",
  );
  const [lastName, setLastName] = useState(
    () => (currentUser.name || "").split(" ").slice(1).join(" ") || "",
  );
  const [company, setCompany] = useState(currentUser.company || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${firstName} ${lastName}`.trim();
    try {
      await api.updateCurrentUser({
        name: name || currentUser.name,
        avatarUrl: avatarUrl,
        company,
      });
      onProfileUpdate(); // Triggers global refresh
      setView("profile");
    } catch (err: any) {
      alert("Erro ao salvar perfil: " + (err.message || err));
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (password !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("A senha nova deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      await api.updatePassword(currentPassword, password);
      setPasswordSuccess("Senha atualizada com sucesso!");
      setTimeout(() => setView("profile"), 2000);
    } catch (err: any) {
      setPasswordError(err.message || "Erro ao atualizar senha.");
    }
  };

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
          className="bg-white/5 border-t border-white/10 rounded-2xl shadow-2xl shadow-black w-full max-w-sm flex flex-col overflow-hidden min-h-[300px] ring-1 ring-white/5"
        >
          {view === "profile" ? (
            <>
              <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-[#0A0B0E] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 relative z-10">
                  <UserCircle className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-white relative z-10">
                  Meu Perfil
                </h2>
                <button
                  onClick={onClose}
                  className="ml-auto p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors relative z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  {currentUser.avatarUrl ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={currentUser.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border border-indigo-500/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl font-bold uppercase">
                      {getInitials(currentUser.name, currentUser.email)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {currentUser.name || currentUser.email}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-white/10 truncate">
                      {currentUser.company || "Sem empresa"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <button
                    onClick={() => setView("password")}
                    className="w-full text-left px-3 py-2 text-xs rounded-md bg-[#0F1117] hover:bg-slate-800 border border-white/10 text-slate-300 transition-colors"
                  >
                    Alterar Senha
                  </button>
                  <button
                    onClick={() => setView("settings")}
                    className="w-full text-left px-3 py-2 text-xs rounded-md bg-[#0F1117] hover:bg-slate-800 border border-white/10 text-slate-300 transition-colors"
                  >
                    Configurações da Conta
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/20 transition-colors mt-4"
                  >
                    Sair da conta <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : view === "settings" ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
                <button
                  onClick={() => setView("profile")}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <LayoutTemplate className="w-4 h-4 rotate-90" />
                </button>
                <h2 className="text-sm font-semibold text-slate-100">
                  Configurações
                </h2>
                <button
                  onClick={onClose}
                  className="ml-auto p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Nome
                    </label>
                    <input
                      autoFocus
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Email (Leitura)
                  </label>
                  <input
                    type="email"
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-500 outline-none cursor-not-allowed opacity-70"
                    value={currentUser.email || ""}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Empresa
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Foto de Perfil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement("canvas");
                            const maxSize = 120;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > maxSize) {
                                height *= maxSize / width;
                                width = maxSize;
                              }
                            } else {
                              if (height > maxSize) {
                                width *= maxSize / height;
                                height = maxSize;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              const dataUrl = canvas.toDataURL(
                                "image/jpeg",
                                0.7,
                              );
                              setAvatarUrl(dataUrl);
                            }
                          };
                          img.src = e.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!firstName}
                    className="w-full px-3 py-2 text-xs rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
                <button
                  onClick={() => setView("profile")}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <LayoutTemplate className="w-4 h-4 rotate-90" />
                </button>
                <h2 className="text-sm font-semibold text-slate-100">
                  Alterar Senha
                </h2>
                <button
                  onClick={onClose}
                  className="ml-auto p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSavePassword} className="p-6 space-y-4">
                {passwordError && (
                  <div className="text-xs text-red-400 mb-2">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="text-xs text-green-400 mb-2">
                    {passwordSuccess}
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Senha Atual
                  </label>
                  <input
                    autoFocus
                    type="password"
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      !currentPassword ||
                      !password ||
                      !confirmPassword ||
                      !!passwordSuccess
                    }
                    className="w-full px-3 py-2 text-xs rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium"
                  >
                    Salvar Senha
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const EditBoardModal = ({ boardId, onClose, onSubmit, onDelete }: any) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cols, setCols] = useState<any[]>([]);
  const [swims, setSwims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    api.getBoardData(boardId).then((data) => {
      setName(data.board?.name || "");
      setDescription(data.board?.description || "");
      setCols(data.columns || []);
      setSwims(data.swimlanes || []);
      setLoading(false);
    });
  }, [boardId]);

  if (loading) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg("");
    try {
      await onSubmit(
        boardId,
        name,
        description,
        cols.filter((c) => c.name.trim()),
        swims.filter((s) => s.name.trim())
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Erro desconhecido ao salvar o board.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-[#0A0B0E] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-w-lg w-full max-h-[90vh] overflow-hidden relative overflow-hidden"
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none" />
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 relative z-10">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-white relative z-10">
            Editar Board
          </h2>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-[#0F1117]">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Nome do Board
            </label>
            <input
              autoFocus
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Descrição
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 min-h-[60px] resize-none"
              placeholder="Opcional. Ex: Responsável pelo RH..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Colunas
              </label>
              <button
                onClick={() => setCols([...cols, { name: "" }])}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Adicionar Coluna
              </button>
            </div>
            <div className="space-y-2">
              {cols.map((col, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    value={col.name}
                    onChange={(e) => {
                      const newCols = [...cols];
                      newCols[idx].name = e.target.value;
                      setCols(newCols);
                    }}
                    placeholder={`Coluna ${idx + 1}`}
                  />
                  <button
                    onClick={() => setCols(cols.filter((_, i) => i !== idx))}
                    className="px-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Raias (Swimlanes)
              </label>
              <button
                onClick={() => setSwims([...swims, { name: "" }])}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Adicionar Raia
              </button>
            </div>
            <div className="space-y-2">
              {swims.map((swim, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    value={swim.name}
                    onChange={(e) => {
                      const newSwims = [...swims];
                      newSwims[idx].name = e.target.value;
                      setSwims(newSwims);
                    }}
                    placeholder={`Raia ${idx + 1}`}
                  />
                  <button
                    onClick={() => setSwims(swims.filter((_, i) => i !== idx))}
                    className="px-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/5 bg-white/5 flex justify-between gap-2 shrink-0">
          <div>
            {onDelete && (
              !showConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="px-4 py-2 text-xs rounded-lg text-red-500 hover:text-white hover:bg-red-500/20 font-medium transition-colors"
                >
                  Excluir este board
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    placeholder="Digite EXCLUIR" 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="bg-white/5 border border-red-500/30 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-500 w-32 placeholder:text-red-500/50"
                  />
                  <button
                    onClick={() => onDelete(boardId)}
                    disabled={confirmText !== "EXCLUIR"}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white text-xs rounded-lg transition-colors font-medium border border-red-500"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                    className="px-3 py-1.5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg hover:bg-white/5 text-slate-300 font-medium transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className={cn(
                "px-4 py-2 text-xs rounded-lg text-white font-semibold shadow-lg transition-colors flex items-center gap-2",
                saveSuccess
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20",
                isSaving && "opacity-75 cursor-wait"
              )}
            >
              {isSaving ? "Salvando..." : saveSuccess ? "Salvo!" : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const SelectBoardModal = ({
  onClose,
  onSelect,
  onCreateNew,
  onEditBoard,
}: any) => {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllBoards().then((bs) => {
      setBoards(bs);
      setLoading(false);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/5 border-t border-white/10 rounded-2xl shadow-2xl shadow-black max-w-4xl w-full overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-indigo-500/20"
      >
        <div className="flex items-center gap-4 p-6 border-b border-white/5 relative overflow-hidden bg-[#0A0B0E]">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 relative z-10">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white tracking-tight mb-1">
              Meus Boards
            </h2>
            <p className="text-sm text-indigo-200/60">
              Selecione um board para trabalhar ou crie um novo
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 bg-[#0F1117] flex-1">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Carregando boards...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={onCreateNew}
                className="group flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-indigo-400"
              >
                <PlusSquare className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0" />
                <span className="text-sm font-semibold">Criar Novo Board</span>
              </button>

              {boards.map((b) => (
                <div key={b.id} className="relative group">
                  <button
                    onClick={() => onSelect(b.id)}
                    className="flex flex-col text-left h-36 p-5 rounded-xl border border-white/5 hover:border-indigo-500/50 bg-white/5 hover:bg-white/10 transition-all shadow-lg shadow-black/20 w-full relative overflow-hidden"
                  >
                    <div className="w-10 h-10 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                      <LayoutTemplate className="w-5 h-5 shrink-0" />
                    </div>
                    <h3 className="text-sm font-bold text-white truncate w-full group-hover:text-indigo-300">
                      {b.name}
                    </h3>
                    <div className="mt-auto text-xs text-indigo-200/50 line-clamp-2 leading-tight">
                      {b.description || "Sem descrição"}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBoard(b.id);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-[#0F1117]/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Editar Board"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const CreateSwimlaneModal = ({ boardId, onClose, onSubmit }: any) => {
  const [selectedBoardId, setSelectedBoardId] = useState(boardId);
  const [name, setName] = useState("");
  const [boards, setBoards] = useState<any[]>([]);

  useEffect(() => {
    api.getAllBoards().then((bs) => setBoards(bs));
  }, []);

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
          className="bg-white/5 border-t border-white/10 rounded-2xl shadow-2xl shadow-black max-w-sm w-full overflow-hidden flex flex-col ring-1 ring-indigo-500/20"
        >
          <div className="flex items-center gap-3 p-5 border-b border-white/5 relative overflow-hidden bg-[#0A0B0E]">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none" />
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 relative z-10">
              <Rows3 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white relative z-10">
              Nova Raia
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit({ boardId: selectedBoardId, name });
            }}
            className="p-6 space-y-4 bg-[#0F1117]"
          >
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Board Destino
              </label>
              <CustomSelect
                value={selectedBoardId}
                onChange={(value) => setSelectedBoardId(value)}
                options={boards.map((b) => ({ value: b.id, label: b.name }))}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Nome da Raia
              </label>
              <input
                autoFocus
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                placeholder="Ex: Tarefas Extras"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs rounded hover:bg-white/5 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !selectedBoardId}
                className="px-3 py-1.5 text-xs rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium shadow-lg shadow-indigo-500/20"
              >
                Criar Raia
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const TeamModal = ({
  members,
  currentUserRole,
  onClose,
  onInvite,
  onRoleChange,
}: any) => {
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F1117] border border-white/10 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">Equipe</h2>
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
          {members.map((member: Member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-md"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 shrink-0 rounded-md bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 overflow-hidden">
                  {member.avatarUrl ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={member.avatarUrl}
                      alt={member.name !== 'Unknown' ? member.name : member.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(member.name !== 'Unknown' ? member.name : member.email, member.email)
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs text-slate-200 truncate font-medium"
                    title={member.name !== 'Unknown' ? member.name : member.email}
                  >
                    {member.name !== 'Unknown' && member.name ? member.name : (member.email !== 'Unknown' && member.email ? member.email : 'Unknown')}
                  </span>
                  {member.name !== 'Unknown' && member.name && member.email !== 'Unknown' && member.email && (
                    <span className="text-[10px] text-slate-500 truncate" title={member.email}>
                      {member.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentUserRole === "admin" ? (
                  <CustomSelect
                    className="w-24 text-[10px]"
                    value={member.role}
                    onChange={(value) => onRoleChange(member.id, value)}
                    options={[
                      { value: "admin", label: "Admin" },
                      { value: "member", label: "Membro" },
                      { value: "reader", label: "Leitor" }
                    ]}
                  />
                ) : (
                  <span className="text-[10px] text-indigo-400 font-mono shrink-0 ml-2 border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {currentUserRole === "admin" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onInvite(email, inviteRole);
              setEmail("");
              setInviteRole("member");
            }}
            className="p-4 border-t border-white/10 bg-white/5"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-[#0F1117] border border-white/10 rounded-md overflow-hidden focus-within:border-indigo-500/50 transition-colors">
                <input
                  type="email"
                  placeholder="Convidar e-mail..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-xs px-3 py-2 text-slate-200 outline-none placeholder:text-slate-600 min-w-0"
                />
              </div>
              <div className="w-28 shrink-0">
                <CustomSelect
                  className="text-xs"
                  value={inviteRole}
                  onChange={(value) => setInviteRole(value)}
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "member", label: "Membro" },
                    { value: "reader", label: "Leitor" }
                  ]}
                />
              </div>
              <button
                type="submit"
                disabled={!email}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs px-3 py-2 transition-colors flex items-center justify-center shrink-0"
              >
                Convidar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const LinksModal = ({
  links,
  onClose,
  onAdd,
  onRemove,
  canEdit = true,
}: any) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F1117] border border-white/10 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
          <Link2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">Links Úteis</h2>
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
          {links.map((link: UsefulLink) => (
            <div
              key={link.id}
              className="group flex items-start justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-md"
            >
              <div className="flex-1 overflow-hidden pr-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-slate-300 font-medium hover:text-white transition-colors truncate"
                  title={link.url}
                >
                  {link.title}
                </a>
                <div className="text-[10px] text-slate-500 truncate italic mt-0.5">
                  {link.description || link.url}
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() => onRemove(link.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-4">
              Nenhum link útil adicionado.
            </p>
          )}
        </div>
        {canEdit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAdd(title, url, description);
              setTitle("");
              setUrl("");
              setDescription("");
            }}
            className="p-4 border-t border-white/10 bg-white/5 space-y-2"
          >
            <input
              type="text"
              placeholder="Título do link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPaste={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full bg-[#0F1117] border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onPaste={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full bg-[#0F1117] border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="flex-1 bg-[#0F1117] border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!title || !url}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs px-3 py-2 font-medium transition-colors"
              >
                Adicionar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
