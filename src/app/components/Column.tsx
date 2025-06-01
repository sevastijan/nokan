import { Droppable, Draggable } from "@hello-pangea/dnd";
import AddTaskForm from "./AddTaskForm";
import Task from "./Task";
import { FaGripVertical } from "react-icons/fa";
import { JSX } from "react";

/**
 * Component representing a single column in the task board.
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
          className={`bg-gray-800 text-white rounded-lg shadow-md p-4 min-w-[300px] flex flex-col gap-4 transition-transform duration-200 ${
            snapshot.isDragging ? "transform scale-105" : ""
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
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
              className="bg-transparent text-lg font-semibold w-full border-b border-gray-600 focus:outline-none focus:border-blue-500 ml-2"
              placeholder="Column Title"
            />

            <button
              onClick={() => onRemoveColumn(column.id)}
              className="text-red-500 hover:text-red-700 transition-colors duration-200"
              aria-label="Remove column"
            >
              ✕
            </button>
          </div>

          {/* Tasks */}
          <Droppable droppableId={column.id} type="TASK">
            {(provided) => (
              <ul
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[50px] flex-1 overflow-y-auto"
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

          {/* Add Task Form */}
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
