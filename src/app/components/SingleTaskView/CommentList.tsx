import { motion } from "framer-motion";
import { FaTrash } from "react-icons/fa";
import { CommentListProps } from "@/app/types/globalTypes";
import { formatDate } from "@/app/utils/helpers";
import MarkdownContent from "./MarkdownContent";
import Avatar from "../Avatar/Avatar";

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
          <Avatar
            src={comment.author?.image || undefined}
            alt={comment.author?.name || "Unknown"}
            size={20}
          />
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="font-medium text-gray-200 text-xs">
                {comment.author?.name || "Unknown"}
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
          {(comment.user_id === currentUser?.id ||
            task.user_id === currentUser?.id) && (
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
