import { Droppable, Draggable } from "@hello-pangea/dnd";
import AddTaskForm from "./TaskColumn/AddTaskForm";
import Task from "./Task";
import { FaGripVertical } from "react-icons/fa";
import { JSX } from "react";
import { Column as ColumnType, Task as TaskType } from "../types/useBoardTypes";

interface ColumnProps {
  column: ColumnType;
  onUpdateTask: (columnId: string, task: TaskType) => void;
  colIndex: number;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
  onRemoveColumn: (columnId: string) => void;
  onTaskAdded: (newTask: { id: string; title: string }) => void;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskDetail: (taskId: string | null) => void;
  selectedTaskId?: string | null;
  onTaskUpdate?: () => void;
  currentUser: any;
  onOpenAddTask: (columnId: string) => void;
  priorities?: Array<{ id: string; label: string; color: string }>;
}

/**
 * Column component that displays a draggable column with tasks in a Kanban board
 */
const Column = ({
  column,
  onUpdateTask,
  colIndex,
  onUpdateColumnTitle,
  onRemoveColumn,
  onTaskAdded,
  onRemoveTask,
  onOpenTaskDetail,
  selectedTaskId,
  onTaskUpdate,
  currentUser,
  onOpenAddTask,
  priorities = [], // Dodaj priorities z defaultem
}: ColumnProps): JSX.Element => {
  return (
    <Draggable key={column.id} draggableId={column.id} index={colIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging
              ? "0 4px 8px rgba(0, 0, 0, 0.2)"
              : "none",
          }}
          className={`bg-gray-800 text-white rounded-lg shadow-md p-4 min-w-[300px] h-[500px] flex flex-col gap-4 transition-transform duration-200 ${
            snapshot.isDragging ? "transform scale-105" : ""
          }`}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
            <div
              {...provided.dragHandleProps}
              className="cursor-move text-gray-400 hover:text-gray-200"
              role="button"
              tabIndex={0}
              aria-label="Drag handle"
            >
              <FaGripVertical size={20} />
            </div>
            <input
              type="text"
              defaultValue={column.title}
              onBlur={(e) => onUpdateColumnTitle(column.id, e.target.value)}
              className="bg-transparent text-lg font-semibold w-full focus:outline-none focus:border-blue-500 ml-2"
              placeholder="Column Title"
            />
            <button
              onClick={() => onRemoveColumn(column.id)}
              className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>
          <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 flex-1 overflow-y-auto max-w-[300px] ${
                  column.tasks.length === 0 ? "min-h-0" : "min-h-[50px]"
                }`}
              >
                {column.tasks.map((task, index) => (
                  <Task
                    key={task.id}
                    task={task}
                    taskIndex={index}
                    columnId={column.id}
                    onRemoveTask={onRemoveTask}
                    onOpenTaskDetail={onOpenTaskDetail}
                    priorities={priorities}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <AddTaskForm
            boardId={column.board_id || ""}
            columnId={column.id}
            onTaskAdded={onTaskAdded}
            currentUser={currentUser}
            selectedTaskId={selectedTaskId}
            onOpenAddTask={onOpenAddTask}
          />
        </div>
      )}
    </Draggable>
  );
};

export default Column;
