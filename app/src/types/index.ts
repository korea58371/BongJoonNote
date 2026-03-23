export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  summary: string;
  keyPoints: string[];
  decisions: string[];
  rawLog: string;
  tags: string[];
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: IdeaStatus;
  sourceMeeting: string | null;
  tags: string[];
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string | null;
  sourceIdea: string | null;
  sourceMeeting: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Spec {
  id: string;
  title: string;
  content: string;
  sourceIdea: string | null;
  tags: string[];
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export type Priority = 'high' | 'medium' | 'low';
export type IdeaStatus = 'new' | 'reviewing' | 'approved' | 'rejected' | 'archived';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface RawDump {
  id: string;
  content: string;
  source: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}
