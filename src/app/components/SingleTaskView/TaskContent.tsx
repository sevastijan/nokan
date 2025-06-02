"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TaskDetail, User, Priority, Attachment } from "./types";
import UserSelector from "./UserSelector";
import PrioritySelector from "./PrioritySelector";
import AttachmentsList from "./AttachmentsList";

interface TaskContentProps {
  task: TaskDetail;
  currentUser: User;
  availableUsers: User[];
  priorities: Priority[];
  onUpdateTask: (updates: Partial<TaskDetail>) => Promise<void>;
  onRefreshTask: () => Promise<void>;
  taskId: string;
}

const TaskContent = ({
  task,
  currentUser,
  availableUsers,
  priorities,
  onUpdateTask,
  onRefreshTask,
  taskId,
}: TaskContentProps) => {
  const [editedDescription, setEditedDescription] = useState(
    task.description || ""
  );

  const handleDescriptionSave = async () => {
    if (editedDescription !== (task?.description || "")) {
      await onUpdateTask({ description: editedDescription });
    }
  };

  const updateAssignee = async (userId: string) => {
    await onUpdateTask({ assignee_id: userId });
  };

  const updatePriority = async (priorityId: string) => {
    await onUpdateTask({ priority: priorityId });
  };

  return (
    <div className="p-6 space-y-6">
      <UserSelector
        selectedUser={task.assignee || null}
        availableUsers={availableUsers}
        onUserSelect={updateAssignee}
        label="Assigned to"
      />

      <PrioritySelector
        selectedPriority={task.priority_info || null}
        availablePriorities={priorities}
        onPrioritySelect={updatePriority}
        label="Priority"
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          onBlur={handleDescriptionSave}
          placeholder="Add details to this task..."
          className="w-full min-h-[100px] p-3 border border-gray-600 rounded-lg resize-vertical bg-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <AttachmentsList
        attachments={task.attachments || []}
        currentUser={currentUser}
        taskId={taskId}
        onRefreshTask={onRefreshTask}
      />
    </div>
  );
};

export default TaskContent;
