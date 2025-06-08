import { Task } from "../../types/useBoardTypes";

export interface AddTaskFormProps {
  boardId: string;
  columnId: string;
  onTaskAdded?: (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => Promise<Task>;
  currentUser: any;
  onOpenAddTask: (columnId: string) => void;
  selectedTaskId?: string | null | undefined;
}