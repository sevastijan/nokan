"use client";

import { JSX } from "react";

interface AddTaskFormProps {
  boardId: string;
  columnId: string;
  onTaskAdded?: (newTask: { id: string; title: string }) => void;
  currentUser: any;
  onOpenAddTask: (columnId: string) => void;
  selectedTaskId?: string | null | undefined;
}

const AddTaskForm = ({
  boardId,
  columnId,
  onTaskAdded,
  currentUser,
  onOpenAddTask,
  selectedTaskId,
}: AddTaskFormProps): JSX.Element => {
  return (
    <div className="mt-4">
      <button
        onClick={() => onOpenAddTask(columnId)}
        className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg transition-colors"
      >
        Add Task
      </button>
    </div>
  );
};

export default AddTaskForm;
