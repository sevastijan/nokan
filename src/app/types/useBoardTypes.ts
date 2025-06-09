/**
 * Represents a single user.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

/**
 * Represents priority information.
 */
export interface Priority {
  id: string;
  label: string;
  color: string;
}

/**
 * Represents a single task in a column.
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  user_id?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  order?: number;
  images?: string[];
  assignee?: User;
  priority_info?: Priority;
}

/**
 * Represents a single column in the board.
 */
export interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  board_id?: string; 
  index?: number;    
  tasks: Task[];
}

/**
 * Represents the entire board.
 */
export interface Board {
  id: string;
  title: string;
  columns: Column[];
  createdAt?: string;
  updatedAt?: string; 
}

/**
 * Represents the function signature for updating a task.
 */
export type UpdateTaskFunction = (columnId: string, updatedTask: Task) => Promise<void>;

/**
 * Represents the function signature for removing a task.
 */
export type RemoveTaskFunction = (columnId: string, taskId: string) => Promise<void>;

/**
 * Represents the function signature for adding a column.
 */
export type AddColumnFunction = (title: string) => Promise<void>;

/**
 * Represents the function signature for removing a column.
 */
export type RemoveColumnFunction = (columnId: string) => Promise<void>;

/**
 * Represents the function signature for updating a column title.
 */
export type UpdateColumnTitleFunction = (columnId: string, newTitle: string) => Promise<void>;

/**
 * Represents the function signature for updating the board title.
 */
export type UpdateBoardTitleFunction = (newTitle: string) => Promise<void>;

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  is_custom: boolean;
  created_at?: string;
  updated_at?: string;
  columns: TemplateColumn[];
}

export interface TemplateColumn {
  id: string;
  template_id: string;
  title: string;
  order: number;
}

export const DEFAULT_TEMPLATES: Omit<BoardTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Basic Kanban',
    description: 'Prosty układ trzech kolumn',
    is_custom: false,
    columns: [
      { id: 'temp-1', template_id: '', title: 'To Do', order: 0 },
      { id: 'temp-2', template_id: '', title: 'In Progress', order: 1 },
      { id: 'temp-3', template_id: '', title: 'Done', order: 2 },
    ],
  },
  {
    name: 'Development Workflow',
    description: 'Szablon dla zespołów deweloperskich',
    is_custom: false,
    columns: [
      { id: 'temp-4', template_id: '', title: 'Backlog', order: 0 },
      { id: 'temp-5', template_id: '', title: 'In Development', order: 1 },
      { id: 'temp-6', template_id: '', title: 'Code Review', order: 2 },
      { id: 'temp-7', template_id: '', title: 'Testing', order: 3 },
      { id: 'temp-8', template_id: '', title: 'Done', order: 4 },
    ],
  },
  {
    name: 'Marketing Campaign',
    description: 'Szablon dla kampanii marketingowych',
    is_custom: false,
    columns: [
      { id: 'temp-9', template_id: '', title: 'Ideas', order: 0 },
      { id: 'temp-10', template_id: '', title: 'Planning', order: 1 },
      { id: 'temp-11', template_id: '', title: 'In Progress', order: 2 },
      { id: 'temp-12', template_id: '', title: 'Review', order: 3 },
      { id: 'temp-13', template_id: '', title: 'Published', order: 4 },
    ],
  },
];