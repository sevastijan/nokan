// src/app/components/Column.tsx
"use client";

import React, { useState, useEffect, JSX } from "react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import AddTaskForm from "./TaskColumn/AddTaskForm";
import Task from "./Task";
import { FaGripVertical, FaTimes } from "react-icons/fa";
import Button from "./Button/Button";
import {
  Column as ColumnType,
  Task as TaskType,
  User,
  Priority,
} from "@/app/types/globalTypes";
import { supabase } from "@/app/lib/supabase";
import { toast } from "react-toastify";

interface ColumnProps {
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
  onOpenTaskDetail: (taskId: string) => void;
  selectedTaskId: string | null;
  currentUser: User;
  onOpenAddTask: (columnId: string) => void;
  priorities?: Priority[];
  // New prop: callback to notify parent o reorderze zadań
  onReorderTasks: (columnId: string, newOrder: TaskType[]) => void;
}

const Column = ({
  column,
  colIndex,
  onUpdateColumnTitle,
  onRemoveColumn,
  onTaskAdded,
  onRemoveTask,
  onOpenTaskDetail,
  selectedTaskId,
  currentUser,
  onOpenAddTask,
  priorities = [],
  onReorderTasks,
}: ColumnProps): JSX.Element => {
  // Local state for tasks ordering inside this column
  const [localTasks, setLocalTasks] = useState<TaskType[]>([]);

  // Sync localTasks when column.tasks prop changes
  useEffect(() => {
    // sort by order (sort_order)
    const sorted = [...(column.tasks || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    setLocalTasks(sorted);
  }, [column.tasks]);

  /**
   * Handle reorder within this column.
   * Framer Motion passes new ordered array;
   * we update local state immediately, then call parent callback to sync backend.
   */
  const handleReorder = (newOrder: TaskType[]) => {
    setLocalTasks(newOrder);
    onReorderTasks(column.id, newOrder);
  };

  return (
    <motion.div
      // Animation for column entry
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-800 text-white rounded-lg shadow-md p-4 min-w-[300px] min-h-[200px] max-h-[80vh] flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
        <div
          className="cursor-move text-gray-400 hover:text-gray-200"
          // Optionally, you could wrap column in Reorder for columns reorder - handled in parent
          role="button"
          tabIndex={0}
          aria-label="Drag handle"
        >
          <FaGripVertical size={20} />
        </div>
        <input
          type="text"
          defaultValue={column.title ?? ""}
          onBlur={(e) => onUpdateColumnTitle(column.id, e.target.value.trim())}
          className="bg-transparent text-lg font-semibold w-full focus:outline-none focus:border-blue-500 ml-2"
          placeholder="Column Title"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveColumn(column.id)}
          icon={<FaTimes />}
          className="p-2 text-red-400 hover:text-red-300"
        />
      </div>

      {/* Tasks list with Reorder.Group */}
      <Reorder.Group
        axis="y"
        values={localTasks}
        onReorder={handleReorder}
        className="space-y-2 flex-1 overflow-y-auto"
      >
        <AnimatePresence>
          {localTasks.map((task, index) => (
            <Reorder.Item
              key={task.id}
              value={task}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Task
                task={task}
                taskIndex={index}
                columnId={column.id}
                onRemoveTask={onRemoveTask}
                onOpenTaskDetail={onOpenTaskDetail}
                priorities={priorities}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add Task Button/Form */}
      <AddTaskForm
        boardId={column.boardId}
        columnId={column.id}
        onTaskAdded={onTaskAdded}
        currentUser={currentUser}
        selectedTaskId={selectedTaskId}
        onOpenAddTask={onOpenAddTask}
      />
    </motion.div>
  );
};

export default Column;
