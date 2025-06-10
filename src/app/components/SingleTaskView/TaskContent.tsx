"use client";

import React, { useState, useEffect } from "react";
import { TaskContentProps } from "./types";
import UserSelector from "./UserSelector";
import PrioritySelector from "./PrioritySelector";
import AttachmentsList from "./AttachmentsList";
import { Task } from "../../types/useBoardTypes";

const TaskContent = ({
  task,
  currentUser,
  availableUsers,
  priorities,
  onUpdateTask,
  taskId,
  setHasUnsavedChanges,
  isNewTask,
  onTaskUpdate,
  onAttachmentsUpdate,
  teamMembers,
  onAssigneeChange,
  selectedAssigneeId,
}: TaskContentProps) => {
  const [editedDescription, setEditedDescription] = useState(
    task?.description || ""
  );

  if (!task) {
    // Show loading skeleton while task data is not loaded
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log("=== DEBUG TaskContent Props Changed ===");
    console.log("onAssigneeChange prop received:", !!onAssigneeChange);
    console.log("selectedAssigneeId prop received:", selectedAssigneeId);
    console.log(
      "teamMembers prop received:",
      teamMembers?.length || 0,
      "members"
    );
  }, [onAssigneeChange, selectedAssigneeId, teamMembers]);

  // Update local description state and mark form as dirty
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setEditedDescription(e.target.value);
    setHasUnsavedChanges(true);
  };

  // Save the description if changed after textarea loses focus
  const handleDescriptionSave = async () => {
    if (editedDescription !== (task?.description || "")) {
      onUpdateTask({ description: editedDescription });
    }
  };

  // Update the assigned user for the task and mark as dirty
  // Update the assigned user for the task and mark as dirty
  const updateAssignee = (userId: string | null) => {
    console.log("=== DEBUG TaskContent updateAssignee ===");
    console.log("Selected user ID in updateAssignee:", userId);
    console.log("onAssigneeChange function exists:", !!onAssigneeChange);

    setHasUnsavedChanges(true);
    onUpdateTask({ user_id: userId });

    // CRITICAL: Make sure this line is present and being called
    if (onAssigneeChange) {
      console.log("Calling onAssigneeChange with:", userId);
      onAssigneeChange(userId);
    } else {
      console.log("onAssigneeChange is not available!");
    }
  };

  // Update the priority of the task and mark as dirty
  const updatePriority = (priorityId: string | null) => {
    setHasUnsavedChanges(true);
    onUpdateTask({ priority: priorityId });
  };

  // Find the currently assigned user object from the available users list
  const assignedUser = task.user_id
    ? availableUsers.find((user) => user.id === task.user_id) || null
    : null;

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
          selectedAssigneeId
            ? teamMembers?.find((user) => user.id === selectedAssigneeId) ||
              task.assignee
            : task.assignee
        }
        availableUsers={teamMembers || []}
        onUserSelect={(userId) => {
          // Fix: Use user_id instead of assignee_id to match your database schema
          onUpdateTask({ user_id: userId });
          onAssigneeChange?.(userId);
        }}
        label="Assignee"
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
        onTaskUpdate={onTaskUpdate}
        onAttachmentsUpdate={onAttachmentsUpdate}
      />
    </div>
  );
};

export default TaskContent;
