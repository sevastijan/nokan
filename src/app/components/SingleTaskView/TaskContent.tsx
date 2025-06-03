"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TaskDetail, User, Priority, Attachment } from "./types";
import UserSelector from "./UserSelector";
import PrioritySelector from "./PrioritySelector";
import AttachmentsList from "./AttachmentsList";

interface TaskContentProps {
  task: TaskDetail | null;
  currentUser: User;
  availableUsers: User[];
  priorities: Priority[];
  onUpdateTask: (updates: Partial<TaskDetail>) => void;
  onRefreshTask: () => Promise<void>;
  taskId: string;
  setHasUnsavedChanges: (value: boolean) => void;
  isNewTask?: boolean;
}

const TaskContent = ({
  task,
  currentUser,
  availableUsers,
  priorities,
  onUpdateTask,
  onRefreshTask,
  taskId,
  setHasUnsavedChanges,
  isNewTask,
}: TaskContentProps) => {
  const [editedDescription, setEditedDescription] = useState(
    task?.description || ""
  );

  if (!task) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setEditedDescription(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleDescriptionSave = async () => {
    if (editedDescription !== (task?.description || "")) {
      onUpdateTask({ description: editedDescription });
    }
  };

  const updateAssignee = (userId: string | null) => {
    console.log("updateAssignee called with userId:", userId); // Debug log
    setHasUnsavedChanges(true);
    onUpdateTask({ user_id: userId });
  };

  const updatePriority = (priorityId: string | null) => {
    setHasUnsavedChanges(true);
    onUpdateTask({ priority: priorityId });
  };

  // Find the assigned user based on user_id
  const assignedUser = task.user_id
    ? availableUsers.find((user) => user.id === task.user_id) || null
    : null;

  return (
    <div className="p-6 space-y-6">
      {isNewTask && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={task?.title || ""}
            onChange={(e) => {
              setHasUnsavedChanges(true);
              onUpdateTask({ title: e.target.value });
            }}
            placeholder="Enter task title..."
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}

      <UserSelector
        selectedUser={assignedUser} // Changed from task.assignee to assignedUser
        availableUsers={availableUsers}
        onUserSelect={updateAssignee}
        label="Assigned to"
      />

      <PrioritySelector
        selectedPriority={task.priority || null}
        onChange={updatePriority}
        priorities={priorities}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={editedDescription}
          onChange={handleDescriptionChange}
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
