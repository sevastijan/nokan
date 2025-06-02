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

export interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  column_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  images?: string[];
  attachments?: Attachment[];
  assignee?: User;
  priority_info?: Priority;
  priority?: string;
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