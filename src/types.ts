export type CardType = "INI" | "EPI" | "STY" | "TSK" | "BUG" | "REV" | "IMP";

export interface Board {
  id: string;
  name: string;
  description?: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
}

export interface Swimlane {
  id: string;
  boardId: string;
  name: string;
  order: number;
}

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  swimlaneId: string;
  parentId: string | null;
  assignees?: string[];
  title: string;
  description?: string;
  type: CardType;
  order: number;
  startDate?: string;
  dueDate?: string;
}

export interface Member {
  id: string;
  boardId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: string;
}

export interface UsefulLink {
  id: string;
  boardId: string;
  title: string;
  url: string;
  description?: string;
}

export interface Comment {
  id: string;
  cardId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface DragItemInfo {
  droppableId: string; // e.g. "swimlaneId|columnId"
  index: number;
}
