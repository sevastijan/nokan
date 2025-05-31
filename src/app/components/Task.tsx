import { Draggable } from "@hello-pangea/dnd";

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
      {(provided) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white rounded shadow px-3 py-2 flex justify-between items-center cursor-move"
        >
          <input
            type="text"
            defaultValue={task.title}
            onBlur={(e) => onUpdateTaskTitle(columnId, task.id, e.target.value)}
            className="flex-grow border-b focus:outline-none"
          />
          <button
            className="text-red-500"
            onClick={() => onRemoveTask(columnId, task.id)}
          >
            🗑
          </button>
        </li>
      )}
    </Draggable>
  );
};

export default Task;
