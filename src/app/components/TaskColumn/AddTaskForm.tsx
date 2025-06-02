"use client";

import { JSX, useState } from "react";
import SingleTaskView from "../SingleTaskView/SingleTaskView";

interface AddTaskFormProps {
  boardId: string;
  columnId: string;
  onTaskAdded?: (newTask: { id: string; title: string }) => void;
  currentUser: any;
}

const AddTaskForm = ({
  boardId,
  columnId,
  onTaskAdded,
  currentUser,
}: AddTaskFormProps): JSX.Element => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg transition-colors"
      >
        Add Task
      </button>

      {isModalOpen && (
        <SingleTaskView
          mode="add"
          columnId={columnId}
          boardId={boardId}
          onClose={() => setIsModalOpen(false)}
          onTaskAdd={onTaskAdded}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default AddTaskForm;
