import { Droppable, Draggable } from "@hello-pangea/dnd";
import AddTaskForm from "./AddTaskForm";
import Task from "./Task";
import { FaGripVertical } from "react-icons/fa";
import { JSX } from "react";

/**
 * Component representing a single column in the task board.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.column - The column data, including its ID, title, and tasks.
 * @param {number} props.colIndex - The index of the column in the board.
 * @param {Function} props.onUpdateColumnTitle - Callback to update the column title.
 * @param {Function} props.onRemoveColumn - Callback to remove the column.
 * @param {Function} props.onTaskAdded - Callback triggered when a new task is added to the column.
 * @param {Function} props.onUpdateTaskTitle - Callback to update the title of a task.
 * @param {Function} props.onRemoveTask - Callback to remove a task from the column.
 * @returns {JSX.Element} The rendered Column component.
 */
const Column = ({
  column,
  colIndex,
  onUpdateColumnTitle,
  onRemoveColumn,
  onTaskAdded,
  onUpdateTaskTitle,
  onRemoveTask,
}: any): JSX.Element => {
  return (
    <Draggable key={column.id} draggableId={column.id} index={colIndex}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-gray-100 rounded p-4 min-w-[250px]"
        >
          <div className="flex justify-between items-center mb-2">
            <div
              {...provided.dragHandleProps}
              className="cursor-move text-gray-500"
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
              className="font-semibold w-full border-b focus:outline-none ml-2"
            />

            <button
              onClick={() => onRemoveColumn(column.id)}
              className="text-sm text-red-600"
            >
              ✕
            </button>
          </div>

          <Droppable droppableId={column.id} type="TASK">
            {(provided) => (
              <ul
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[50px]"
              >
                {column.tasks.map((task: any, taskIndex: number) => (
                  <Task
                    key={task.id}
                    task={task}
                    taskIndex={taskIndex}
                    columnId={column.id}
                    onUpdateTaskTitle={onUpdateTaskTitle}
                    onRemoveTask={onRemoveTask}
                  />
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>

          <AddTaskForm
            boardId={column.boardId}
            columnId={column.id}
            onTaskAdded={onTaskAdded}
          />
        </div>
      )}
    </Draggable>
  );
};

export default Column;
