import React from "react";
import { motion } from "framer-motion";
import { FaTrash } from "react-icons/fa";
import { Comment, User, TaskDetail } from "./types";
import { getUserAvatar, formatDate } from "./utils";
import MarkdownContent from "./MarkdownContent";

interface CommentListProps {
  /** Array of comments related to the task */
  comments: Comment[];

  /** Currently logged-in user */
  currentUser: User;

  /** Details of the task the comments belong to */
  task: TaskDetail;

  /** Callback for deleting a specific comment */
  onDeleteComment: (commentId: string) => Promise<void>;

  /** Callback to handle image preview click from markdown */
  onImagePreview: (url: string) => void;
}

/**
 * Renders a list of comments with user avatars, markdown content,
 * and the ability to delete a comment (if user is author or task owner).
 */
const CommentList = ({
  comments,
  currentUser,
  task,
  onDeleteComment,
  onImagePreview,
}: CommentListProps) => {
  // Show placeholder when there are no comments
  if (comments.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        <p className="text-sm">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <motion.div
          key={comment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-2 bg-gray-700/50 rounded-md"
        >
          <img
            src={getUserAvatar(comment.author)}
            alt={comment.author.name}
            className="w-5 h-5 rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="font-medium text-gray-200 text-xs">
                {comment.author.name}
              </span>
              <span className="text-gray-400 text-[0.6rem]">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <div className="text-gray-300 text-sm">
              <MarkdownContent
                content={comment.content}
                onImageClick={onImagePreview}
              />
            </div>
          </div>
          {(comment.user_id === currentUser.id ||
            task.user_id === currentUser.id) && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDeleteComment(comment.id)}
              className="p-0.5 text-gray-400 hover:text-red-400 rounded cursor-pointer"
            >
              <FaTrash className="w-2.5 h-2.5" />
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default CommentList;
