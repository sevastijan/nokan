"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaDownload, FaTrash, FaEye } from "react-icons/fa";
import { Attachment, User } from "./types";
import { formatFileSize, getFileIcon } from "./utils";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";

interface AttachmentsListProps {
  attachments: Attachment[];
  currentUser: User;
  taskId: string;
  onRefreshTask: () => Promise<void>;
}

const AttachmentsList = ({
  attachments,
  currentUser,
  taskId,
  onRefreshTask,
}: AttachmentsListProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Add attachment record to database
      const { error: dbError } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: currentUser.id,
        });

      if (dbError) throw dbError;

      await onRefreshTask();
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("attachments")
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file");
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      await onRefreshTask();
      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Error deleting attachment");
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    if (attachment.mime_type.startsWith("image/")) {
      try {
        const { data, error } = await supabase.storage
          .from("attachments")
          .createSignedUrl(attachment.file_path, 60 * 60);

        if (error) throw error;

        window.open(data.signedUrl, "_blank");
      } catch (error) {
        console.error("Error creating preview:", error);
        toast.error("Error creating preview");
      }
    } else {
      handleDownload(attachment);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">
          Attachments ({attachments.length})
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center cursor-pointer gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          {uploading ? "Uploading..." : "Add File"}
        </motion.button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />

      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">
                  {getFileIcon(attachment.mime_type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePreview(attachment)}
                  className="p-2 text-blue-400 hover:text-blue-300 rounded cursor-pointer"
                >
                  <FaEye className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDownload(attachment)}
                  className="p-2 text-green-400 hover:text-green-300 rounded cursor-pointer"
                >
                  <FaDownload className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(attachment)}
                  className="p-2 text-red-400 hover:text-red-300 rounded cursor-pointer"
                >
                  <FaTrash className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-6 border-2 border-dashed border-gray-600 rounded-lg">
          <p>No attachments yet</p>
          <p className="text-sm">
            Click "Add File" to upload your first attachment
          </p>
        </div>
      )}
    </div>
  );
};

export default AttachmentsList;
