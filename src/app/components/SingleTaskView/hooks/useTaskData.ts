import { useState, useEffect, useCallback } from "react";
import { getTaskById } from "../../../lib/api";
import { TaskDetail, Attachment } from "@/app/types/globalTypes";
import { supabase } from "../../../lib/api";

interface UseTaskDataResult {
  task: TaskDetail | null;
  loading: boolean;
  error: string | null;
  setTask: React.Dispatch<React.SetStateAction<TaskDetail | null>>;
  startDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  endDate: string;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  fetchTaskData: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage a TaskDetail by ID (edit mode) or initialize a blank task (add mode).
 *
 * @param taskId Optional task ID to fetch (edit mode). If undefined or mode="add", a new blank task is initialized.
 * @param mode "add" or "edit" mode. In "edit", we fetch from API; in "add", we initialize defaults.
 * @param columnId Optional column ID to initialize in add mode.
 * @returns {UseTaskDataResult}
 */
export const useTaskData = (
  taskId?: string,
  mode: "add" | "edit" = "edit",
  columnId?: string
): UseTaskDataResult => {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  /**
   * Fetches task detail and attachments, then sets local state.
   * Only runs in "edit" mode when taskId is provided.
   */
  const fetchTaskData = useCallback(async () => {
    // If editing an existing task
    if (mode === "edit" && taskId) {
      setLoading(true);
      setError(null);
      try {
        // Fetch main task details via your API helper
        const taskData = await getTaskById(taskId); // assume returns TaskDetail-compatible fields except attachments

        // Fetch attachments separately from Supabase
        const { data: attachmentsData, error: attachError } = await supabase
          .from("task_attachments")
          .select("*")
          .eq("task_id", taskId)
          .order("created_at", { ascending: false });

        if (attachError) {
          // You may want to handle this differently; here we log but continue
          console.warn(
            "Warning: failed to fetch attachments:",
            attachError.message
          );
        }

        // Build a TaskDetail object merging fetched fields + attachments
        // Note: we assume getTaskById returns an object compatible with TaskDetail except attachments/comments etc.
        const mergedTask: TaskDetail = {
          // Spread existing fields from taskData; TS assertion if necessary
          ...(taskData as Omit<
            TaskDetail,
            | "attachments"
            | "comments"
            | "priority_info"
            | "imagePreview"
            | "hasUnsavedChanges"
          >),
          // Ensure attachments field is present as Attachment[]
          attachments: (attachmentsData as Attachment[]) || [],
          // Comments, priority_info, imagePreview might be set inside getTaskById already
          comments: (taskData as TaskDetail).comments ?? [],
          priority_info: (taskData as TaskDetail).priority_info ?? null,
          imagePreview: (taskData as TaskDetail).imagePreview ?? null,
          hasUnsavedChanges: false,
        };

        setTask(mergedTask);
        // Initialize startDate/endDate strings from task detail (fallback to empty string)
        setStartDate(mergedTask.start_date ?? "");
        setEndDate(mergedTask.end_date ?? "");
      } catch (err: any) {
        console.error("Failed to load task:", err);
        setError("Failed to load task");
        setTask(null);
        setStartDate("");
        setEndDate("");
      } finally {
        setLoading(false);
      }
    }
    // If adding new task
    else if (mode === "add") {
      setError(null);
      // Initialize a blank TaskDetail. You may need to add all required fields from TaskDetail
      const nowIso = new Date().toISOString();
      const newTask: TaskDetail = {
        id: "", // empty/new
        title: "",
        description: "",
        column_id: columnId || "",
        board_id: "", // you may set later
        priority: null,
        user_id: null,
        order: 0,
        completed: false,
        created_at: nowIso,
        updated_at: nowIso,
        images: null,
        assignee: null,
        start_date: null,
        end_date: null,
        due_date: null,
        status: null,
        priority_info: null,
        attachments: [],
        comments: [],
        imagePreview: null,
        hasUnsavedChanges: false,
      };
      setTask(newTask);
      setStartDate("");
      setEndDate("");
      setLoading(false);
    } else {
      // In case mode="edit" but no taskId, treat as blank
      setTask(null);
      setLoading(false);
    }
  }, [taskId, mode, columnId]);

  // Run fetch on mount or when taskId/mode/columnId changes
  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  return {
    task,
    loading,
    error,
    setTask,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchTaskData,
  };
};
