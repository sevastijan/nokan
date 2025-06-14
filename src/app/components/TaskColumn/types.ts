import { Task, User } from "@/app/types/globalTypes";

export interface AddTaskFormProps {
  columnId: string;
  boardId: string;
  currentUser: User;
  onOpenAddTask: (columnId: string) => void;
  onTaskAdded: (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => void;
  selectedTaskId?: string | null;
}
