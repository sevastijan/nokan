"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { FaTrash } from "react-icons/fa";
import TaskModal from "./TaskModal";

interface TaskProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    images?: string[];
  };
  taskIndex: number;
  columnId: string;
  onUpdateTask: (columnId: string, updatedTask: any) => void;
  onRemoveTask: (columnId: string, taskId: string) => void;
}

const Task = ({
  task,
  taskIndex,
  columnId,
  onUpdateTask,
  onRemoveTask,
}: TaskProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdateTask = (updatedTask: any) => {
    onUpdateTask(columnId, updatedTask);
  };

  return (
    <>
      <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
        {(provided, snapshot) => (
          <li
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              boxShadow: snapshot.isDragging
                ? "0 4px 8px rgba(0, 0, 0, 0.2)"
                : "none",
            }}
            className={`bg-gray-100 rounded-lg shadow-md px-4 py-2 flex justify-between items-center transition-transform duration-200 ${
              snapshot.isDragging ? "transform scale-105" : ""
            }`}
          >
            <span
              onClick={() => setIsModalOpen(true)}
              className="flex-grow text-gray-800 font-medium hover:underline cursor-pointer"
            >
              {task.title}
            </span>
            <button
              className="text-red-500 hover:text-red-700 ml-4 transition-colors duration-200"
              onClick={() => onRemoveTask(columnId, task.id)}
              aria-label="Remove task"
            >
              <FaTrash />
            </button>
          </li>
        )}
      </Draggable>

      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode="edit"
          task={task}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </>
  );
};

export default Task;
