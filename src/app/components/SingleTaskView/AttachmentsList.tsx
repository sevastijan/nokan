"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaDownload, FaTrash, FaEye } from "react-icons/fa";
import { Attachment, User, AttachmentsListProps } from "./types";
import { formatFileSize, getFileIcon } from "./utils";
import { supabase } from "../../lib/api";
import { toast } from "react-toastify";
import Button from "../Button/Button";

/**
 * AttachmentsList component provides functionality to upload, preview, download, and delete
 * attachments related to a specific task. It uses Supabase for file storage and metadata management.
 */
const AttachmentsList = ({
  attachments,
  currentUser,
  taskId,
  onTaskUpdate,
  onAttachmentsUpdate,
}: AttachmentsListProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles uploading a file to Supabase storage and saving metadata in the database.
   */
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

      const { data: newAttachment, error: dbError } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: currentUser.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (onAttachmentsUpdate && newAttachment) {
        onAttachmentsUpdate((prev) => [newAttachment, ...prev]);
      } else if (onTaskUpdate) {
        await onTaskUpdate();
      }

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

  /**
   * Handles downloading an attachment from Supabase storage.
   */
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

  /**
   * Handles deleting an attachment from both storage and database.
   */
  const handleDelete = async (attachment: Attachment) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      if (onAttachmentsUpdate) {
        onAttachmentsUpdate((prev) =>
          prev.filter((att) => att.id !== attachment.id)
        );
      } else if (onTaskUpdate) {
        await onTaskUpdate();
      }

      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Error deleting attachment");
    }
  };

  /**
   * Previews image attachments in a new tab, or downloads non-image files.
   */
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
        <Button
          variant="primary"
          size="md"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          loading={uploading}
          icon={<FaPlus />}
        >
          {uploading ? "Uploading..." : "Add File"}
        </Button>
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
                <span className="text-2xl flex items-center justify-center w-8 h-8">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(attachment)}
                  icon={<FaEye />}
                  className="text-blue-400 hover:text-blue-300 p-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  icon={<FaDownload />}
                  className="text-green-400 hover:text-green-300 p-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment)}
                  icon={<FaTrash />}
                  className="text-red-400 hover:text-red-300 p-2"
                />
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
