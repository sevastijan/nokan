import React, { useState } from "react";
import { motion } from "framer-motion";
import { Comment, User, TaskDetail } from "./types";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import { getUserAvatar, formatDate } from "./utils";

interface CommentsSectionProps {
  /** ID of the task for which comments are displayed */
  taskId: string;

  /** Array of comments related to the task */
  comments: Comment[];

  /** Currently logged-in user */
  currentUser: User;

  /** Details of the task */
  task: TaskDetail;

  /** Function to refresh the comment list after update */
  onRefreshComments: () => Promise<void>;

  /** Function to refresh task data after comment (e.g. attachments) */
  onRefreshTask: () => Promise<void>;

  /** Function to preview image (when clicked in markdown) */
  onImagePreview: (url: string) => void;
}

/**
 * Wrapper component that manages comment form, comment list,
 * and handles creating & deleting comments.
 */
const CommentsSection = ({
  taskId,
  comments,
  currentUser,
  task,
  onRefreshComments,
  onRefreshTask,
  onImagePreview,
}: CommentsSectionProps) => {
  // Add new comment to Supabase and refresh the list
  const addComment = async (content: string) => {
    if (!content.trim()) return;

    try {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          content: content.trim(),
        })
        .select();

      if (error) throw error;

      await onRefreshComments();
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Error adding comment");
    }
  };

  // Delete comment from Supabase and refresh the list
  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("task_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      await onRefreshComments();
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Error deleting comment");
    }
  };

  return (
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
            {formatDate(task.updated_at)}
          </span>
        </div>
      </div>
      <CommentForm
        currentUser={currentUser}
        taskId={taskId}
        onAddComment={addComment}
        onRefreshTask={onRefreshTask}
      />
      <CommentList
        comments={comments}
        currentUser={currentUser}
        task={task}
        onDeleteComment={deleteComment}
        onImagePreview={onImagePreview}
      />
    </div>
  );
};

export default CommentsSection;
