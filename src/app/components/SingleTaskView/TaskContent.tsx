"use client";

import React, { useState } from "react";
import { TaskContentProps } from "@/app/types/globalTypes";
import UserSelector from "./UserSelector";
import PrioritySelector from "./PrioritySelector";
import AttachmentsList from "./AttachmentsList";

const TaskContent = ({
  task,
  currentUser,
  teamMembers,
  onUpdateTask,
  setHasUnsavedChanges,
  isNewTask,
  onAttachmentsUpdate,
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
    onUpdateTask({ description: e.target.value }); // Save immediately to align with updateTask behavior
  };

  const updateAssignee = (userId: string | null) => {
    setHasUnsavedChanges(true);
    onUpdateTask({ user_id: userId }); // Use user_id instead of assignee_id
  };

  const updatePriority = (priorityId: string | null) => {
    setHasUnsavedChanges(true);
    onUpdateTask({ priority: priorityId });
  };

  const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];

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
        selectedUser={
          task.user_id
            ? teamMembers.find((user) => user.id === task.user_id)
            : null
        }
        availableUsers={safeTeamMembers}
        onUserSelect={updateAssignee}
        label="Assignee"
      />
      <PrioritySelector
        selectedPriority={task.priority || null}
        onChange={updatePriority}
        priorities={[]}
      />
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={editedDescription}
          onChange={handleDescriptionChange}
          placeholder="Add details to this task..."
          className="w-full min-h-[100px] p-3 border border-gray-600 rounded-lg resize-vertical bg-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <AttachmentsList
        attachments={task.attachments || []}
        currentUser={currentUser}
        taskId={task.id}
        onTaskUpdate={onUpdateTask}
        onAttachmentsUpdate={onAttachmentsUpdate}
      />
    </div>
  );
};

export default TaskContent;
