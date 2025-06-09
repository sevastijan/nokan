export interface Task {
    id: string;
    title: string;
  }
  
  export interface Column {
    id: string;
    title: string;
    tasks: Task[];
  }
  
  export interface Board {
    id?: string; // Zmień na opcjonalne
    title?: string;
    columns: Column[];
    createdAt?: string;
    updatedAt?: string;
  }

  