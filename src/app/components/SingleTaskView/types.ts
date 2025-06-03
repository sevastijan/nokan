export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  created_at?: string; 
}

export interface Priority {
  id: string;
  label: string;
  color: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  column_id: string; 
  created_at: string;
  updated_at: string;
  priority?: string | null; 
  priority_info?: any;  
  user_id?: string | null;  
  assignee?: User | null;   
  attachments?: Attachment[];
  order?: number; 
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: User;
}

export interface MenuPosition {
  top: number;
  left?: number;
  right?: number;
}