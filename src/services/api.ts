import { mockBoards, mockCards, mockColumns, mockLinks, mockMembers, mockSwimlanes } from "./mockData";
import type { Board, Card, Column, Member, Swimlane, UsefulLink } from "../types";

// This service acts as an abstraction layer.
// Later, you can swap the mock data implementations with Supabase API calls
// e.g., using `supabase.from('cards').select('*')`

class KanbanService {
  private cards = [...mockCards];
  private columns = [...mockColumns];
  private swimlanes = [...mockSwimlanes];
  private members = [...mockMembers];
  private links = [...mockLinks];

  async getBoardData(boardId: string) {
    return {
      board: this.boards.find(b => b.id === boardId),
      columns: this.columns.filter(c => c.boardId === boardId).sort((a, b) => a.order - b.order),
      swimlanes: this.swimlanes.filter(s => s.boardId === boardId).sort((a, b) => a.order - b.order),
      cards: this.cards.filter(c => c.boardId === boardId).sort((a, b) => a.order - b.order),
      members: this.members.filter(m => m.boardId === boardId),
      links: this.links.filter(l => l.boardId === boardId),
    };
  }

  async moveCard(cardId: string, destColumnId: string, destSwimlaneId: string, newOrder: number) {
    const cardIndex = this.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    // Remove card from old position
    const [card] = this.cards.splice(cardIndex, 1);
    
    // Update card properties
    card.columnId = destColumnId;
    card.swimlaneId = destSwimlaneId;
    
    // Insert into new position
    // Find all cards in the destination column and swimlane
    const destCards = this.cards
      .filter(c => c.columnId === destColumnId && c.swimlaneId === destSwimlaneId)
      .sort((a, b) => a.order - b.order);
      
    destCards.splice(newOrder, 0, card);
    
    // Reassign orders
    destCards.forEach((c, idx) => {
      c.order = idx;
    });

    // We replace all updated cards into the main list
    const otherCards = this.cards.filter(c => !(c.columnId === destColumnId && c.swimlaneId === destSwimlaneId));
    this.cards = [...otherCards, ...destCards];

    if (card.parentId) {
      this.checkAndCompleteParent(card.parentId, card.boardId);
    }

    return card;
  }
  
  async addMember(boardId: string, email: string) {
    const newMember: Member = {
      id: `m-${Date.now()}`,
      boardId,
      email,
      role: 'member'
    };
    this.members.push(newMember);
    return newMember;
  }
  
  async removeMember(memberId: string) {
    this.members = this.members.filter(m => m.id !== memberId);
  }
  
  async addLink(boardId: string, title: string, url: string, description?: string) {
    const newLink: UsefulLink = {
      id: `link-${Date.now()}`,
      boardId,
      title,
      url,
      description
    };
    this.links.push(newLink);
    return newLink;
  }
  
  async removeLink(linkId: string) {
    this.links = this.links.filter(l => l.id !== linkId);
  }

  // --- New features ---
  private comments: any[] = [];
  private boards = [...mockBoards];
  
  // Mock current user
  public currentUser = { id: "u-1", name: "João Developer", email: "joao.dev@empresa.com", company: "Stratos Inc.", avatarUrl: "" };
  public cardCounter = 8; // Start after mock data

  async getCurrentUser() {
    return this.currentUser;
  }

  async updateCurrentUser(updates: Partial<typeof this.currentUser>) {
    Object.assign(this.currentUser, updates);
    return this.currentUser;
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    // Mock updating password
    console.log("Mock verified current password and updated password to", newPassword.replace(/./g, "*"));
  }

  async getAllBoards() {
    return this.boards;
  }

  async addBoard(name: string, description: string, cols: string[], swims: string[]) {
    const newBoard = { id: `board-${Date.now()}`, name, description };
    this.boards.push(newBoard);
    
    cols.forEach((cName, idx) => {
      this.columns.push({ id: `col-${Date.now()}-${idx}`, boardId: newBoard.id, name: cName, order: idx });
    });
    swims.forEach((sName, idx) => {
      this.swimlanes.push({ id: `sl-${Date.now()}-${idx}`, boardId: newBoard.id, name: sName, order: idx });
    });
    
    // Add creator as admin
    this.members.push({ id: `m-${Date.now()}`, boardId: newBoard.id, email: this.currentUser.email, role: "admin" });

    return newBoard;
  }

  async deleteBoard(boardId: string) {
    this.boards = this.boards.filter(b => b.id !== boardId);
    this.columns = this.columns.filter(c => c.boardId !== boardId);
    this.swimlanes = this.swimlanes.filter(s => s.boardId !== boardId);
    this.cards = this.cards.filter(card => card.boardId !== boardId);
    this.members = this.members.filter(m => m.boardId !== boardId);
    this.links = this.links.filter(l => l.boardId !== boardId);
  }

