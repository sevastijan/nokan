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
      <div className="text-center text-gray-400 py-8">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">
        Comments ({comments.length})
      </h3>

      {comments.map((comment) => (
        <motion.div
          key={comment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg"
        >
          <img
            src={getUserAvatar(comment.author)}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-200">
                {comment.author.name}
              </span>
              <span className="text-sm text-gray-400">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <div className="text-gray-300">
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
              className="p-2 text-gray-400 hover:text-red-400 rounded cursor-pointer"
            >
              <FaTrash className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default CommentList;
