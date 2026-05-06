import type { Board, Card, Column, Member, Swimlane, UsefulLink } from "../types";

export const mockBoards: Board[] = [];
export const mockColumns: Column[] = [];
export const mockSwimlanes: Swimlane[] = [];
export const mockCards: Card[] = [];
export const mockMembers: Member[] = [
  { id: 'm-1', boardId: 'b-1', email: 'joao.dev@empresa.com', role: 'admin' },
  { id: 'm-2', boardId: 'b-1', email: 'maria.designer@empresa.com', role: 'member' }
];
export const mockLinks: UsefulLink[] = [];
