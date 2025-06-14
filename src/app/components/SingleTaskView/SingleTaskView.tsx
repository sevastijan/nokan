// src/app/components/SingleTaskView/SingleTaskView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaClock,
  FaFlag,
  FaLink,
  FaCalendarAlt,
} from "react-icons/fa";

import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useTaskManagement } from "./hooks/useTaskManagement";

import { useTitleChange } from "@/app/hooks/useTitleChange";
import { useDescriptionChange } from "@/app/hooks/useDescriptionChange";
import { useAssigneeChange } from "@/app/hooks/useAssigneeChange";
import { useDateChange } from "@/app/hooks/useDateChange";
import { useAttachmentUpload } from "@/app/hooks/useAttachmentUpload";

import UserSelector from "./UserSelector";
import PrioritySelector from "./PrioritySelector";
import CommentsSection from "./CommentsSection";
import AttachmentsList from "./AttachmentsList";
import Button from "../Button/Button";
import Avatar from "../Avatar/Avatar";

import { formatDate } from "@/app/utils/helpers";
import { SingleTaskViewProps, TaskDetail } from "@/app/types/globalTypes";
import "./styles/styles.css";

export default function SingleTaskView({
  taskId: propTaskId,
  mode,
  columnId: propColumnId,
  boardId: propBoardId,
  onClose,
  onTaskUpdate,
  onTaskAdd,
  onTaskAdded,
}: SingleTaskViewProps) {
  // 1) Core hooks (always at the top)
  const { data: session } = useSession();
  const { currentUser, loading: userLoading } = useCurrentUser(session);

  const {
    task,
    loading,
    error,
    saving,
    hasUnsavedChanges,
    isNewTask,
    updateTask,
    saveNewTask,
    saveExistingTask,
    deleteTask,
    fetchTaskData,
    uploadAttachment,
    teamMembers,
    fetchedTask,
  } = useTaskManagement({
    taskId: propTaskId ?? "",
    mode,
    columnId: propColumnId ?? "",
    boardId: propBoardId ?? "",
    currentUser: currentUser || undefined,
    onTaskUpdate,
    onTaskAdded: (t) =>
      onTaskAdded?.({
        ...t,
        column_id: propColumnId ?? "",
        board_id: propBoardId ?? "",
      }),
    onClose,
  });

  // 2) Field-specific hooks
  const { title, handleChange: handleTitleChange } = useTitleChange(
    task,
    updateTask
  );
  const { description, handleChange: handleDescriptionChange } =
    useDescriptionChange(task, updateTask);
  const { assigneeId, handleChange: handleAssigneeChange } = useAssigneeChange(
    task,
    teamMembers,
    updateTask
  );
  const { startDate, endDate, handleStartChange, handleEndChange } =
    useDateChange(task, updateTask);
  const { uploadFiles } = useAttachmentUpload(uploadAttachment);

  // 3) Local UI state
  const [isVisible, setIsVisible] = useState(true);
  // For delaying "not found" placeholder
  const [showErrorPlaceholder, setShowErrorPlaceholder] = useState(false);

  // 4) Side-effects
  // Delay before showing "task not found" fallback
  useEffect(() => {
    const timer = setTimeout(() => setShowErrorPlaceholder(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // 5) Early returns
  if (loading || userLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-white">
          Loading…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }
  // If in edit mode but no fetchedTask after a delay, close or return null
  if (!isNewTask && !fetchedTask && showErrorPlaceholder) {
    return null;
  }

  // 6) Helper functions
  const calculateDuration = (s?: string, e?: string): number | null => {
    if (!s || !e) return null;
    const diff = new Date(e).getTime() - new Date(s).getTime();
    if (diff < 0 || isNaN(diff)) return null;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const getPriorityClasses = (p: string) => {
    const map: Record<string, string> = {
      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      low: "bg-green-500/20 text-green-500 border-green-500/30",
    };
    return (
      map[p.toLowerCase()] ??
      "bg-slate-500/20 text-slate-400 border-slate-500/30"
    );
  };

  // 7) Action handlers
  const handleSave = async () => {
    const ok = isNewTask ? await saveNewTask() : await saveExistingTask();
    if (ok) {
      setIsVisible(false);
      toast.success(isNewTask ? "Task created" : "Task updated");
    }
  };
  const handleClose = () => {
    if (
      hasUnsavedChanges &&
      !confirm("You have unsaved changes. Close anyway?")
    )
      return;
    setIsVisible(false);
  };

  // 8) Render
  return (
    <AnimatePresence initial onExitComplete={onClose}>
      {isVisible && (
        // Overlay
        <motion.div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close if clicking outside modal
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          {/* Modal container */}
          <motion.div
            className="bg-slate-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-slate-600"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { duration: 0.2 } }}
            exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
          >
            {/* Header */}
            {task && (
              <header className="flex justify-between items-center p-4 border-b border-slate-600">
                <div className="flex items-center gap-3 text-white">
                  <span className="bg-slate-700 px-2 py-1 rounded text-xs font-mono">
                    {task.id ? task.id.slice(-6) : "#??????"}
                  </span>
                  <input
                    type="text"
                    value={title}
                    placeholder={isNewTask ? "New Task" : "Untitled"}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="bg-transparent text-lg font-semibold flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {task.priority && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getPriorityClasses(
                        task.priority
                      )}`}
                    >
                      <FaFlag className="inline mr-1" />
                      {task.priority}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isNewTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<FaLink />}
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}?task=${task.id}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link copied");
                      }}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<FaTimes />}
                    onClick={handleClose}
                  />
                </div>
              </header>
            )}

            {/* Main Body */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left/form pane */}
              <section className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
                {/* Assignee & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UserSelector
                    selectedUser={
                      teamMembers.find((u) => u.id === assigneeId) || null
                    }
                    availableUsers={teamMembers}
                    onUserSelect={handleAssigneeChange}
                  />
                  <PrioritySelector
                    selectedPriority={task?.priority || null}
                    onChange={(p) => updateTask({ priority: p })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-slate-300">Description</label>
                  <textarea
                    className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe the task..."
                    rows={4}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="text-sm flex items-center gap-1 text-slate-300">
                      <FaClock className="text-green-400 w-4 h-4" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={startDate}
                      onChange={(e) => handleStartChange(e.target.value)}
                    />
                  </div>
                  {/* Due Date */}
                  <div>
                    <label className="text-sm flex items-center gap-1 text-slate-300">
                      <FaClock className="text-red-400 w-4 h-4" />
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={endDate}
                      onChange={(e) => handleEndChange(e.target.value)}
                      min={startDate || undefined}
                    />
                  </div>
                </div>

                {/* Duration display */}
                {(() => {
                  const dur = calculateDuration(startDate, endDate);
                  if (dur === null) return null;
                  return (
                    <div className="mt-3 p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 flex items-center gap-2">
                      <FaCalendarAlt className="text-slate-300 w-4 h-4" />
                      <span className="font-medium">
                        Duration: {dur} {dur === 1 ? "day" : "days"}
                      </span>
                    </div>
                  );
                })()}

                {/* Comments (edit mode only) */}
                {mode === "edit" && task?.id && (
                  <CommentsSection
                    task={task}
                    taskId={task.id}
                    comments={task.comments || []}
                    currentUser={currentUser!}
                    onRefreshComments={fetchTaskData}
                    onImagePreview={(url) => updateTask({ imagePreview: url })}
                  />
                )}

                {/* Attachments */}
                {task?.id && (
                  <AttachmentsList
                    attachments={task.attachments || []}
                    currentUser={currentUser!}
                    taskId={task.id}
                    uploadFiles={uploadFiles}
                    onAttachmentsUpdate={fetchTaskData}
                  />
                )}
              </section>

              {/* Divider */}
              <div className="hidden lg:block w-px bg-slate-600/50" />

              {/* Right sidebar */}
              <aside className="w-full lg:w-80 bg-slate-800/60 border-l border-slate-600 overflow-y-auto p-6 text-white">
                {/* Assignee info */}
                <section className="mb-6">
                  <h3 className="text-sm text-slate-400 uppercase mb-2">
                    Assignee
                  </h3>
                  {task?.assignee ? (
                    <div className="flex items-center gap-3 bg-slate-700 p-3 rounded-lg">
                      <Avatar
                        src={task.assignee.image || ""}
                        alt={task.assignee.name}
                        size={32}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {task.assignee.name}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {task.assignee.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400">No assignee</p>
                  )}
                </section>

                {/* Created */}
                <section className="mb-6">
                  <h3 className="text-sm text-slate-400 uppercase mb-2">
                    Created
                  </h3>
                  <p
                    className={
                      task?.created_at ? "text-white" : "text-slate-400"
                    }
                  >
                    {task?.created_at ? formatDate(task.created_at) : "-"}
                  </p>
                </section>

                {/* Last Updated */}
                <section className="mb-6">
                  <h3 className="text-sm text-slate-400 uppercase mb-2">
                    Last Updated
                  </h3>
                  <p
                    className={
                      task?.updated_at ? "text-white" : "text-slate-400"
                    }
                  >
                    {task?.updated_at ? formatDate(task.updated_at) : "-"}
                  </p>
                </section>

                {/* Duration in sidebar */}
                {task?.start_date && task.end_date && (
                  <section>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">
                      Duration
                    </h4>
                    <p className="text-sm">
                      {(() => {
                        const dur = calculateDuration(
                          task.start_date,
                          task.end_date
                        );
                        return dur !== null
                          ? `${dur} ${dur === 1 ? "day" : "days"}`
                          : "-";
                      })()}
                    </p>
                  </section>
                )}
              </aside>
            </div>

            {/* Footer */}
            {task && (
              <footer className="flex justify-end items-center p-4 border-t border-slate-600 gap-3">
                {!isNewTask && (
                  <Button variant="destructive" size="md" onClick={deleteTask}>
                    Delete
                  </Button>
                )}
                <Button variant="secondary" size="md" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {isNewTask ? "Create" : "Save Changes"}
                </Button>
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
