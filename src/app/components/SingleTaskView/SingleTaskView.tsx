"use client";

import {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { FaTimes, FaClock, FaLink, FaCalendarAlt } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useTaskManagement } from "./hooks/useTaskManagement";

import UserSelector from "./UserSelector";
import PrioritySelector from "./PrioritySelector";
import CommentsSection from "./CommentsSection";
import AttachmentsList from "./AttachmentsList";
import ImagePreviewModal from "./ImagePreviewModal";
import ConfirmDialog from "./ConfirmDialog";
import Button from "../Button/Button";
import Avatar from "../Avatar/Avatar";
import ColumnSelector from "@/app/components/ColumnSelector"; // already imported

import {
  formatDate,
  getAvatarUrl,
  formatFileSize,
  getFileIcon,
  copyTaskUrlToClipboard,
  calculateDuration,
} from "@/app/utils/helpers";

import { SingleTaskViewProps } from "@/app/types/globalTypes";
import { useOutsideClick } from "@/app/hooks/useOutsideClick";
import ActionFooter from "./ActionFooter";
import "./styles/styles.css";

interface LocalFilePreview {
  id: string;
  file: File;
  previewUrl: string;
}

/**
 * SingleTaskView component renders a modal for viewing, creating, or editing a task.
 * Now includes column selection for add/edit.
 */
