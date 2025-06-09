export interface CalendarProps {
  boardId: string;
  onTaskClick?: (taskId: string) => void;
  viewMode?: "month" | "week" | "day";
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    description: string;
    priority: string;
    status: string;
    assignee: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
  };
}

// Typ dla danych zwracanych z API getTasksWithDates
export interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  column_id: string;
  assignee: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  priorities: {
    id: string;
    label: string;
    color: string;
  } | null;
}