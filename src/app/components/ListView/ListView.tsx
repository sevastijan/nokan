import { FiList } from "react-icons/fi";
import Image from "next/image";
import { Column as ColumnType } from "@/app/types/globalTypes";

interface ListViewProps {
  columns: ColumnType[];
  onOpenTaskDetail: (taskId: string) => void;
  onRemoveTask: (columnId: string, taskId: string) => Promise<void>;
  priorities: Array<{ id: string; label: string; color: string }>;
}
const ListView = ({
  columns,
  onOpenTaskDetail,
  onRemoveTask,
  priorities,
}: ListViewProps) => {
  const allTasks = columns.flatMap((column) =>
    column.tasks.map((task) => ({
      ...task,
      columnTitle: column.title,
      columnId: column.id,
    }))
  );

  const sortedTasks = allTasks.sort(
    (a, b) =>
      new Date(b.created_at || "").getTime() -
      new Date(a.created_at || "").getTime()
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 bg-slate-700/30 text-slate-300 text-sm font-medium">
        <div className="col-span-4">Task</div>
        <div className="col-span-2">Column</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-2">Assignee</div>
        <div className="col-span-2">Created</div>
      </div>

      <div className="divide-y divide-slate-700/30">
        {sortedTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FiList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No tasks found</p>
            <p className="text-sm">Create your first task to get started</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-700/20 transition-colors cursor-pointer"
              onClick={() => onOpenTaskDetail(task.id)}
            >
              <div className="col-span-4">
                <h3 className="text-white font-medium mb-1 line-clamp-1">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="col-span-2 flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                  {task.columnTitle}
                </span>
              </div>

              <div className="col-span-2 flex items-center">
                {task.priority && (
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{
                      backgroundColor:
                        priorities.find((p) => p.id === task.priority)?.color ||
                        "#6b7280",
                    }}
                  >
                    {priorities.find((p) => p.id === task.priority)?.label ||
                      task.priority}
                  </span>
                )}
              </div>

              <div className="col-span-2 flex items-center">
                {task.assignee?.name ? (
                  <div className="flex items-center gap-2">
                    {task.assignee?.image && (
                      <Image
                        src={task.assignee.image}
                        alt={task.assignee.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-slate-300 text-sm">
                      {task.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 text-sm">Unassigned</span>
                )}
              </div>

              <div className="col-span-2 flex items-center">
                <span className="text-slate-400 text-sm">
                  {task.created_at
                    ? new Date(task.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListView;
