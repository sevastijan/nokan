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
import { TaskDetail, Comment, User, Priority } from "./types";
import UserSelector from "./UserSelector";
import PrioritySelector from "./PrioritySelector";

interface SingleTaskViewProps {
  taskId: string;
  onClose: () => void;
  currentUser: User;
}

/**
 * Single task detail view component with full task management capabilities
 * @param taskId - ID of the task to display
 * @param onClose - Function to close the task view
 * @param currentUser - Current authenticated user
 */
const SingleTaskView: React.FC<SingleTaskViewProps> = ({
  taskId,
  onClose,
  currentUser,
}) => {
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
      toast.error("Błąd podczas ładowania taska");
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
      toast.error("Błąd podczas ładowania komentarzy");
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
      toast.error("Błąd podczas ładowania użytkowników");
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
      toast.error("Błąd podczas ładowania priorytetów");
    }
  };

  /**
   * Update task with new data
   * @param updates - Partial task data to update
   */
  const updateTask = async (updates: Partial<TaskDetail>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;

      await fetchTaskData();
      toast.success("Task zaktualizowany");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Błąd podczas aktualizacji taska");
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

    // DODAJ TO ŻEBY SPRAWDZIĆ
    console.log("taskId type and value:", typeof taskId, taskId);
    console.log(
      "currentUser.id type and value:",
      typeof currentUser.id,
      currentUser.id
    );

    // Sprawdź czy taskId to prawidłowy UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      console.error("taskId is not a valid UUID:", taskId);
      toast.error("Invalid task ID");
      return;
    }

    if (!uuidRegex.test(currentUser.id)) {
      console.error("currentUser.id is not a valid UUID:", currentUser.id);
      toast.error("Invalid user ID");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          content: newComment.trim(),
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Comment added successfully:", data);
      setNewComment("");
      await fetchComments();
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Error adding comment");
    }
  };

  /**
   * Handle file upload for task attachments
   * @param event - File input change event
   */
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${taskId}-${Date.now()}.${fileExt}`;
      const filePath = `task-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const currentImages = task?.images || [];
      const updatedImages = [...currentImages, filePath];

      await updateTask({ images: updatedImages });
      toast.success("Plik przesłany");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Błąd podczas przesyłania pliku");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Toggle task completion status
   */
  const toggleCompleted = async () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    toast.success(
      newStatus
        ? "Task oznaczony jako ukończony"
        : "Task oznaczony jako nieukończony"
    );
  };

  /**
   * Update task assignee
   * @param userId - ID of the user to assign
   */
  const updateAssignee = async (userId: string) => {
    await updateTask({ user_id: userId });
  };

  /**
   * Update task priority
   * @param priorityId - ID of the priority to set
   */
  const updatePriority = async (priorityId: string) => {
    await updateTask({ priority: priorityId });
  };

  /**
   * Get user avatar URL with fallback
   * @param user - User object
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
   * @param dateString - ISO date string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
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
          <p className="text-center mt-4 text-gray-600">Ładowanie...</p>
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
          <p className="text-center text-gray-600">
            Task nie został znaleziony
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full transition-colors"
          >
            Zamknij
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {/* Główny overlay */}
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
        onClick={onClose}
      >
        {/* Modal content */}
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
                {isCompleted
                  ? "Oznacz jako niekompletne"
                  : "Oznacz jako kompletne"}
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
              <span>Ten task jest prywatny dla Ciebie.</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-blue-400 hover:text-blue-300 ml-2 cursor-pointer"
              >
                Udostępnij
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
                  {currentUser.name} utworzył ten task
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
                  placeholder="Zadaj pytanie lub dodaj aktualizację..."
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
                    >
                      <FaPaperclip className="w-4 h-4" />
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </motion.label>
                    {uploading && (
                      <span className="text-sm text-gray-400">
                        Przesyłanie...
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
                    Wyślij
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
                  className="flex gap-3"
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
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-gray-200 bg-gray-700 p-3 rounded-lg"
                    >
                      {comment.content}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Współpracownicy</span>
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
              Opuść task
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SingleTaskView;
