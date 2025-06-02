import { Droppable, Draggable } from "@hello-pangea/dnd";
import AddTaskForm from "./TaskColumn/AddTaskForm";
import TaskComponent from "./Task";
import { FaGripVertical, FaTrash } from "react-icons/fa";
import { JSX, useState } from "react";
import { Column as ColumnType, Task as TaskType } from "../types/useBoardTypes";
import TaskModal from "./TaskModal";

interface ColumnProps {
  column: ColumnType;
  colIndex: number;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
  onRemoveColumn: (columnId: string) => void;
  onTaskAdded: (newTask: TaskType) => void;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onUpdateTask: (columnId: string, task: TaskType) => void;
}

/**
 * Column component that displays a draggable column with tasks in a Kanban board
 * @param {ColumnType} column - Column data including id, title, and tasks
 * @param {number} colIndex - Index of the column for drag and drop ordering
 * @param {Function} onUpdateColumnTitle - Function to handle column title updates
 * @param {Function} onRemoveColumn - Function to handle column removal
 * @param {Function} onTaskAdded - Function to handle new task additions
 * @param {Function} onRemoveTask - Function to handle task removal
 * @param {Function} onUpdateTask - Function to handle task updates
 * @returns {JSX.Element} JSX element containing the column interface
 */
const Column = ({
  column,
  colIndex,
  onUpdateColumnTitle,
  onRemoveColumn,
  onTaskAdded,
  onRemoveTask,
  onUpdateTask,
}: ColumnProps): JSX.Element => {
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);

  /**
   * Open task modal for editing
   * @param {TaskType} task - Task to be edited
   */
  const openTaskModal = (task: TaskType) => {
    setSelectedTask(task);
  };

  /**
   * Close task modal
   */
  const closeTaskModal = () => {
    setSelectedTask(null);
  };

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
              className="text-red-500 hover:text-red-700 transition-colors duration-200 cursor-pointer"
              aria-label="Remove column"
            >
              <FaTrash size={18} />
            </button>
          </div>
          <Droppable droppableId={column.id} type="TASK">
            {(provided) => (
              <ul
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 flex-1 overflow-y-auto max-w-[300px] ${
                  column.tasks?.length === 0 ? "min-h-0" : "min-h-[50px]"
                }`}
              >
                {column.tasks && column.tasks.length > 0 ? (
                  column.tasks
                    .filter((task) => task && task.id)
                    .map((task, taskIndex) => (
                      <TaskComponent
                        key={task.id}
                        task={task}
                        taskIndex={taskIndex}
                        columnId={column.id}
                        onRemoveTask={onRemoveTask}
                        onOpenTaskModal={openTaskModal}
                      />
                    ))
                ) : (
                  <p className="text-gray-500 text-center">No tasks</p>
                )}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
          <AddTaskForm
            boardId={column.boardId}
            columnId={column.id}
            onTaskAdded={onTaskAdded}
          />
          {selectedTask && (
            <TaskModal
              isOpen={!!selectedTask}
              mode="edit"
              task={selectedTask}
              columnId={column.id}
              onClose={closeTaskModal}
              onUpdateTask={onUpdateTask}
            />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Column;
