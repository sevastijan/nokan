import { Draggable } from "@hello-pangea/dnd";
import { FaTrash } from "react-icons/fa";

/**
 * Component representing a single task in a column.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.task - The task data.
 * @param {number} props.taskIndex - The index of the task in the column.
 * @param {string} props.columnId - The ID of the column containing the task.
 * @param {Function} props.onUpdateTaskTitle - Callback to update the task title.
 * @param {Function} props.onRemoveTask - Callback to remove the task.
 * @returns {JSX.Element} The rendered Task component.
 */
const Task = ({
  task,
  taskIndex,
  columnId,
  onUpdateTaskTitle,
  onRemoveTask,
}: any) => {
  return (
    <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
      {(provided, snapshot) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging
              ? provided.draggableProps.style?.transform
              : "none", // Ustawienie transformacji tylko podczas przeciągania
            boxShadow: snapshot.isDragging
              ? "0 4px 8px rgba(0, 0, 0, 0.2)"
              : "none",
          }}
          className={`bg-gray-100 rounded-lg shadow-md px-4 py-2 flex justify-between items-center transition-transform duration-200 ${
            snapshot.isDragging ? "transform scale-105" : ""
          }`}
        >
          <input
            type="text"
            defaultValue={task.title}
            onBlur={(e) => onUpdateTaskTitle(columnId, task.id, e.target.value)}
            className="flex-grow bg-transparent text-gray-800 font-medium border-b border-gray-300 focus:outline-none focus:border-blue-500"
            placeholder="Task Title"
          />
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
  );
};

export default Task;
