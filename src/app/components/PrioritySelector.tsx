"use client";

import { useState, useEffect } from "react";
import AddPriorityModal from "./AddPriorityModal";
import { getPriorities } from "../lib/api";

interface Priority {
  id: string;
  label: string;
  color: string;
}

interface PrioritySelectorProps {
  selectedPriority: string;
  onChange: (priority: string) => void;
}

const PrioritySelector = ({
  selectedPriority,
  onChange,
}: PrioritySelectorProps) => {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const data = await getPriorities();
        setPriorities(data);
      } catch (error) {
        console.error("Error fetching priorities:", error);
      }
    };
    fetchPriorities();
  }, []);

  const handleAddPriority = (newPriority: Priority) => {
    setPriorities([...priorities, newPriority]);
  };

  return (
    <div>
      <label className="block text-lg font-medium mb-2">Priority:</label>
      <select
        value={selectedPriority}
        onChange={(e) => {
          if (e.target.value === "add") {
            setIsModalOpen(true);
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-blue-500"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        {priorities.map((priority) => (
          <option key={priority.id} value={priority.label}>
            {priority.label}
          </option>
        ))}
        <option value="add">+ Add Priority</option>
      </select>

      {isModalOpen && (
        <AddPriorityModal
          onClose={() => setIsModalOpen(false)}
          onAddPriority={handleAddPriority}
        />
      )}
    </div>
  );
};

export default PrioritySelector;
