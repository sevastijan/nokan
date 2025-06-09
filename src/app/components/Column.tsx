import { Droppable, Draggable } from "@hello-pangea/dnd";
import AddTaskForm from "./TaskColumn/AddTaskForm";
import Task from "./Task";
import { FaGripVertical, FaTimes } from "react-icons/fa";
import { JSX } from "react";
import Button from "./Button/Button";
import { ColumnProps } from "./SingleTaskView/types";

/**
 * Column component that represents a draggable column in a Kanban board.
 * It contains a title input, a list of tasks (sorted by order),
 * and a form for adding new tasks.
 *
 * @component
 * @param {ColumnProps} props - The props for the Column component.
 * @param {Object} props.column - The column data including tasks.
 * @param {number} props.colIndex - Index of the column in the board.
 * @param {Function} props.onUpdateColumnTitle - Handler to update column title.
 * @param {Function} props.onRemoveColumn - Handler to remove the column.
 * @param {Function} props.onTaskAdded - Handler when a new task is added.
 * @param {Function} props.onRemoveTask - Handler to remove a task.
 * @param {Function} props.onOpenTaskDetail - Handler to open task details.
 * @param {string|null} props.selectedTaskId - Currently selected task ID.
 * @param {Object} props.currentUser - The current logged-in user.
 * @param {Function} props.onOpenAddTask - Handler to trigger task add modal.
 * @param {Array} [props.priorities=[]] - Optional list of task priorities.
 * @returns {JSX.Element} The rendered Column component.
 */
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
          className={`bg-gray-800 text-white rounded-lg shadow-md p-4 min-w-[300px] min-h-[200px] max-h-[80vh] flex flex-col gap-4 transition-transform duration-200 ${
            snapshot.isDragging ? "transform scale-105" : ""
          }`}
        >
          {/* Column header: drag handle, title input, and remove button */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveColumn(column.id)}
              icon={<FaTimes />}
              className="p-2 text-red-400 hover:text-red-300"
            />
          </div>

          {/* Droppable area for tasks */}
          <Droppable droppableId={column.id} type="TASK">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 flex-1 overflow-y-auto max-w-[300px] ${
                  column.tasks.length === 0 ? "min-h-0" : ""
                }`}
              >
                {column.tasks
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((task, index) => (
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

          {/* Form to add new tasks */}
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
