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
  images?: string[]; 
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

export interface UserSelectorProps {
  selectedUser: User | null;
  availableUsers: User[];
  onUserSelect: (userId: string | null) => void;
  label: string;
}

export interface CommentListProps {
  comments: Comment[];
  currentUser: User;
  task: TaskDetail;
  onDeleteComment: (commentId: string) => Promise<void>;
  onImagePreview: (url: string) => void;
}

export interface CommentsSectionProps {
  taskId: string;
  comments: Comment[];
  currentUser: User;
  task: TaskDetail;
  onRefreshComments: () => Promise<void>;
  onImagePreview: (url: string) => void;
}

export interface TaskContentProps {
  task: TaskDetail | null;
  currentUser: User;
  availableUsers: User[];
  priorities: Priority[];
  onUpdateTask: (updates: Partial<TaskDetail>) => void;
  taskId: string;
  setHasUnsavedChanges: (value: boolean) => void;
  isNewTask?: boolean;
  onTaskUpdate?: () => Promise<void>;
  onAttachmentsUpdate?: (
    updater: (attachments: Attachment[]) => Attachment[]
  ) => void;
}


export interface AttachmentsListProps {
  attachments: Attachment[];
  currentUser: User;
  taskId: string;
  onTaskUpdate?: () => Promise<void>;

  /** Callback to update attachments locally (smooth) */
  onAttachmentsUpdate?: (
    updater: (attachments: Attachment[]) => Attachment[]
  ) => void;
}