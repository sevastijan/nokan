export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  created_at?: string;
}

export interface Priority {
  id: string;
  label: string;
  color: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  order: number;
  priority?: string;
  images?: string[];
  user_id: string;
  column_id: string;
  created_at: string;
  updated_at?: string;
  assignee?: User;
  priority_info?: Priority;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author: User;
}

export interface MenuPosition {
  top: number;
  left?: number;
  right?: number;
}