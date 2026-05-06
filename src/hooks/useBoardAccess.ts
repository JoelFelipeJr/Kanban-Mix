import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

export type BoardRole = 'admin' | 'member' | 'reader' | 'none';

export function useBoardAccess(boardId: string | undefined) {
  const [role, setRole] = useState<BoardRole>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!boardId) {
        setRole('none');
        setLoading(false);
        return;
      }

      if (!supabase) {
        setRole('admin');
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setRole('none');
          return;
        }

        const userId = session.user.id;

        // Check if owner
        const { data: board } = await supabase
          .from('boards')
          .select('owner_id')
          .eq('id', boardId)
          .single();

        if (board?.owner_id === userId) {
          setRole('admin');
          return;
        }

        // Check membership
        const { data: membership } = await supabase
          .from('board_members')
          .select('role')
          .eq('board_id', boardId)
          .eq('user_id', userId)
          .single();

        if (membership) {
          setRole(membership.role as BoardRole);
        } else {
          setRole('none');
        }
      } catch (error) {
        console.error("Error checking board access:", error);
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    checkAccess();
  }, [boardId]);

  return {
    role,
    loading,
    canEditBoard: role === 'admin',
    canManageTeam: role === 'admin',
    canMoveCards: role === 'admin' || role === 'member',
    canEditCards: role === 'admin' || role === 'member',
  };
}
