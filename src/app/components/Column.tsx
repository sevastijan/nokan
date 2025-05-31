import { Droppable, Draggable } from "@hello-pangea/dnd";
import AddTaskForm from "./AddTaskForm";
import Task from "./Task";

const Column = ({
  column,
  colIndex,
  onUpdateColumnTitle,
  onRemoveColumn,
  onTaskAdded,
  onUpdateTaskTitle,
  onRemoveTask,
}: any) => {
  return (
    <Draggable key={column.id} draggableId={column.id} index={colIndex}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-gray-100 rounded p-4 min-w-[250px] flex-shrink-0"
        >
          <div
            {...provided.dragHandleProps}
            className="flex justify-between items-center mb-2 cursor-move"
          >
            <input
              type="text"
              defaultValue={column.title}
              onBlur={(e) => onUpdateColumnTitle(column.id, e.target.value)}
              className="font-semibold w-full border-b focus:outline-none"
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
