import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { KanbanBoard } from "./components/KanbanBoard";
import { Auth } from "./components/Auth";
import { supabase } from "./lib/supabase";
import { api } from "./services/api";

export default function App() {
  const [activeBoardId, setActiveBoardId] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Check current session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted) {
          if (localStorage.getItem('preventAutoLogin') === 'true') {
             setIsAuthenticated(false);
          } else {
             if (session && !session.user.email_confirmed_at) {
               supabase.auth.signOut();
               setIsAuthenticated(false);
             } else {
               setIsAuthenticated(!!session);
               if (session) {
                 loadInitialBoard();
               }
             }
          }
          setAuthLoading(false);
        }
      }).catch((err) => {
        console.error("Session error:", err);
        if (mounted) setAuthLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        
        // Se formos deslogar logo apos criar conta, nao faça a transicao de tela
        if (localStorage.getItem('preventAutoLogin') === 'true') {
          return;
        }
        
        // Lidar explicitamente com eventos para evitar flickers
        if (event === 'SIGNED_OUT') {
           setIsAuthenticated(false);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
           if (session && !session.user.email_confirmed_at) {
             supabase.auth.signOut();
             setIsAuthenticated(false);
             return;
           }
           setIsAuthenticated(true);
           if (session) {
             loadInitialBoard();
           }
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      // Mock flow
      setAuthLoading(false);
      loadInitialBoard();
    }
  }, []);

  const loadInitialBoard = async () => {
    try {
      const boards = await api.getAllBoards();
      if (boards && boards.length > 0) {
        setActiveBoardId(boards[0].id);
      } else {
        setActiveBoardId("");
      }
    } catch (e) {
      console.error(e);
      setActiveBoardId("");
    }
  };

  const handleGlobalUpdate = React.useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleLogout = React.useCallback(() => {
    if (supabase) {
      supabase.auth.signOut();
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0C10] text-slate-400">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-bg-base text-slate-200 overflow-hidden font-sans">
      <Sidebar 
        boardId={activeBoardId} 
        onBoardChange={setActiveBoardId}
        onGlobalUpdate={handleGlobalUpdate} 
        refreshTrigger={refreshTrigger}
        onLogout={handleLogout}
      />
      {activeBoardId ? (
        <KanbanBoard boardId={activeBoardId} refreshTrigger={refreshTrigger} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-bg-base text-slate-400">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <p className="text-sm font-medium">Nenhum board selecionado</p>
          <p className="text-xs text-slate-500 mt-1">Selecione ou crie um novo board no menu lateral</p>
        </div>
      )}
    </div>
  );
}

