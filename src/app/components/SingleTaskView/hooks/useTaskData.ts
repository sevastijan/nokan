import { useState, useEffect, useCallback } from "react";
import { getTaskById } from "../../../lib/api";
import { TaskDetail } from "../types";
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

export const useTaskData = (
  taskId?: string,
  mode: "add" | "edit" = "edit",
  columnId?: string
): UseTaskDataResult => {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchTaskData = useCallback(async () => {
    if (taskId && mode === "edit") {
      setLoading(true);
      try {
        const taskData = await getTaskById(taskId);

        const { data: attachments, error: attachError } = await supabase
          .from("task_attachments")
          .select("*")
          .eq("task_id", taskId)
          .order("created_at", { ascending: false });

        if (attachError) {
          console.error("Error fetching attachments:", attachError);
        }

        const taskWithAttachments = {
          ...taskData,
          attachments: attachments || [],
        };

        setTask(taskWithAttachments);
        setStartDate((taskWithAttachments as any).start_date || "");
        setEndDate((taskWithAttachments as any).end_date || "");
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to load task");
      } finally {
        setLoading(false);
      }
    } else if (mode === "add") {
      setTask({
        id: "",
        title: "",
        column_id: columnId || "",
        description: "",
        priority: null,
        user_id: null,
        images: [],
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
    }
  }, [taskId, mode, columnId]);

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