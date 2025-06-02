"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";
import { TaskDetail, Comment, User, Priority } from "./types";
import TaskHeader from "./TaskHeader";
import TaskContent from "./TaskContent";
import CommentsSection from "./CommentsSection";
import TaskFooter from "./TaskFooter";
import ImagePreviewModal from "./ImagePreviewModal";

interface SingleTaskViewProps {
  taskId: string;
  onClose: () => void;
  currentUser: User;
}

const SingleTaskView = ({
  taskId,
  onClose,
  currentUser,
}: SingleTaskViewProps) => {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchTaskData();
    fetchComments();
    fetchAvailableUsers();
    fetchPriorities();
  }, [taskId]);

  const fetchTaskData = async () => {
    try {
      // Fetch basic task data
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;

      // Fetch assignee if exists
      let assignee = null;
      if (taskData.assignee_id) {
        const { data: assigneeData } = await supabase
          .from("users")
          .select("id, name, email, image")
          .eq("id", taskData.assignee_id)
          .single();
        assignee = assigneeData;
      }

      // Fetch priority if exists
      let priority_info = null;
      if (taskData.priority) {
        const { data: priorityData } = await supabase
          .from("priorities")
          .select("id, label, color")
          .eq("id", taskData.priority)
          .single();
        priority_info = priorityData;
      }

      // Fetch attachments
      const { data: attachmentsData } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId);

      setTask({
        ...taskData,
        assignee,
        priority_info,
        attachments: attachmentsData || [],
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Error loading task");
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch authors for each comment
      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: authorData } = await supabase
            .from("users")
            .select("id, name, email, image")
            .eq("id", comment.user_id)
            .single();

          return {
            ...comment,
            author: authorData,
          };
        })
      );

      setComments(commentsWithAuthors);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Error loading comments");
    }
  };

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-lg p-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-200">Loading...</p>
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
          className="bg-gray-800 rounded-lg p-8"
        >
          <p className="text-center text-gray-200">Task not found</p>
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
          className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto cursor-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <TaskHeader task={task} onClose={onClose} onUpdateTask={updateTask} />

          <TaskContent
            task={task}
            currentUser={currentUser}
            availableUsers={availableUsers}
            priorities={priorities}
            onUpdateTask={updateTask}
            onRefreshTask={fetchTaskData}
            taskId={taskId}
          />

          <CommentsSection
            taskId={taskId}
            comments={comments}
            currentUser={currentUser}
            task={task}
            onRefreshComments={fetchComments}
            onRefreshTask={fetchTaskData}
            onImagePreview={setImagePreview}
          />

          <TaskFooter task={task} currentUser={currentUser} />
        </motion.div>
      </motion.div>

      <ImagePreviewModal
        imageUrl={imagePreview}
        onClose={() => setImagePreview(null)}
      />
    </AnimatePresence>
  );
};

export default SingleTaskView;
