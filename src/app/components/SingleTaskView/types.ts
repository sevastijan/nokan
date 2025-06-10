import { Column as ColumnType, Task as TaskType } from "../../types/useBoardTypes";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";


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


export interface CommentFormProps {
  currentUser: User;
  taskId: string;
  onAddComment: (content: string) => Promise<void>;
  onRefreshTask?: () => Promise<void>;
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
  teamMembers: any[]; // Add this if not already present
  onAssigneeChange?: (assigneeId: string | null) => void;
  selectedAssigneeId?: string | null;
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

export interface SingleTaskViewProps {
  taskId?: string;
  mode: "add" | "edit";
  columnId?: string;
  boardId?: string;
  onClose: () => void;
  onTaskUpdate?: () => void;
  onTaskAdd?: (newTask: { id: string; title: string }) => void;
  onTaskAdded?: (
    columnId: string,
    title: string,
    priority?: number,
    userId?: number
  ) => Promise<any>;
  currentUser: User;
  priorities?: Array<{ id: string; label: string; color: string }>;
}

export interface ColumnProps {
  column: ColumnType;
  colIndex: number;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
  onRemoveColumn: (columnId: string) => void;
  onTaskAdded: (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => Promise<TaskType>;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskDetail: (taskId: string | null) => void;
  selectedTaskId?: string | null;
  onTaskUpdate?: () => void;
  currentUser: any;
  onOpenAddTask: (columnId: string) => void;
  priorities?: Array<{ id: string; label: string; color: string }>;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;

}

export interface TaskHeaderProps {
  task: TaskDetail | null;
  onClose: () => void;
  onUpdateTask: (updates: Partial<TaskDetail>) => void;
  hasUnsavedChanges?: boolean;
  onUnsavedChangesAlert?: () => void;
}

export interface TaskFooterProps {
  task?: TaskDetail;
  currentUser: User;
  isNewTask?: boolean;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}

export interface PrioritySelectorProps {
  selectedPriority: string | null | undefined;
  onChange: (priority: string | null) => void;
  onDropdownToggle?: (isOpen: boolean) => void;
  priorities?: Priority[];
}

export interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "warning" | "danger" | "info";
}

export interface ActionFooterProps {
  isNewTask: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  task?: TaskDetail;
}