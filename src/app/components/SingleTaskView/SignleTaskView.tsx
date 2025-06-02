"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaTimes,
  FaPaperclip,
  FaSmile,
  FaAt,
  FaEllipsisH,
  FaArrowRight,
  FaLink,
  FaShare,
  FaCopy,
  FaLock,
  FaPlus,
  FaUsers,
  FaTrash,
} from "react-icons/fa";
import { TaskDetail, Comment, User, Priority, Attachment } from "./types";
import UserSelector from "./UserSelector";
import PrioritySelector from "./PrioritySelector";

interface SingleTaskViewProps {
  taskId: string;
  onClose: () => void;
  currentUser: User;
}

/**
 * Single task detail view component with full task management capabilities
 */
const SingleTaskView = ({
  taskId,
  onClose,
  currentUser,
}: SingleTaskViewProps) => {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchTaskData();
    fetchComments();
    fetchAvailableUsers();
    fetchPriorities();
  }, [taskId]);

  /**
   * Fetch task data with related information
   */
  const fetchTaskData = async () => {
    try {
      const { data: taskData, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:users(id, name, email, image),
          priority_info:priorities(id, label, color)
        `
        )
        .eq("id", taskId)
        .single();

      if (error) throw error;

      setTask(taskData);
      setEditedTitle(taskData.title);
      setEditedDescription(taskData.description || "");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Error loading task");
      setLoading(false);
    }
  };

  /**
   * Fetch task comments with author information
   */
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .select(
          `
          *,
          author:users(id, name, email, image)
        `
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Error loading comments");
    }
  };

  /**
   * Fetch available users for assignment
   */
  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("name");

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  /**
   * Fetch available priorities
   */
  const fetchPriorities = async () => {
    try {
      const { data, error } = await supabase
        .from("priorities")
        .select("*")
        .order("id");

      if (error) throw error;
      setPriorities(data || []);
    } catch (error) {
      console.error("Error fetching priorities:", error);
    }
  };

  /**
   * Update task with new data
   */
  const updateTask = async (updates: Partial<TaskDetail>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;

      await fetchTaskData();
      toast.success("Task updated");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Error updating task");
    }
  };

  /**
   * Handle title save after editing
   */
  const handleTitleSave = async () => {
    if (editedTitle.trim() !== task?.title) {
      await updateTask({ title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  /**
   * Handle description save after editing
   */
  const handleDescriptionSave = async () => {
    if (editedDescription !== (task?.description || "")) {
      await updateTask({ description: editedDescription });
    }
  };

  /**
   * Add new comment to the task
   */
  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          content: newComment.trim(),
        })
        .select();

      if (error) throw error;

      setNewComment("");
      await fetchComments();
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Error adding comment");
    }
  };

  /**
   * Delete comment from task
   */
  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("task_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      await fetchComments();
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Error deleting comment");
    }
  };

  /**
   * Handle paste event in comment textarea
   */
  const handleCommentPaste = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    const items = event.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.indexOf("image") !== -1) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image too large. Maximum size is 5MB.");
          return;
        }

        setUploading(true);
        try {
          const fileName = `pasted-image-${Date.now()}.png`;
          const filePath = `task-attachments/${taskId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Zamiast publicUrl użyj signed URL
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("attachments")
              .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 rok

          if (signedUrlError) throw signedUrlError;

          const attachment: Attachment = {
            id: `att_${Date.now()}`,
            fileName: fileName,
            filePath: filePath,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser.id,
          };

          const currentAttachments = task?.attachments || [];
          const updatedAttachments = [...currentAttachments, attachment];

          await supabase
            .from("tasks")
            .update({
              attachments: updatedAttachments,
              updated_at: new Date().toISOString(),
            })
            .eq("id", taskId);

          const textarea = event.target as HTMLTextAreaElement;
          const cursorPosition = textarea.selectionStart;
          const textBefore = newComment.substring(0, cursorPosition);
          const textAfter = newComment.substring(cursorPosition);

          const imageMarkdown = `![${fileName}](${signedUrlData.signedUrl})`;
          setNewComment(textBefore + imageMarkdown + textAfter);

          await fetchTaskData();
          toast.success("Image pasted successfully");
        } catch (error) {
          console.error("Error uploading pasted image:", error);
          toast.error("Error uploading image");
        } finally {
          setUploading(false);
        }
      }
    }
  };

  /**
   * Render markdown content with image support
   */
  const renderMarkdownContent = (content: string) => {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const parts = content.split(imageRegex);

    console.log("Rendering content:", content);
    console.log("Image parts:", parts);

    const elements = [];
    for (let i = 0; i < parts.length; i += 3) {
      if (parts[i]) {
        elements.push(
          <span key={`text-${i}`} className="whitespace-pre-wrap">
            {parts[i]}
          </span>
        );
      }

      if (parts[i + 1] && parts[i + 2]) {
        console.log("Rendering image:", parts[i + 2]);
        elements.push(
          <motion.img
            key={`img-${i}`}
            whileHover={{ scale: 1.02 }}
            src={parts[i + 2]}
            alt={parts[i + 1]}
            className="max-w-full h-auto rounded-lg mt-2 mb-2 cursor-pointer border border-gray-600 hover:border-gray-500 transition-colors"
            onClick={() => setImagePreview(parts[i + 2])}
            onError={(e) => console.error("Image load error:", e)}
          />
        );
      }
    }

    return elements.length > 0 ? elements : content;
  };

  /**
   * Handle file upload for task attachments
   */
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `task-attachments/${taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const attachment: Attachment = {
        id: `att_${Date.now()}`,
        fileName: file.name,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.id,
      };

      const currentAttachments = task?.attachments || [];
      const updatedAttachments = [...currentAttachments, attachment];

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          attachments: updatedAttachments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (updateError) throw updateError;

      await fetchTaskData();
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Error uploading file");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  /**
   * Delete attachment from task
   */
  const deleteAttachment = async (attachment: Attachment) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([attachment.filePath]);

      if (storageError) console.warn("Storage delete warning:", storageError);

      const updatedAttachments = (task?.attachments || []).filter(
        (att) => att.id !== attachment.id
      );

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          attachments: updatedAttachments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (updateError) throw updateError;

      await fetchTaskData();
      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Error deleting attachment");
    }
  };

  /**
   * Download attachment
   */
  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("attachments")
        .download(attachment.filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file");
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /**
   * Get file icon based on mime type
   */
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "📊";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
    return "📁";
  };

  /**
   * Toggle task completion status
   */
  const toggleCompleted = async () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    toast.success(
      newStatus ? "Task marked as complete" : "Task marked as incomplete"
    );
  };

  /**
   * Update task assignee
   */
  const updateAssignee = async (userId: string) => {
    await updateTask({ user_id: userId });
  };

  /**
   * Update task priority
   */
  const updatePriority = async (priorityId: string) => {
    await updateTask({ priority: priorityId });
  };

  /**
   * Get user avatar URL with fallback
   */
  const getUserAvatar = (user: User) => {
    return (
      user.image ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=3b82f6&color=fff`
    );
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg p-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg p-8"
        >
          <p className="text-center text-gray-600">Task not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full transition-colors"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
        onClick={onClose}
      >
        <motion.div
          className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto cursor-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleCompleted}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isCompleted
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
                }`}
              >
                <FaCheck className="w-4 h-4" />
                {isCompleted ? "Mark as incomplete" : "Mark as complete"}
              </motion.button>

              <div className="flex items-center gap-2">
                {[FaCopy, FaPaperclip, FaShare, FaLink, FaEllipsisH].map(
                  (Icon, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-400 hover:text-gray-200 rounded cursor-pointer"
                    >
                      <Icon className="w-4 h-4" />
                    </motion.button>
                  )
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-200 rounded cursor-pointer"
                >
                  <FaTimes className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FaLock className="w-4 h-4" />
              <span>This task is private to you.</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-blue-400 hover:text-blue-300 ml-2 cursor-pointer"
              >
                Share
              </motion.button>
            </div>
          </div>

          {/* Task Title */}
          <div className="p-6 border-b border-gray-600">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                className="text-3xl font-bold w-full border-none outline-none bg-transparent text-white"
                autoFocus
              />
            ) : (
              <motion.h1
                whileHover={{ backgroundColor: "#374151" }}
                className="text-3xl font-bold cursor-pointer p-2 rounded text-white"
                onClick={() => setIsEditing(true)}
              >
                {task.title}
              </motion.h1>
            )}
          </div>

          {/* Task Details */}
          <div className="p-6 space-y-6">
            {/* Assignee */}
            <UserSelector
              selectedUser={task.assignee}
              availableUsers={availableUsers}
              onUserSelect={updateAssignee}
              label="Assigned to"
            />

            {/* Priority */}
            <PrioritySelector
              selectedPriority={task.priority_info}
              availablePriorities={priorities}
              onPrioritySelect={updatePriority}
              label="Priority"
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                placeholder="Add details to this task..."
                className="w-full min-h-[100px] p-3 border border-gray-600 rounded-lg resize-vertical bg-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Attachments ({task.attachments.length})
                </label>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <motion.div
                      key={attachment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <div className="text-2xl">
                        {getFileIcon(attachment.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-200 truncate">
                          {attachment.fileName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatFileSize(attachment.fileSize)} •{" "}
                          {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => downloadAttachment(attachment)}
                          className="p-2 text-gray-400 hover:text-blue-400 rounded cursor-pointer"
                          title="Download"
                        >
                          <FaArrowRight className="w-4 h-4 rotate-90" />
                        </motion.button>
                        {attachment.uploadedBy === currentUser.id && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteAttachment(attachment)}
                            className="p-2 text-gray-400 hover:text-red-400 rounded cursor-pointer"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-600 p-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={getUserAvatar(currentUser)}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-400">
                  {currentUser.name} created this task
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(task.created_at)}
                </span>
              </div>
            </div>

            {/* Add Comment */}
            <div className="flex gap-3 mb-6">
              <img
                src={getUserAvatar(currentUser)}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onPaste={handleCommentPaste}
                  placeholder="Ask a question or add an update... (Ctrl+V to paste images)"
                  className="w-full p-3 border border-gray-600 rounded-lg resize-vertical min-h-[80px] bg-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {[FaSmile, FaAt].map((Icon, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-400 hover:text-gray-200 rounded cursor-pointer"
                      >
                        <Icon className="w-4 h-4" />
                      </motion.button>
                    ))}
                    <motion.label
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-400 hover:text-gray-200 rounded cursor-pointer"
                      title="Attach file"
                    >
                      <FaPaperclip className="w-4 h-4" />
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                      />
                    </motion.label>
                    {uploading && (
                      <span className="text-sm text-gray-400">
                        Uploading...
                      </span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 group"
                >
                  <img
                    src={getUserAvatar(comment.author)}
                    alt={comment.author.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-200">
                        {comment.author.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>

                      {/* Delete button - show only for comment author or task owner */}
                      {(comment.author.id === currentUser.id ||
                        task.user_id === currentUser.id) && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-opacity ml-auto"
                          title="Delete comment"
                        >
                          <FaTrash className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-gray-200 bg-gray-700 p-3 rounded-lg"
                    >
                      {renderMarkdownContent(comment.content)}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Collaborators</span>
              <div className="flex -space-x-2">
                <img
                  src={getUserAvatar(currentUser)}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full border-2 border-gray-700"
                />
                {task.assignee && task.assignee.id !== currentUser.id && (
                  <img
                    src={getUserAvatar(task.assignee)}
                    alt={task.assignee.name}
                    className="w-6 h-6 rounded-full border-2 border-gray-700"
                  />
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-6 h-6 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400 hover:text-gray-200 cursor-pointer"
              >
                <FaPlus className="w-3 h-3" />
              </motion.button>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <FaUsers className="w-4 h-4" />
              Leave task
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-60"
          onClick={() => setImagePreview(null)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-full rounded-lg"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setImagePreview(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <FaTimes className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SingleTaskView;
