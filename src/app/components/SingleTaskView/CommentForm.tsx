import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane, FaPaperclip } from "react-icons/fa";
import { User, Attachment } from "./types";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";
import { getUserAvatar } from "./utils";

interface CommentFormProps {
  currentUser: User;
  taskId: string;
  onAddComment: (content: string) => Promise<void>;
  onRefreshTask: () => Promise<void>;
}

const CommentForm = ({
  currentUser,
  taskId,
  onAddComment,
  onRefreshTask,
}: CommentFormProps) => {
  const [newComment, setNewComment] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await onAddComment(newComment);
    setNewComment("");
  };

  const handlePaste = async (
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

          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("attachments")
              .createSignedUrl(filePath, 60 * 60 * 24 * 365);

          if (signedUrlError) throw signedUrlError;

          const textarea = event.target as HTMLTextAreaElement;
          const cursorPosition = textarea.selectionStart;
          const textBefore = newComment.substring(0, cursorPosition);
          const textAfter = newComment.substring(cursorPosition);

          const imageMarkdown = `![${fileName}](${signedUrlData.signedUrl})`;
          setNewComment(textBefore + imageMarkdown + textAfter);

          await onRefreshTask();
          toast.success("Image uploaded successfully");
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("Error uploading image");
        } finally {
          setUploading(false);
        }
      }
    }
  };

  return (
    <div className="border border-gray-600 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <img
          src={getUserAvatar(currentUser)}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onPaste={handlePaste}
              placeholder="Add a comment..."
              className="w-full min-h-[80px] p-3 border border-gray-600 rounded-lg resize-vertical bg-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            />
            {uploading && (
              <div className="text-sm text-blue-400">Uploading image...</div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                Tip: Paste images directly into the comment
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-400 hover:text-gray-200 rounded cursor-pointer"
                >
                  <FaPaperclip className="w-4 h-4" />
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!newComment.trim() || uploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaPaperPlane className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentForm;
