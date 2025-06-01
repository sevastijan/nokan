"use client";

import { useState } from "react";
import { addPriority } from "../lib/api";

interface AddPriorityModalProps {
  onClose: () => void;
  onAddPriority: (priority: {
    id: string;
    label: string;
    color: string;
  }) => void;
}

const AddPriorityModal = ({
  onClose,
  onAddPriority,
}: AddPriorityModalProps) => {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#000000");

  const handleSave = async () => {
    if (!label.trim()) return;

    try {
      const newPriority = await addPriority(label, color);
      onAddPriority(newPriority);
      onClose();
    } catch (error) {
      console.error("Error adding priority:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Add New Priority</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium mb-2">Label:</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              placeholder="Priority Name"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 border border-gray-600 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPriorityModal;
