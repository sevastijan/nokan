"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaFlag,
  FaLink,
  FaEdit,
  FaPaperclip,
} from "react-icons/fa";

import { useTaskManagement } from "@/app/components/SingleTaskView/hooks/useTaskManagement";
import { supabase } from "@/app/lib/supabase";
import { useSession } from "next-auth/react";

import CommentsSection from "@/app/components/SingleTaskView/CommentsSection";
import ActionFooter from "@/app/components/SingleTaskView/ActionFooter";
import ImagePreviewModal from "@/app/components/SingleTaskView/ImagePreviewModal";
import Button from "@/app/components/Button/Button";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

import { SingleTaskViewProps, TaskDetail, User } from "@/app/types/globalTypes";
import { useGetTeamMembersByBoardIdQuery } from "@/app/store/apiSlice";

import "@/app/components/SingleTaskView/styles/styles.css";

import UserSelector from "@/app/components/SingleTaskView/UserSelector";
const SingleTaskView = ({
  taskId,
  mode,
  columnId,
  boardId,
  onClose,
  onTaskUpdate,
  onTaskAdd,
  onTaskAdded,
}: SingleTaskViewProps) => {
  const { data: session } = useSession();
  const { currentUser, loading: userLoading } = useCurrentUser(session);

  const [tempTitle, setTempTitle] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(
    null
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(mode === "add");
  const [waitBeforeError, setWaitBeforeError] = useState(true);

  const { data: teamMembers = [] } = useGetTeamMembersByBoardIdQuery(
    boardId || "",
    {
      skip: !boardId,
    }
  );

  const availableUsers: User[] = useMemo(
    () => teamMembers.map((tm) => tm.user),
    [teamMembers]
  );

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
    fetchedTask,
  } = useTaskManagement({
    taskId,
    mode,
    columnId,
    boardId: boardId!,
    currentUser: currentUser || undefined,
    onTaskUpdate,
    onTaskAdded: (task: TaskDetail) => {
      onTaskAdded?.({
        ...task,
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

  useEffect(() => {
    const timeout = setTimeout(() => setWaitBeforeError(false), 500);
    return () => clearTimeout(timeout);
  }, []);

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

      const selectedUser = availableUsers.find((u) => u.id === assigneeId);
      if (!selectedUser) {
        await updateTask({ user_id: null, assignee: null });
        return;
      }

      await updateTask({
        user_id: assigneeId,
        assignee: selectedUser,
      });
    },
    [availableUsers, updateTask]
  );

  console.log("🚀 boardId:", boardId, "teamMembers:", teamMembers);

  const handleDateChange = useCallback(
    (type: "start" | "end", value: string) => {
      if (type === "start") setStartDate(value);
      else setEndDate(value);
      updateTask({
        start_date: type === "start" ? value : task?.start_date || null,
        end_date: type === "end" ? value : task?.end_date || null,
      });
    },
    [task, updateTask]
  );

  const handleAttachmentUpload = useCallback(
    async (files: File[]) => {
      setAttachments((prev) => [...prev, ...files]);
      for (const file of files) {
        const result = await uploadAttachment(file);
        if (!result) {
          toast.error("Upload failed");
        } else {
          const newAttachments = task?.attachments
            ? [...task.attachments, result]
            : [result];
          updateTask({ attachments: newAttachments });
        }
      }
    },
    [task?.attachments, uploadAttachment, updateTask]
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
    )
      return;
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
          className="bg-slate-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-slate-600"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
        >
          {/* Header */}
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
                  className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
                    task.priority
                  )}`}
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
            {/* Title */}
            <div>
              <label className="text-sm">Title</label>
              <input
                type="text"
                className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded"
                value={tempTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm">Description</label>
              <textarea
                className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded resize-none"
                value={tempDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Describe the task..."
                rows={4}
              />
            </div>

            {/* Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Priority</label>
                <select
                  className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded"
                  value={task?.priority || ""}
                  onChange={(e) =>
                    updateTask({ priority: e.target.value || null })
                  }
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <UserSelector
                selectedUser={
                  availableUsers.find((u) => u.id === selectedAssigneeId) ||
                  null
                }
                availableUsers={availableUsers}
                onUserSelect={handleAssigneeChange}
                label="Assignee"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm flex items-center gap-1">
                  <FaClock className="text-green-400" /> Start Date
                </label>
                <input
                  type="date"
                  className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded"
                  value={startDate}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm flex items-center gap-1">
                  <FaClock className="text-red-400" /> End Date
                </label>
                <input
                  type="date"
                  className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                />
              </div>
            </div>

            {/* Comments */}
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
            <div>
              <label className="text-sm flex items-center gap-2">
                <FaPaperclip /> Attachments
              </label>
              <input
                type="file"
                multiple
                onChange={(e) =>
                  handleAttachmentUpload(Array.from(e.target.files || []))
                }
                className="mt-1"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {task?.attachments?.map((att, idx) => (
                  <a
                    key={idx}
                    href={
                      supabase.storage
                        .from("attachments")
                        .getPublicUrl(att.file_path).data.publicUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {att.file_name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <ActionFooter
            isNewTask={isNewTask}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={saving}
            onSave={handleSave}
            onClose={handleClose}
            onDelete={!isNewTask ? deleteTask : undefined}
            task={task ?? undefined}
          />
        </motion.div>
      </motion.div>

      {/* Image Preview */}
      {task?.imagePreview && (
        <ImagePreviewModal
          imageUrl={task.imagePreview}
          onClose={() => updateTask({ imagePreview: null })}
        />
      )}
    </>
  );
};

export default SingleTaskView;
