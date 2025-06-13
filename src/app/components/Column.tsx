// src/app/components/Column.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
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
  onReorderTasks: (columnId: string, newOrder: TaskType[]) => void;
}

const Column = ({
  column,
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
}: ColumnProps) => {
  const [localTasks, setLocalTasks] = useState<TaskType[]>([]);

  // Synchronizacja localTasks przy zmianie column.tasks
  useEffect(() => {
    const tasksArr = Array.isArray(column.tasks) ? column.tasks : [];
    // 1) filter null/undefined
    const filtered: TaskType[] = tasksArr.filter((t) => {
      if (t == null) {
        console.warn("Column.tasks contains null/undefined", column.id, t);
        return false;
      }
      return true;
    });
    // 2) sort by order
    const sorted = [...filtered].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    // 3) dedupe by id
    const seen = new Set<string>();
    const deduped: TaskType[] = [];
    for (const t of sorted) {
      if (seen.has(t.id)) {
        console.warn(
          `Duplicate task id "${t.id}" in column "${column.id}", odrzucam duplikat.`
        );
        continue;
      }
      seen.add(t.id);
      deduped.push(t);
    }
    setLocalTasks(deduped);
  }, [column.tasks, column.id]);

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-md p-4 min-w-[300px] min-h-[200px] max-h-[80vh] flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
        {/* Ikona uchwytu bez funkcji drag kolumny */}
        <div className="text-gray-400 hover:text-gray-200">
          <FaGripVertical size={20} className="opacity-50" />
        </div>
        <input
          type="text"
          defaultValue={column.title}
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

      {/* Lista zadań: Droppable */}
      <Droppable droppableId={column.id} type="TASK">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2 flex-1 overflow-y-auto"
          >
            {localTasks.map((task, idx) => (
              <Draggable key={task.id} draggableId={task.id} index={idx}>
                {(prov) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                    style={prov.draggableProps.style}
                  >
                    <Task
                      task={task}
                      taskIndex={idx}
                      columnId={column.id}
                      onRemoveTask={onRemoveTask}
                      onOpenTaskDetail={onOpenTaskDetail}
                      priorities={priorities}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Formularz / przycisk dodawania zadania */}
      <AddTaskForm
        boardId={column.boardId}
        columnId={column.id}
        onTaskAdded={onTaskAdded}
        currentUser={currentUser}
        selectedTaskId={selectedTaskId}
        onOpenAddTask={onOpenAddTask}
      />
    </div>
  );
};

export default Column;
