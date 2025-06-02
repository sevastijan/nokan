/**
 * Represents a single task in a column.
 */
export interface Task {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string; 
    createdAt?: string; 
    updatedAt?: string; 
    // images?: string[]; TODO
  }
  
  /**
   * Represents a single column in the board.
   */
  export interface Column {
    id: string;
    board_id: string;
    title: string;
    order: number;
    index: number; // Dodaj to pole
    boardId: string;
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