const SingleTaskView = ({
  taskId,
  mode,
  columnId,
  boardId,
  onClose,
  onTaskUpdate,
  onTaskAdded,
  currentUser: propCurrentUser,
  initialStartDate,
  columns, // now we receive columns list
}: SingleTaskViewProps & { columns: { id: string; title: string }[] }) => {
  const { data: session } = useSession();
  const { currentUser, loading: userLoading } = useCurrentUser();

  const {
    task,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    isNewTask,
    updateTask,
    saveNewTask,
    saveExistingTask,
    deleteTask,
    fetchTaskData,
    uploadAttachment,
    teamMembers,
  } = useTaskManagement({
    taskId,
    mode,
    columnId, // initial columnId
    boardId: boardId!,
    currentUser: propCurrentUser || currentUser || undefined,
    initialStartDate,
    onTaskUpdate,
    onTaskAdded,
    onClose,
  });

  // Refs for outside click
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Local UI state
  const [localFilePreviews, setLocalFilePreviews] = useState<
    LocalFilePreview[]
  >([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  // tempTitle etc.
  const [tempTitle, setTempTitle] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(
    null
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Local state for column selection in UI (to reflect immediate choice before saving)
  const [localColumnId, setLocalColumnId] = useState<string | undefined>(
    columnId
  );

  // Apply initialStartDate once
  const appliedInitialDate = useRef(false);

  useEffect(() => {
    if (task) {
      setTempTitle(task.title || "");
      setTempDescription(task.description || "");
      setSelectedAssigneeId(task.assignee?.id || task.user_id || null);
      // Initialize localColumnId from task data when editing
      if (!isNewTask) {
        setLocalColumnId(task.column_id || undefined);
        setStartDate(task.start_date || "");
        setEndDate(task.end_date || "");
      }
    }
  }, [task, isNewTask]);

  // When columnId prop changes (e.g. in add mode), update localColumnId
  useEffect(() => {
    if (isNewTask && columnId) {
      setLocalColumnId(columnId);
      updateTask({ column_id: columnId });
    }
  }, [isNewTask, columnId, updateTask]);

  useEffect(() => {
    if (isNewTask && initialStartDate && !appliedInitialDate.current) {
      setStartDate(initialStartDate);
      updateTask({ start_date: initialStartDate });
      appliedInitialDate.current = true;
    }
  }, [isNewTask, initialStartDate, updateTask]);

  // Escape key to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Trigger the footer’s cancel logic via a callback
        handleCloseRequest();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hasUnsavedChanges, saving, tempTitle]);

  // Click outside to close
  // @ts-expect-error
  useOutsideClick([modalRef], () => {
    handleCloseRequest();
  });

  /**
   * Centralized close request: this just calls onClose();
   * actual confirm-if-unsaved is handled by ActionFooter.
   */
  const handleCloseRequest = () => {
    onClose();
  };

  // Title change
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTempTitle(newTitle);
    updateTask({ title: newTitle });
  };
  const handleTitleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tempTitle.trim()) {
      (e.target as HTMLInputElement).blur();
    }
  };

  // Description
  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const desc = e.target.value;
    setTempDescription(desc);
    updateTask({ description: desc });
  };

  // Assignee
  const handleAssigneeChange = async (assigneeId: string | null) => {
    setSelectedAssigneeId(assigneeId);
    if (!assigneeId) {
      await updateTask({ user_id: null, assignee: null });
      return;
    }
    const sel = teamMembers.find((u) => u.id === assigneeId);
    if (!sel) {
      await updateTask({ user_id: null, assignee: null });
      return;
    }
    await updateTask({ user_id: assigneeId, assignee: sel });
  };

  // Column selection
  const handleColumnChange = async (newColId: string) => {
    setLocalColumnId(newColId);
    // update local state and hook state
    await updateTask({ column_id: newColId });
  };

  // Date fields
  const handleDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setStartDate(value);
      updateTask({ start_date: value });
      if (endDate && value && endDate < value) {
        setEndDate("");
        updateTask({ end_date: null });
      }
    } else {
      setEndDate(value);
      updateTask({ end_date: value });
    }
  };

  // File previews
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr: LocalFilePreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let previewUrl = "";
      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file);
      }
      const id = crypto.randomUUID();
      arr.push({ id, file, previewUrl });
    }
    setLocalFilePreviews((prev) => [...prev, ...arr]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeLocalFile = (id: string) => {
    setLocalFilePreviews((prev) => {
      const removed = prev.find((lp) => lp.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((lp) => lp.id !== id);
    });
  };

  // Upload attachment
  const handleUploadAttachment = async (file: File) => {
    if (!task?.id) {
      console.warn("Cannot upload until task has ID");
      return null;
    }
    if (!currentUser?.id) {
      toast.error("No user to upload");
      return null;
    }
    try {
      const result = await uploadAttachment(file);
      if (result) {
        toast.success(`Uploaded ${file.name}`);
      } else {
        toast.error(`Failed to upload ${file.name}`);
      }
      return result;
    } catch (err) {
      console.error("Attachment upload error:", err);
      toast.error(`Upload error: ${file.name}`);
      return null;
    }
  };

  // Save logic
  const handleSave = async () => {
    if (!tempTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    // Ensure column is selected for new task
    if (isNewTask && !localColumnId) {
      toast.error("Column is required");
      return;
    }
    if (isNewTask) {
      const success = await saveNewTask();
      if (success) {
        toast.success("Task created");
        if (localFilePreviews.length > 0 && task?.id) {
          for (const local of localFilePreviews) {
            await handleUploadAttachment(local.file);
            if (local.previewUrl) URL.revokeObjectURL(local.previewUrl);
          }
          setLocalFilePreviews([]);
          await fetchTaskData();
        }
        // Close modal after creation
        onClose();
      }
    } else {
      const success = await saveExistingTask();
      if (success) {
        toast.success("Task saved");
        onClose();
      }
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    if (task?.id) {
      await copyTaskUrlToClipboard(task.id);
    }
  };

  // Delete logic: triggered from ActionFooter
  const handleDelete = async () => {
    try {
      await deleteTask();
      onClose();
    } catch (err) {
      console.error("deleteTask error:", err);
      toast.error("Failed to delete task");
    }
  };

  // Loading / error handling
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-white">
          Loading task...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }
  if (userLoading || !currentUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-white">
          Loading user...
        </div>
      </div>
    );
  }
  if (!isNewTask && !loading && !task) {
    // no task found after loading
    return null;
  }

  return (
    <AnimatePresence
      initial={false}
      onExitComplete={() => {
        /* nothing extra */
      }}
    >
      {/** Overlay */}
      <motion.div
        key="modal"
        ref={overlayRef}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        onClick={(e) => {
          if (e.target === overlayRef.current) {
            handleCloseRequest();
          }
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2 } }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
      >
        <motion.div
          ref={modalRef}
          className="
            bg-slate-800 rounded-xl w-full max-w-lg md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-hidden
            flex flex-col shadow-xl border border-slate-600
          "
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 0.2 } }}
          exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
        >
          {/* HEADER */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-slate-600">
            <div className="flex items-center gap-3 min-w-0">
              {isNewTask ? (
                <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  New
                </span>
              ) : task?.id ? (
                <span className="bg-slate-700 text-slate-300 text-xs font-mono px-2 py-1 rounded">
                  #{task.id.slice(-6)}
                </span>
              ) : null}
              <input
                type="text"
                className="bg-transparent text-lg font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 truncate min-w-0"
                placeholder="Task title (required)"
                value={tempTitle}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                autoFocus={isNewTask}
              />
            </div>
            <div className="flex items-center gap-2">
              {!isNewTask && task?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FaLink />}
                  onClick={handleCopyLink}
                  className="text-slate-300 hover:text-white"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<FaTimes />}
                onClick={handleCloseRequest}
                className="text-slate-300 hover:text-white"
              />
            </div>
          </div>

          {/* BODY */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* FORM */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
              {/* MOBILE COLUMN SELECT */}
              <div className="block md:hidden mb-4">
                <ColumnSelector
                  columns={columns}
                  value={localColumnId}
                  onChange={handleColumnChange}
                  label="Column"
                />
              </div>

              {/* ASSIGNEE & PRIORITY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UserSelector
                  selectedUser={
                    teamMembers.find((u) => u.id === selectedAssigneeId) || null
                  }
                  availableUsers={teamMembers}
                  onUserSelect={handleAssigneeChange}
                  label="Assignee"
                />
                <PrioritySelector
                  selectedPriority={task?.priority || null}
                  onChange={(newId) => updateTask({ priority: newId })}
                />
              </div>

              {/* DESKTOP COLUMN SELECT */}
              <div className="hidden md:block mt-4">
                <label className="text-sm text-slate-300 uppercase mb-1 block">
                  Column
                </label>
                <ColumnSelector
                  columns={columns}
                  value={localColumnId}
                  onChange={handleColumnChange}
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="text-sm text-slate-300">Description</label>
                <textarea
                  className="
                    mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400
                    resize-none focus:outline-none focus:ring-2 focus:ring-purple-500
                  "
                  value={tempDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Describe the task..."
                  rows={4}
                />
              </div>

              {/* DATE FIELDS */}
              <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                <div className="flex-1 modal-date-field">
                  <label className="text-sm flex items-center gap-1 text-slate-300">
                    <FaClock className="w-4 h-4" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={startDate}
                    onChange={(e) => handleDateChange("start", e.target.value)}
                  />
                </div>
                <div className="flex-1 modal-date-field">
                  <label className="text-sm flex items-center gap-1 text-slate-300">
                    <FaClock className="w-4 h-4" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                  />
                </div>
              </div>
              {(() => {
                const dur = calculateDuration(startDate, endDate);
                if (dur === null) return null;
                return (
                  <div className="mt-2 p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 flex items-center gap-2">
                    <FaCalendarAlt className="text-white w-4 h-4" />
                    <span className="font-medium">
                      Duration: {dur} {dur === 1 ? "day" : "days"}
                    </span>
                  </div>
                );
              })()}

              {/* ATTACHMENTS */}
              <div className="mt-4">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFilesSelected}
                />
                {isNewTask && localFilePreviews.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {localFilePreviews.map((lp) => (
                      <li
                        key={lp.id}
                        className="flex items-center justify-between bg-slate-700 p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span>{getFileIcon(lp.file.type)}</span>
                          <span className="text-sm text-white">
                            {lp.file.name} ({formatFileSize(lp.file.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-red-400 hover:text-red-300 text-sm"
                          onClick={() => removeLocalFile(lp.id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!isNewTask && task?.attachments && (
                  <div className="mt-4">
                    <AttachmentsList
                      attachments={task.attachments}
                      currentUser={currentUser}
                      taskId={task.id!}
                      onTaskUpdate={async () => {
                        await fetchTaskData();
                      }}
                      onAttachmentsUpdate={async () => {
                        await fetchTaskData();
                      }}
                    />
                  </div>
                )}
              </div>

              {/* COMMENTS */}
              {!isNewTask && task?.id && (
                <div className="mt-6">
                  <CommentsSection
                    taskId={task.id}
                    comments={task.comments || []}
                    currentUser={currentUser}
                    task={task}
                    onRefreshComments={async () => {
                      await fetchTaskData();
                    }}
                    onImagePreview={(url: string) =>
                      updateTask({ imagePreview: url })
                    }
                  />
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="w-full md:w-72 bg-slate-800/70 border-t md:border-t-0 md:border-l border-slate-600 overflow-y-auto p-4 sm:p-6 text-white flex-shrink-0 hidden md:block">
              <div className="mb-6">
                <h3 className="text-sm text-slate-300 uppercase mb-2">
                  Assignee
                </h3>
                {task?.assignee ? (
                  <div className="flex items-center bg-slate-700 p-3 rounded-lg">
                    <Avatar
                      src={getAvatarUrl(task.assignee) || ""}
                      alt={task.assignee.name}
                      size={32}
                      className="mr-3 border-2 border-white/20"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-medium truncate">
                        {task.assignee.name}
                      </span>
                      <span className="text-slate-400 text-sm truncate">
                        {task.assignee.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400">No assignee</div>
                )}
              </div>
              <div className="mb-6">
                <h3 className="text-sm text-slate-300 uppercase mb-2">
                  Created
                </h3>
                <div
                  className={task?.created_at ? "text-white" : "text-slate-400"}
                >
                  {task?.created_at ? formatDate(task.created_at) : "-"}
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-sm text-slate-300 uppercase mb-2">
                  Last Updated
                </h3>
                <div
                  className={task?.updated_at ? "text-white" : "text-slate-400"}
                >
                  {task?.updated_at ? formatDate(task.updated_at) : "-"}
                </div>
              </div>
              {/* Show column info */}
              <div className="mb-6">
                <h3 className="text-sm text-slate-300 uppercase mb-2">
                  Column
                </h3>
                <div className="text-sm text-white truncate">
                  {columns.find((c) => c.id === localColumnId)?.title || "—"}
                </div>
              </div>
              {task?.start_date && task?.end_date && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-300 mt-4 mb-2">
                    Duration
                  </h4>
                  <p className="text-sm">
                    {(() => {
                      const dur = calculateDuration(
                        task.start_date,
                        task.end_date
                      );
                      return dur !== null
                        ? `${dur} ${dur === 1 ? "day" : "days"}`
                        : "-";
                    })()}
                  </p>
                </div>
              )}
            </aside>
          </div>

          {/* FOOTER: use ActionFooter */}
          <ActionFooter
            isNewTask={isNewTask}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={saving}
            onSave={handleSave}
            onClose={onClose}
            onDelete={isNewTask ? undefined : handleDelete}
            task={task ?? undefined}
            tempTitle={tempTitle}
          />
        </motion.div>
      </motion.div>
      {previewImageUrl && (
        <ImagePreviewModal
          imageUrl={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}
    </AnimatePresence>
  );
};

export default SingleTaskView;
