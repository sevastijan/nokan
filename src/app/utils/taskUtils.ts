import { TaskDetail } from "@/app/types/globalTypes";

/**
 * Removes non-persistent or UI-only fields from a task object
 * before sending it to the API.
 */
export function cleanTaskData(task: TaskDetail): Partial<TaskDetail> {
  const {
    id,
    title,
    description,
    column_id,
    board_id,
    user_id,
    priority,
    order,
    status,
    start_date,
    end_date,
    due_date,
    images,
    created_at,
    updated_at,
    // Excluded fields:
    assignee,
    attachments,
    priority_info,
    imagePreview,
    comments,
    hasUnsavedChanges,
    ...rest
  } = task;

  return {
    id,
    title: title ?? "",
    description: description ?? "",
    column_id: column_id ?? "",
    board_id: board_id ?? "",
    user_id: user_id ?? null,
    priority: priority ?? null,
    order: order ?? 0,
    status: status ?? null,
    start_date: start_date ?? null,
    end_date: end_date ?? null,
    due_date: due_date ?? null,
    images: images ?? [],
    created_at,
    updated_at,
    ...rest,
  };
}