  async updateBoardSettings(boardId: string, name: string, description: string, cols: any[], swims: any[]) {
    console.log("updateBoardSettings CALLED:", {boardId, name, description, cols, swims});
    const board = this.boards.find(b => b.id === boardId);
    if (board) {
      board.name = name;
      board.description = description;
      console.log("UPDATED BOARD REF:", board);
    }

    const existingCols = this.columns.filter(c => c.boardId === boardId);
    const updatedColIds = cols.filter(c => c.id).map(c => c.id);
    existingCols.forEach(ec => {
      if (!updatedColIds.includes(ec.id)) {
        this.columns = this.columns.filter(c => c.id !== ec.id);
        this.cards = this.cards.filter(card => card.columnId !== ec.id);
      }
    });

    cols.forEach((c, idx) => {
      if (c.id) {
         const col = this.columns.find(ex => ex.id === c.id);
         if (col) { col.name = c.name; col.order = idx; }
      } else {
         this.columns.push({ id: `col-${Date.now()}-${idx}`, boardId, name: c.name, order: idx });
      }
    });

    const existingSwims = this.swimlanes.filter(s => s.boardId === boardId);
    const updatedSwimIds = swims.filter(s => s.id).map(s => s.id);
    existingSwims.forEach(es => {
      if (!updatedSwimIds.includes(es.id)) {
        this.swimlanes = this.swimlanes.filter(sw => sw.id !== es.id);
        this.cards = this.cards.filter(card => card.swimlaneId !== es.id);
      }
    });

    swims.forEach((s, idx) => {
      if (s.id) {
         const swim = this.swimlanes.find(ex => ex.id === s.id);
         if (swim) { swim.name = s.name; swim.order = idx; }
      } else {
         this.swimlanes.push({ id: `sl-${Date.now()}-${idx}`, boardId, name: s.name, order: idx });
      }
    });
  }

  async addSwimlane(boardId: string, name: string) {
    const newSwimlane = {
      id: `sl-${Date.now()}`,
      boardId,
      name,
      order: this.swimlanes.filter(s => s.boardId === boardId).length
    };
    this.swimlanes.push(newSwimlane);
    return newSwimlane;
  }

  async addCard(boardId: string, title: string, type: any, columnId: string, description: string, parentId?: string) {
    const swim = this.swimlanes.find(s => s.boardId === boardId);
    if (!swim) return null; // fallback

    this.cardCounter++;
    const newCard: any = {
      id: String(this.cardCounter).padStart(3, '0'),
      boardId,
      columnId,
      swimlaneId: swim.id, // defaults to first swimlane, could be selectable
      parentId: parentId || null,
      title,
      description,
      type,
      order: this.cards.filter(c => c.columnId === columnId && c.swimlaneId === swim.id).length
    };
    this.cards.push(newCard);
    return newCard;
  }

  async updateCard(cardId: string, updates: Partial<Card>) {
    const card = this.cards.find(c => c.id === cardId);
    if (card) {
      Object.assign(card, updates);
      if (card.parentId) {
        this.checkAndCompleteParent(card.parentId, card.boardId);
      }
    }
    return card;
  }

  checkAndCompleteParent(parentId: string, boardId: string) {
    const parent = this.cards.find(c => c.id === parentId);
    if (!parent) return;

    const children = this.cards.filter(c => c.parentId === parentId);
    if (children.length === 0) return;

    const cols = this.columns.filter(c => c.boardId === boardId).sort((a,b) => a.order - b.order);
    if (cols.length === 0) return;

    const lastColId = cols[cols.length - 1].id;
    const allChildrenDone = children.every(c => c.columnId === lastColId);

    if (allChildrenDone && parent.columnId !== lastColId) {
      parent.columnId = lastColId;
      if (parent.parentId) {
        this.checkAndCompleteParent(parent.parentId, boardId);
      }
    }
  }

  async deleteCard(cardId: string) {
    this.cards = this.cards.filter(c => c.id !== cardId);
    this.cards.forEach(c => {
       if (c.parentId === cardId) {
          c.parentId = null; // Unlink children if parent is deleted
       }
    });
  }

  async getComments(cardId: string) {
    return this.comments.filter(c => c.cardId === cardId);
  }

  async addComment(cardId: string, content: string, authorName: string) {
    const newComment = {
      id: `comment-${Date.now()}`,
      cardId,
      authorName,
      content,
      createdAt: new Date().toISOString()
    };
    this.comments.push(newComment);
    return newComment;
  }

  async updateColumn(columnId: string, name: string) {
    const col = this.columns.find(c => c.id === columnId);
    if (col) col.name = name;
  }
  
  async deleteColumn(columnId: string) {
    this.columns = this.columns.filter(c => c.id !== columnId);
    // Also remove cards in this column or handle them as needed
    this.cards = this.cards.filter(c => c.columnId !== columnId);
  }
  
  async updateSwimlane(swimlaneId: string, name: string) {
    const swim = this.swimlanes.find(s => s.id === swimlaneId);
    if (swim) swim.name = name;
  }
  
  async deleteSwimlane(swimlaneId: string) {
    this.swimlanes = this.swimlanes.filter(s => s.id !== swimlaneId);
    this.cards = this.cards.filter(c => c.swimlaneId !== swimlaneId);
  }

  async getAllCards(boardId: string) {
    return this.cards.filter(c => c.boardId === boardId);
  }

  async changeMemberRole(boardId: string, memberId: string, role: string) {
    const member = this.members.find(m => m.id === memberId && m.boardId === boardId);
    if (member) member.role = role;
  }
}

const localApi = new KanbanService();

import { supabase } from "../lib/supabase";
import { supabaseApi } from "./supabaseApi";

// Temporary fallback logic for API
export const api: any = supabase ? supabaseApi : localApi;
