import { CommentsSectionProps } from "@/app/types/globalTypes";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import { formatDate } from "@/app/utils/helpers";
import Avatar from "../Avatar/Avatar";
import { notifyTaskStakeholders } from "@/app/lib/email/triggerNotification";

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
  onImagePreview,
}: CommentsSectionProps) => {
  /**
   * Adds a new comment to Supabase and refreshes the comment list.
   * @param {string} content - The content of the comment to be added.
   */
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

      // Send email notifications to assignee and creator
      if (task?.board_id) {
        const commentPreview = content.length > 100 ? content.substring(0, 100) + "..." : content;
        notifyTaskStakeholders(
          {
            type: "new_comment",
            taskId,
            taskTitle: task.title || "Task",
            boardId: task.board_id,
            metadata: { commenterName: currentUser.name, commentPreview },
          },
          { assigneeId: task.user_id, creatorId: task.created_by, currentUserId: currentUser.id }
        );
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Error adding comment");
    }
  };

  /**
   * Deletes a comment from Supabase and refreshes the comment list.
   * @param {string} commentId - The ID of the comment to be deleted.
   */
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
    <div className="border-t border-gray-600 p-4">
      {currentUser && (
        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={currentUser.image || undefined}
            alt={currentUser.name}
            size={24}
          />
          {task?.created_at && (
            <span className="text-xs text-gray-400">
              {currentUser.name} created this task on{" "}
              {formatDate(task.created_at)}
            </span>
          )}
        </div>
      )}
      <CommentForm
        currentUser={currentUser}
        taskId={taskId}
        onAddComment={addComment}
      />
      {task && (
        <CommentList
          comments={comments}
          currentUser={currentUser}
          task={task}
          onDeleteComment={deleteComment}
          onImagePreview={onImagePreview}
        />
      )}
    </div>
  );
};

export default CommentsSection;
