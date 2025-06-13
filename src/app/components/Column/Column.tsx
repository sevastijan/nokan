import { Droppable, Draggable } from "@hello-pangea/dnd";
import AddTaskForm from "@/app/components/TaskColumn/AddTaskForm";
import Task from "@/app/components/Task";
import { FaGripVertical, FaTimes } from "react-icons/fa";
import { JSX } from "react";
import Button from "@/app/components/Button/Button";
import {
  Column as ColumnType,
  Task as TaskType,
  User,
  Priority,
} from "@/app/types/globalTypes";
import { ColumnProps } from "@/app/components/SingleTaskView/types";
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
              defaultValue={column.title ?? ""}
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

          <AddTaskForm
            boardId={column.boardId}
            columnId={column.id}
            onOpenAddTask={onOpenAddTask}
            onTaskAdded={onTaskAdded}
            currentUser={currentUser}
            selectedTaskId={selectedTaskId}
          />
        </div>
      )}
    </Draggable>
  );
};

export default Column;
