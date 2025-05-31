import { Draggable } from "@hello-pangea/dnd";

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
