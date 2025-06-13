// src/app/components/SingleTaskView/SingleTaskView.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaClock,
  FaFlag,
  FaLink,
  FaPaperclip,
  FaCalendarAlt,
} from "react-icons/fa";

import { useTaskManagement } from "@/app/components/SingleTaskView/hooks/useTaskManagement";
import { supabase } from "@/app/lib/supabase";
import { useSession } from "next-auth/react";
import AttachmentsList from "./AttachmentsList";
import CommentsSection from "@/app/components/SingleTaskView/CommentsSection";
import ImagePreviewModal from "@/app/components/SingleTaskView/ImagePreviewModal";
import Button from "@/app/components/Button/Button";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import Avatar from "../Avatar/Avatar";
import PrioritySelector from "@/app/components/SingleTaskView/PrioritySelector";

import {
  SingleTaskViewProps,
  TaskDetail,
  User,
  Priority,
} from "@/app/types/globalTypes";
import UserSelector from "@/app/components/SingleTaskView/UserSelector";

import "@/app/components/SingleTaskView/styles/styles.css";

const SingleTaskView = ({
  taskId,
  mode,
  columnId,
  boardId,
  onClose,
  onTaskUpdate,
  onTaskAdd, // unused, can remove if not used elsewhere
  onTaskAdded,
}: SingleTaskViewProps) => {
  const { data: session } = useSession();
  const { currentUser, loading: userLoading } = useCurrentUser(session);

  // Local UI state mirrors task fields for inputs
  const [tempTitle, setTempTitle] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(
    null
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [waitBeforeError, setWaitBeforeError] = useState(true);

  // Use the hook for task management
  const {
    task,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    isNewTask,
    updateTask,
    saveNewTask,
    saveExistingTask,
    deleteTask,
    fetchTaskData,
    uploadAttachment,
    teamMembers, // lista użytkowników z hooka
    fetchedTask,
  } = useTaskManagement({
    taskId,
    mode,
    columnId,
    boardId: boardId!,
    currentUser: currentUser || undefined,
    onTaskUpdate,
    onTaskAdded: (t: TaskDetail) => {
      onTaskAdded?.({
        ...t,
        column_id: columnId || "",
        board_id: boardId || "",
      });
    },
    onClose,
  });

  useEffect(() => {
    if (task) {
      setTempTitle(task.title || "");
      setTempDescription(task.description || "");
      setSelectedAssigneeId(task.assignee?.id || task.user_id || null);
      setStartDate(task.start_date || "");
      setEndDate(task.end_date || "");
    }
  }, [task]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTempTitle(newTitle);
      updateTask({ title: newTitle });
    },
    [updateTask]
  );

  const handleDescriptionChange = useCallback(
    (desc: string) => {
      setTempDescription(desc);
      updateTask({ description: desc });
    },
    [updateTask]
  );

  const handleAssigneeChange = useCallback(
    async (assigneeId: string | null) => {
      setSelectedAssigneeId(assigneeId);

      if (!assigneeId) {
        await updateTask({ user_id: null, assignee: null });
        return;
      }
      const selectedUser = teamMembers.find((u) => u.id === assigneeId);
      if (!selectedUser) {
        await updateTask({ user_id: null, assignee: null });
        return;
      }
      await updateTask({
        user_id: assigneeId,
        assignee: selectedUser,
      });
    },
    [teamMembers, updateTask]
  );

  const handleDateChange = useCallback(
    (type: "start" | "end", value: string) => {
      if (type === "start") {
        setStartDate(value);
        updateTask({ start_date: value });
      } else {
        setEndDate(value);
        updateTask({ end_date: value });
      }
    },
    [updateTask]
  );

  const handleAttachmentUpload = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const result = await uploadAttachment(file);
        if (!result) {
          toast.error("Upload failed");
        }
      }
    },
    [uploadAttachment]
  );

  const handleSave = useCallback(async () => {
    const success = isNewTask ? await saveNewTask() : await saveExistingTask();
    if (success) {
      onClose();
      toast.success(isNewTask ? "Task created" : "Task updated");
    }
  }, [isNewTask, saveNewTask, saveExistingTask, onClose]);

  const handleClose = () => {
    if (
      hasUnsavedChanges &&
      !confirm("You have unsaved changes. Close anyway?")
    ) {
      return;
    }
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      low: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return (
      map[priority] || "bg-slate-500/20 text-slate-400 border-slate-500/30"
    );
  };

  function calculateDuration(
    start: string | null | undefined,
    end: string | null | undefined
  ): number | null {
    if (!start || !end) return null;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffMs = d2.getTime() - d1.getTime();
    if (isNaN(diffMs) || diffMs < 0) return null;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days;
  }

  // Delay before showing "Task not found"
  useEffect(() => {
    const timeout = setTimeout(() => setWaitBeforeError(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  // Render loading / error
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-white">
          Loading task...
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
  if (userLoading || !currentUser) {
    return <div className="text-white p-4">Loading user...</div>;
  }
  if (!isNewTask && !loading && !task) return null;
  if (!isNewTask && !fetchedTask) return null;
  if (!isNewTask && !loading && !task && !waitBeforeError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-white">
          Task not found
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-slate-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-slate-600"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
        >
          {/* 1. Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-600">
            <div className="flex items-center gap-3 text-white">
              <span className="bg-slate-700 px-2 py-1 rounded text-xs font-mono">
                #{task?.id?.slice(-6) || "NEW"}
              </span>
              <h1 className="text-lg font-semibold">
                {isNewTask ? "New Task" : tempTitle || "Untitled"}
              </h1>
              {task?.priority && (
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    // przykład kolorowania wg mapy lub z p.color
                    getPriorityColor(task.priority)
                  }`}
                >
                  <FaFlag className="inline mr-1" />
                  {task.priority}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isNewTask && task?.id && (
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
          </div>

          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <UserSelector
                    selectedUser={
                      teamMembers.find((u) => u.id === selectedAssigneeId) ||
                      null
                    }
                    availableUsers={teamMembers}
                    onUserSelect={handleAssigneeChange}
                    label={undefined}
                  />
                </div>
                <div>
                  <PrioritySelector
                    selectedPriority={task?.priority || null}
                    onChange={(newId: string | null) => {
                      updateTask({ priority: newId });
                    }}
                    onDropdownToggle={(open: boolean) => {}}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-slate-300">Description</label>
                <textarea
                  className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={tempDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Describe the task..."
                  rows={4}
                />
              </div>
              {/* Schedule: Start Date, Due Date, Duration */}

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
                    onChange={(e) => handleDateChange("start", e.target.value)}
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
                    min={startDate || undefined}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                  />
                </div>
              </div>

              {/* Duration */}
              {(() => {
                const dur = calculateDuration(startDate, endDate);
                if (dur === null) return null;
                return (
                  <div className="mt-3 p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 flex items-center gap-2">
                    <FaCalendarAlt className="text-slate-300 w-4 h-4" />
                    <span className="font-medium">
                      Duration:&nbsp;{dur} {dur === 1 ? "day" : "days"}
                    </span>
                  </div>
                );
              })()}

              {/* Comments Section */}
              {taskId && (
                <CommentsSection
                  taskId={taskId}
                  comments={task?.comments || []}
                  currentUser={currentUser!}
                  task={task}
                  onRefreshComments={async () => {
                    await fetchTaskData();
                  }}
                  onImagePreview={(url: string) =>
                    updateTask({ imagePreview: url })
                  }
                />
              )}

              {/* Attachments */}
              <div className="mt-6">
                <AttachmentsList
                  attachments={task?.attachments || []}
                  currentUser={currentUser!}
                  taskId={task!.id}
                  onTaskUpdate={async () => {
                    await fetchTaskData();
                  }}
                  onAttachmentsUpdate={(updateFn) => {
                    fetchTaskData();
                  }}
                />
              </div>
            </div>

            {/* Pionowy separator */}
            <div className="hidden lg:block w-px bg-slate-600/50"></div>

            {/* Prawa kolumna: szczegóły zadania */}
            <div className="w-full lg:w-80 bg-slate-800/60 border-l border-slate-600 overflow-y-auto p-6 text-white">
              {/* Assignee w szczegółach */}
              <div className="mb-6">
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
                    <div className="flex flex-col text-white">
                      <span className="font-medium">{task.assignee.name}</span>
                      <span className="text-slate-400 text-sm">
                        {task.assignee.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400">No assignee</div>
                )}
              </div>

              {/* Created / Last Updated */}
              <div className="mb-6">
                <h3 className="text-sm text-slate-400 uppercase mb-2">
                  Created
                </h3>
                {task?.created_at ? (
                  <div className="text-white">
                    {new Date(task.created_at).toLocaleString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                ) : (
                  <div className="text-slate-400">-</div>
                )}
              </div>
              <div className="mb-6">
                <h3 className="text-sm text-slate-400 uppercase mb-2">
                  Last Updated
                </h3>
                {task?.updated_at ? (
                  <div className="text-white">
                    {new Date(task.updated_at).toLocaleString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                ) : (
                  <div className="text-slate-400">-</div>
                )}
                w
              </div>
              {task.start_date && task.end_date && (
                <>
                  <h4 className="text-sm font-semibold text-slate-300 mt-4 mb-2">
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
                </>
              )}
              {/* Możesz dodać inne pola w sidebarze: status, labels itd. */}
            </div>
          </div>

          {/* 3. Footer */}
          <div className="flex justify-end items-center p-4 border-t border-slate-600 gap-3">
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
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SingleTaskView;
