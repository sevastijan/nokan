import { Droppable } from "@hello-pangea/dnd";
import AddTaskForm from "../TaskColumn/AddTaskForm";
import Task from "../Task";
import Button from "../Button/Button";
import { FaGripVertical, FaPlus, FaTimes } from "react-icons/fa";
import { JSX, useState } from "react";
import {
  Column as ColumnType,
  Task as TaskType,
  User,
} from "../../types/useBoardTypes";
import { motion } from "framer-motion";

interface ColumnProps {
  column: ColumnType;
  onUpdateTask: (columnId: string, task: TaskType) => void;
  colIndex: number;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
  onRemoveColumn: (columnId: string) => void;
  onTaskAdded?: (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => Promise<TaskType>;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskDetail: (taskId: string | null) => void;
  onTaskUpdate?: () => void;
  currentUser: User;
  selectedTaskId?: string | null;
  onOpenAddTask: (columnId: string | null) => void;
  addTaskColumnId?: string | null;
  priorities?: Array<{ id: string; label: string; color: string }>;
}

const Column = ({
  column,
  colIndex,
  onUpdateColumnTitle,
  onRemoveColumn,
  onRemoveTask,
  onOpenTaskDetail,
  currentUser,
  selectedTaskId,
  onOpenAddTask,
  priorities,
}: ColumnProps): JSX.Element => {
  const [localTitle, setLocalTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);

  const handleTitleBlur = () => {
    if (localTitle !== column.title) {
      onUpdateColumnTitle(column.id, localTitle);
    }
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 flex-1 min-w-[300px] max-w-[350px]">
      {/* Column Header */}
      <div className="p-5 border-b border-slate-700/20 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-t-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${getColumnColor(
                column.id
              )} shadow-lg`}
            ></div>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="font-bold text-slate-100 bg-transparent border-none focus:outline-none text-lg placeholder-slate-400 hover:bg-slate-700/30 rounded px-2 py-1 transition-colors"
              placeholder="Column title"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenAddTask(column.id)}
              className="!p-2 !text-slate-400 hover:!text-indigo-400 hover:!bg-indigo-500/10 !rounded-xl transition-all duration-200 group"
              icon={
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            />

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
                className="!p-2 !text-slate-400 hover:!text-slate-300 hover:!bg-slate-700/50 !rounded-xl transition-all duration-200"
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                }
              />

              {/* Column Menu Dropdown */}
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onRemoveColumn(column.id);
                        setShowMenu(false);
                      }}
                      className="w-full justify-start !text-red-400 hover:!bg-red-500/10 hover:!text-red-300"
                      icon={<FaTimes className="w-4 h-4" />}
                    >
                      Delete Column
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Task Count & Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-slate-700/50 text-slate-300 text-sm px-3 py-1.5 rounded-lg font-medium border border-slate-600/30">
              {column.tasks.length} task
              {column.tasks.length !== 1 ? "s" : ""}
            </span>
            {column.tasks.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (column.tasks.filter((t) => t.completed).length /
                          column.tasks.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="text-xs text-slate-400">
                  {Math.round(
                    (column.tasks.filter((t) => t.completed).length /
                      column.tasks.length) *
                      100
                  )}
                  %
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <Droppable droppableId={column.id} type="TASK">
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <div className="space-y-3">
              {/* Sort tasks by order before rendering */}
              {[...column.tasks]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((task, index) => (
                  <Task
                    key={task.id}
                    task={task}
                    taskIndex={task.order || index} // Użyj task.order zamiast index
                    columnId={column.id}
                    onRemoveTask={onRemoveTask}
                    onOpenTaskDetail={onOpenTaskDetail}
                    priorities={priorities || []}
                  />
                ))}
            </div>
            {provided.placeholder}

            {/* Add Task Button */}
            <div className="mt-4">
              <Button
                variant="ghost"
                size="md"
                onClick={() => onOpenAddTask(column.id)}
                className="w-full !p-4 !border-2 !border-dashed !border-slate-600/30 hover:!border-indigo-400/50 hover:!bg-indigo-500/5 !rounded-xl !text-slate-400 hover:!text-indigo-400 transition-all duration-300 group"
                icon={
                  <div className="p-1 bg-slate-700/30 group-hover:bg-indigo-500/20 rounded-lg transition-colors">
                    <FaPlus className="w-4 h-4" />
                  </div>
                }
              >
                <span className="font-medium ml-2">Add new task</span>
              </Button>
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Helper function for column colors
const getColumnColor = (columnId: string) => {
  const colors = [
    "bg-gradient-to-r from-blue-500 to-cyan-400",
    "bg-gradient-to-r from-purple-500 to-pink-400",
    "bg-gradient-to-r from-emerald-500 to-teal-400",
    "bg-gradient-to-r from-orange-500 to-red-400",
    "bg-gradient-to-r from-indigo-500 to-purple-400",
  ];
  return colors[columnId.length % colors.length];
};

export default Column;
