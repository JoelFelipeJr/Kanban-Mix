import { supabase } from "../lib/supabase";
import type { Board, Card, Column, Member, Swimlane, UsefulLink } from "../types";

export class SupabaseKanbanService {
  async updateCurrentUser(updates: any) {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Only update valid columns to prevent Postgres errors
    const validUpdates: any = {};
    if ('name' in updates && updates.name) validUpdates.name = updates.name;
    if ('avatarUrl' in updates) validUpdates.avatar = updates.avatarUrl;

    if (Object.keys(validUpdates).length > 0) {
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, ...validUpdates });
      if (error) console.error("Error updating profile:", error.message);
    }

    // Update user metadata to store company and fallback fields
    const metadataUpdates: any = {};
    if ('company' in updates) metadataUpdates.company = updates.company;
    if ('name' in updates && updates.name) metadataUpdates.full_name = updates.name;

    if (Object.keys(metadataUpdates).length > 0) {
      await supabase.auth.updateUser({ data: metadataUpdates });
    }
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    if (!supabase) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) throw new Error("Não autenticado");

    // Verify current password by trying to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword
    });

    if (signInError) {
      throw new Error("Senha atual incorreta");
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw new Error(error.message);
  }

  async getCurrentUser() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const avatarUrl = profile?.avatar || session.user.user_metadata?.avatar_url || "";
    const emailPrefix = session.user.email?.split('@')[0];
    let name = profile?.name;
    
    // Favor full_name if the currently stored name is just the email prefix or missing
    if ((!name || name === emailPrefix) && session.user.user_metadata?.full_name) {
      name = session.user.user_metadata.full_name;
    } else if (!name) {
      name = emailPrefix || "";
    }
    
    const company = session.user.user_metadata?.company || profile?.company || "";

    // Sync missing data to profiles so other users see it
    if (!profile || (avatarUrl && !profile.avatar) || (name && !profile.name) || !profile.email) {
       await supabase.from('profiles').upsert({
         id: session.user.id,
         name: name,
         avatar: avatarUrl,
         email: session.user.email
       });
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name,
      avatarUrl,
      company
    };
  }

  get currentUser() {
    return { name: "User", email: "user@example.com" }; // Used synchronously as fallback/mock
  }

  async getAllBoards() {
    if (!supabase) return [];
    const { data } = await supabase.from('boards').select('*').order('created_at', { ascending: false });
    return data || [];
  }

  async deleteBoard(boardId: string) {
    if (!supabase) return;
    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) {
      console.error("Error deleting board:", error);
      throw new Error(`Erro ao excluir board: ${error.message}`);
    }
  }

  async getBoardData(boardId: string) {
    if (!supabase) throw new Error("Supabase is not configured.");
    
    const [
      { data: boards },
      { data: columns },
      { data: swimlanes },
      { data: cards },
      membersResponse,
      { data: links }
    ] = await Promise.all([
      supabase.from('boards').select('*').eq('id', boardId).single(),
      supabase.from('columns').select('*').eq('board_id', boardId).order('order'),
      supabase.from('swimlanes').select('*').eq('board_id', boardId).order('order'),
      supabase.from('cards').select('*, card_assignees(user_id)').eq('board_id', boardId).order('order'),
      supabase.from('board_members').select('*, profiles(name, avatar, email)').eq('board_id', boardId),
      supabase.from('useful_links').select('*').eq('board_id', boardId)
    ]);
    
    let members: Array<Record<string, unknown>> = [];
    if (membersResponse.error) {
      console.warn("Failed to join board_members with profiles. Fetching manually...", membersResponse.error);
      const { data: rawMembers } = await supabase.from('board_members').select('*').eq('board_id', boardId);
      if (rawMembers && rawMembers.length > 0) {
        const userIds = rawMembers.map(m => m.user_id);
        const { data: profiles } = await supabase.from('profiles').select('id, name, avatar, email').in('id', userIds);
        members = rawMembers.map(m => ({
          ...m,
          profiles: profiles?.find(p => p.id === m.user_id) || null
        }));
      }
    } else {
      members = membersResponse.data || [];
    }
    
    return {
      board: boards,
      columns: columns?.map(c => ({ id: c.id, boardId: c.board_id, name: c.name, order: c.order })) || [],
      swimlanes: swimlanes?.map(s => ({ id: s.id, boardId: s.board_id, name: s.name, order: s.order })) || [],
      cards: cards?.map(c => ({
        id: c.id,
        boardId: c.board_id,
        columnId: c.column_id,
        swimlaneId: c.swimlane_id,
        title: c.title,
        description: c.content,
        parentId: c.parent_id,
        assignees: c.card_assignees?.map((a: any) => a.user_id) || [],
        type: c.type || 'TSK',
        order: c.order || 0,
        startDate: c.start_date,
        dueDate: c.due_date
      })) || [],
      members: members?.map((m: any) => ({
        id: m.user_id,
        boardId: m.board_id,
        email: m.profiles?.email || 'Unknown',
        name: m.profiles?.name || 'Unknown',
        avatarUrl: m.profiles?.avatar || '',
        role: m.role
      })) || [],
      links: links?.map(l => ({
        id: l.id,
        boardId: l.board_id,
        title: l.title,
        url: l.url,
        description: l.description
      })) || []
    };
  }

  async addBoard(name: string, description: string, cols: string[], swims: string[]) {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Notice we skip description here unless we're sure the column exists.
    // If the schema was updated, we'd add description. Since we might not have migration tool, we omit it or try adding it safely.
    // However, if we're not using Supabase backend or the backend was updated, we can pass it.
    // I will try to pass description, and if it fails, fallback without description.
    let newBoard;
    try {
      const resp = await supabase.from('boards').insert({ name, description, owner_id: session.user.id }).select().single();
      newBoard = resp.data;
      if (resp.error) throw resp.error;
    } catch (e) {
      // Fallback if description column doesn't exist
      const resp = await supabase.from('boards').insert({ name, owner_id: session.user.id }).select().single();
      newBoard = resp.data;
      alert("Nota: A descrição não pôde ser salva. Por favor, adicione a coluna 'description' (tipo text) à tabela 'boards' no seu Supabase.");
      if (resp.error) {
        console.error("Error creating board:", resp.error?.message || resp.error);
        throw new Error(`Erro ao criar board: ${resp.error?.message || 'Desconhecido'}`);
      }
    }
    
    const boardId = newBoard.id;

    // Insert board member
    const { error: memberError } = await supabase.from('board_members').insert({ board_id: boardId, user_id: session.user.id, role: 'admin' });
    if (memberError) console.error("Error adding board member:", memberError);

    // Insert columns
    const columnsData = cols.map((c, idx) => ({ board_id: boardId, name: c, order: idx }));
    if (columnsData.length > 0) {
      const { error: colError } = await supabase.from('columns').insert(columnsData);
      if (colError) console.error("Error adding columns:", colError);
    }

    // Insert swimlanes
    const swimlanesData = swims.map((s, idx) => ({ board_id: boardId, name: s, order: idx }));
    if (swimlanesData.length > 0) {
      const { error: swimError } = await supabase.from('swimlanes').insert(swimlanesData);
      if (swimError) console.error("Error adding swimlanes:", swimError);
    }

    return { id: boardId, name, description };
  }

  async updateBoardSettings(boardId: string, name: string, description: string, cols: any[], swims: any[]) {
    if (!supabase) return;
    
    let hasError = false;
    let errorMessage = "";

    const { error } = await supabase.from('boards').update({ name, description }).eq('id', boardId);
    if (error) {
       console.error("Error updating board with description:", error.message);
       // Fallback for missing column
       const { error: fallbackError } = await supabase.from('boards').update({ name }).eq('id', boardId);
       if (fallbackError) {
         hasError = true;
         errorMessage += `Erro ao atualizar nome do board. `;
       } else {
         errorMessage += `Nota: A descrição não pôde ser salva. Adicione a coluna 'description' ao banco. `;
       }
    }

    // Upsert columns
    const { data: existingCols } = await supabase.from('columns').select('id').eq('board_id', boardId);
    if (existingCols) {
        const updatedColIds = cols.filter(c => c.id).map(c => c.id);
        const toDeleteIds = existingCols.filter(ec => !updatedColIds.includes(ec.id)).map(ec => ec.id);
        if (toDeleteIds.length > 0) {
            // Manually delete cards in these columns to avoid FK constraint errors if cascade is not enabled
            await supabase.from('cards').delete().in('column_id', toDeleteIds);
            const { error: delErr } = await supabase.from('columns').delete().in('id', toDeleteIds);
            if (delErr) {
              console.error("Error deleting columns:", delErr);
              hasError = true;
              errorMessage += `Erro ao excluir colunas: ${delErr.message}. `;
            }
        }
    }

    for (let i = 0; i < cols.length; i++) {
        if (cols[i].id) {
            const { error: updErr } = await supabase.from('columns').update({ name: cols[i].name, order: i }).eq('id', cols[i].id);
            if (updErr) { console.error("Error updating column:", updErr); hasError = true; errorMessage += `Erro ao atualizar a coluna '${cols[i].name}'. `; }
        } else {
            const { error: insErr } = await supabase.from('columns').insert({ board_id: boardId, name: cols[i].name, order: i });
            if (insErr) { console.error("Error inserting column", insErr); hasError = true; errorMessage += `Erro ao criar a coluna '${cols[i].name}'. `; }
        }
    }
    
    // Upsert swimlanes
    const { data: existingSwims } = await supabase.from('swimlanes').select('id').eq('board_id', boardId);
    if (existingSwims) {
        const updatedSwimIds = swims.filter(s => s.id).map(s => s.id);
        const toDeleteIds = existingSwims.filter(es => !updatedSwimIds.includes(es.id)).map(es => es.id);
        if (toDeleteIds.length > 0) {
            // Remove swimlane references or delete cards depending on your preference. 
            // Setting them to null or deleting is better. To mirror 'set null' like in schema:
            await supabase.from('cards').update({ swimlane_id: null }).in('swimlane_id', toDeleteIds);
            const { error: delErr } = await supabase.from('swimlanes').delete().in('id', toDeleteIds);
            if (delErr) { console.error("Error deleting swimlanes:", delErr); hasError = true; errorMessage += `Erro ao excluir raias: ${delErr.message}. `; }
        }
    }

    for (let i = 0; i < swims.length; i++) {
        if (swims[i].id) {
            const { error: updErr } = await supabase.from('swimlanes').update({ name: swims[i].name, order: i }).eq('id', swims[i].id);
            if (updErr) { console.error("Error updating swimlane:", updErr); hasError = true; errorMessage += `Erro ao atualizar a raia '${swims[i].name}'. `; }
        } else {
            const { error: insErr } = await supabase.from('swimlanes').insert({ board_id: boardId, name: swims[i].name, order: i });
            if (insErr) { console.error("Error inserting swimlane:", insErr); hasError = true; errorMessage += `Erro ao criar a raia '${swims[i].name}'. `; }
        }
    }

    // IF there's any error message that we collected, throw it so the UI can show it.
    if (errorMessage) {
      throw new Error(errorMessage.trim());
    }
  }

  async addSwimlane(boardId: string, name: string) {
    if (!supabase) return null;
    const { data: swims } = await supabase.from('swimlanes').select('order').eq('board_id', boardId).order('order', { ascending: false }).limit(1);
    const nextOrder = swims && swims.length > 0 ? swims[0].order + 1 : 0;
    
    const { data: swim } = await supabase.from('swimlanes').insert({ board_id: boardId, name, order: nextOrder }).select().single();
    return swim ? { id: swim.id, boardId: swim.board_id, name: swim.name, order: swim.order } : null;
  }

  async addCard(boardId: string, title: string, type: any, columnId: string, description: string, parentId?: string) {
    if (!supabase) return null;
    const { data: swim } = await supabase.from('swimlanes').select('*').eq('board_id', boardId).order('order').limit(1);
    
    const swimlaneId = swim && swim.length > 0 ? swim[0].id : null;
    
    let nextOrder = 0;
    if (swimlaneId) {
      const { data: cards } = await supabase.from('cards').select('order').eq('column_id', columnId).eq('swimlane_id', swimlaneId).order('order', { ascending: false }).limit(1);
      nextOrder = cards && cards.length > 0 ? cards[0].order + 1 : 0;
    } else {
      const { data: cards } = await supabase.from('cards').select('order').eq('column_id', columnId).is('swimlane_id', null).order('order', { ascending: false }).limit(1);
      nextOrder = cards && cards.length > 0 ? cards[0].order + 1 : 0;
    }

    const { data: card, error } = await supabase.from('cards').insert({
      board_id: boardId,
      column_id: columnId,
      swimlane_id: swimlaneId,
      parent_id: parentId || null,
      title,
      content: description,
      type,
      order: nextOrder
    }).select().single();

    if (error) {
      console.error("Error adding card:", error);
      throw new Error(`Erro ao criar card: ${error.message}`);
    }

    // Auto-assign the creator
    const { data: { session } } = await supabase.auth.getSession();
    if (session && card) {
      await supabase.from('card_assignees').insert({ card_id: card.id, user_id: session.user.id });
    }

    return card ? {
        id: card.id,
        boardId: card.board_id,
        columnId: card.column_id,
        swimlaneId: card.swimlane_id,
        title: card.title,
        description: card.content,
        parentId: card.parent_id,
        type: card.type,
        order: card.order,
        assignees: session ? [session.user.id] : []
    } : null;
  }

  async updateCard(cardId: string, updates: Partial<Card>) {
    if (!supabase) return null;
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.content = updates.description;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.startDate !== undefined) payload.start_date = updates.startDate || null;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate || null;
    if ("parentId" in updates) payload.parent_id = updates.parentId || null;
    
    if (updates.assignees !== undefined) {
      // First clear all existing assignees
      await supabase.from('card_assignees').delete().eq('card_id', cardId);
      // Then insert new assignees if any
      if (updates.assignees.length > 0) {
        const inserts = updates.assignees.map((userId) => ({ card_id: cardId, user_id: userId }));
        const { error: assignError } = await supabase.from('card_assignees').insert(inserts);
        if (assignError) console.error("Error setting assignees:", assignError);
      }
    }

    if (Object.keys(payload).length > 0) {
        const { error } = await supabase.from('cards').update(payload).eq('id', cardId);
        // Fallback for start_date if column doesn't exist yet
        if (error && error.message.includes('column "start_date" of relation "cards" does not exist')) {
           delete payload.start_date;
           const { error: fallbackError } = await supabase.from('cards').update(payload).eq('id', cardId);
           console.warn('Column start_date does not exist yet in Supabase schema.');
           if (fallbackError) {
             console.error("Error updating card fallback:", fallbackError);
             throw new Error(`Erro ao atualizar o card: ${fallbackError.message}`);
           }
        } else if (error) {
           console.error("Error updating card:", error);
           throw new Error(`Erro ao atualizar o card: ${error.message}`);
        }
    }
  }

  async moveCard(cardId: string, destColumnId: string, destSwimlaneId: string, newOrder: number) {
    if (!supabase) return null;
    
    // Naive local sort approach via DB
    // Shift all cards in dest column/swimlane at >= newOrder
    // NOTE: This could be subject to race conditions without RPC, but it's okay for simpler implementation
    const { data: destCards } = await supabase.from('cards')
      .select('id, order')
      .eq('column_id', destColumnId)
      .eq('swimlane_id', destSwimlaneId)
      .order('order');
      
    if (destCards) {
       for (let i = 0; i < destCards.length; i++) {
           let _order = i;
           if (i >= newOrder) _order++;
           await supabase.from('cards').update({ order: _order }).eq('id', destCards[i].id);
       }
    }
    
    await supabase.from('cards').update({ column_id: destColumnId, swimlane_id: destSwimlaneId, order: newOrder }).eq('id', cardId);
  }

  async deleteCard(cardId: string) {
    if (!supabase) return;
    await supabase.from('cards').delete().eq('id', cardId);
  }

  async getComments(cardId: string) {
    if (!supabase) return [];
    const { data } = await supabase.from('comments').select('*').eq('card_id', cardId).order('created_at');
    return data?.map(c => ({
        id: c.id,
        cardId: c.card_id,
        authorName: c.author_name,
        content: c.content,
        createdAt: c.created_at
    })) || [];
  }

  async addComment(cardId: string, content: string, authorName: string) {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: comment } = await supabase.from('comments').insert({
        card_id: cardId,
        user_id: session.user.id,
        author_name: authorName,
        content
    }).select().single();
    
    return comment ? {
        id: comment.id,
        cardId: comment.card_id,
        authorName: comment.author_name,
        content: comment.content,
        createdAt: comment.created_at
    } : null;
  }

  async addLink(boardId: string, title: string, url: string, description?: string) {
    if (!supabase) return null;
    const { data: link } = await supabase.from('useful_links').insert({ board_id: boardId, title, url, description }).select().single();
    return link ? { id: link.id, boardId: link.board_id, title: link.title, url: link.url, description: link.description } : null;
  }

  async removeLink(linkId: string) {
    if (!supabase) return;
    await supabase.from('useful_links').delete().eq('id', linkId);
  }

  async addMember(boardId: string, email: string, role: string = 'member') {
    if (!supabase) throw new Error("Supabase is not configured.");

    const { data: profiles } = await supabase.from('profiles').select('id').eq('email', email);
    if (!profiles || profiles.length === 0) {
      throw new Error(`Usuário não cadastrado: ${email}`);
    }

    const userId = profiles[0].id;

    const { error } = await supabase.from('board_members').insert({
      board_id: boardId,
      user_id: userId,
      role: role
    });

    if (error) {
      if (error.code === '23505') throw new Error('Usuário já faz parte deste board.');
      throw new Error('Erro ao adicionar membro: ' + error.message);
    }
    
    return { boardId, email, role };
  }

  async changeMemberRole(boardId: string, memberId: string, role: string) {
    if (!supabase) return;
    const { error } = await supabase.from('board_members').update({ role }).eq('board_id', boardId).eq('user_id', memberId);
    if (error) {
      throw new Error('Erro ao atualizar cargo: ' + error.message);
    }
  }

  async removeMember(memberId: string) {
      if (!supabase) return;
      // Because we map user_id as memberId when parsing
      await supabase.from('board_members').delete().eq('user_id', memberId);
  }
}

export const supabaseApi = new SupabaseKanbanService();
