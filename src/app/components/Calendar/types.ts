export interface CalendarProps {
    boardId: string;
    onTaskClick?: (taskId: string) => void;
}

export interface Priority {
    id: string;
    label: string;
    color: string;
}

export interface Assignee {
    id: string;
    name: string;
    email: string;
    image?: string;
}

export interface SupabaseTask {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    start_date: string;
    end_date?: string;
    column_id: string;
    assignee?: Assignee;
    priorities?: Priority;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    backgroundColor: string;
    borderColor: string;
    extendedProps: {
        description?: string;
        priority?: string;
        assignee?: Assignee;
    };
}