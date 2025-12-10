import { useState, useEffect } from "react";
import { getSupabase } from "../../../lib/api";
import { Comment } from "../types";

interface UseTaskCommentsResult {
  comments: Comment[];
  fetchComments: () => Promise<void>;
}

export const useTaskComments = (taskId?: string): UseTaskCommentsResult => {
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchComments = async () => {
    if (!taskId) return;

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          if (comment.user_id) {
            const { data: authorData } = await supabase
              .from("users")
              .select("id, name, email, image")
              .eq("id", comment.user_id)
              .single();

            return {
              ...comment,
              author: authorData || null,
            };
          }
          return {
            ...comment,
            author: null,
          };
        })
      );

      setComments(commentsWithAuthors);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  return { comments, fetchComments };
};