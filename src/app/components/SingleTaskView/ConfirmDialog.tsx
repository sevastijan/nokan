"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";
import { ConfirmDialogProps } from "./types";

/**
 * Modal dialog used to confirm user actions.
 * Can be styled based on severity (info/warning/danger).
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "warning",
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  // Returns color classes based on dialog type
  const getColors = () => {
    switch (type) {
      case "danger":
        return {
          icon: "text-red-400",
          button: "bg-red-600 hover:bg-red-700",
        };
      case "warning":
        return {
          icon: "text-yellow-400",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      default:
        return {
          icon: "text-blue-400",
          button: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-[70]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 shadow-xl border border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaExclamationTriangle className={`w-6 h-6 ${colors.icon}`} />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 border border-gray-500 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmDialog;
