import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaImage,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { TaskDetail } from "@/app/types/globalTypes";

interface TaskCardProps {
  task: TaskDetail;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate duration if both dates exist
  const getDuration = () => {
    if (!task.start_date || !task.end_date) return null;

    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "border-red-500 bg-red-500/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      case "low":
        return "border-green-500 bg-green-500/10";
      default:
        return "border-slate-600 bg-slate-700/30";
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const duration = getDuration();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative group cursor-pointer
        bg-slate-800/95 backdrop-blur-sm
        border-2 ${getPriorityColor(task.priority || "medium")}
        rounded-xl shadow-lg
        p-4 space-y-3
        transition-all duration-200
        hover:shadow-xl hover:shadow-slate-900/50
        ${className}
      `}
      onClick={() => onEdit(task.id!)}
    >
      {/* Header with Title and Actions */}
      <div className="flex items-start justify-between">
        <h3 className="text-white font-semibold text-sm leading-tight flex-1 pr-2">
          {task.title}
        </h3>

        {/* Action Buttons */}
        <motion.div
          className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task.id!);
            }}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"
            title="Edit task"
          >
            <FaEdit className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id!);
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
            title="Delete task"
          >
            <FaTrash className="w-3 h-3" />
          </button>
        </motion.div>
      </div>

      {/* Description Preview */}
      {task.description && (
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Dates and Duration */}
      {(task.start_date || task.end_date) && (
        <div className="space-y-2">
          {/* Date Range */}
          <div className="flex items-center justify-between text-xs">
            {task.start_date && (
              <div className="flex items-center space-x-1 text-blue-400">
                <FaCalendarAlt className="w-3 h-3" />
                <span>{formatDate(task.start_date)}</span>
              </div>
            )}

            {task.end_date && (
              <div className="flex items-center space-x-1 text-red-400">
                <FaClock className="w-3 h-3" />
                <span>{formatDate(task.end_date)}</span>
              </div>
            )}
          </div>

          {/* Duration Badge */}
          {duration && (
            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-400 text-xs">
              <FaClock className="w-3 h-3" />
              <span>
                {duration} day{duration !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Row: Assignee and Attachments */}
      <div className="flex items-center justify-between">
        {/* Assignee */}
        <div className="flex items-center space-x-2">
          {task.assignee ? (
            <div className="flex items-center space-x-2">
              {task.assignee.image ? (
                <img
                  src={task.assignee.image}
                  alt={task.assignee.name}
                  className="w-6 h-6 rounded-full border border-slate-600"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {task.assignee.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
              <span className="text-slate-300 text-xs font-medium">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-slate-500">
              <FaUser className="w-3 h-3" />
              <span className="text-xs">Unassigned</span>
            </div>
          )}
        </div>

        {/* Attachments Indicator */}
        {task.images && task.images.length > 0 && (
          <div className="flex items-center space-x-1 text-slate-400">
            <FaImage className="w-3 h-3" />
            <span className="text-xs">{task.images.length}</span>
          </div>
        )}
      </div>

      {/* Priority Indicator */}
      <div className="absolute top-2 right-2">
        <div
          className={`
            w-3 h-3 rounded-full
            ${task.priority === "high" ? "bg-red-500" : ""}
            ${task.priority === "medium" ? "bg-yellow-500" : ""}
            ${task.priority === "low" ? "bg-green-500" : ""}
          `}
          title={`Priority: ${task.priority || "medium"}`}
        />
      </div>
    </motion.div>
  );
};

export default TaskCard;
