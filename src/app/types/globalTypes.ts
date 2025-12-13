import { ChangeEvent } from 'react';

// === Core Types ===

export type SingleTaskMode = 'edit' | 'add';

// === Status Type ===
export interface Status {
     id: string;
     label: string;
     color: string;
}

// === Core Types ===
export type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | 'CLIENT';

export interface User {
     id: string;
     email: string;
     name?: string | null;
     custom_name?: string | null;
     image?: string | null;
     custom_image?: string | null;
     role?: UserRole;
     created_at?: string;
}

export interface Priority {
     id: string;
     label: string;
     color: string;
}

export interface BoardClient {
     id: string;
     board_id: string;
     client_id: string;
     assigned_by: string | null;
     can_delete_own: boolean;
     can_edit_after_submission: boolean;
     created_at: string;
     updated_at: string;
     client?: User;
}

export interface PrioritySelectorProps {
     selectedPriority: string | null;
     onChange: (newPriorityId: string | null) => void;
     onDropdownToggle?: (isOpen: boolean) => void;
     priorities?: Priority[];
}

export interface ApiTask {
     id: string;
     title: string;
     description?: string | null;
     column_id: string;
     board_id: string;
     start_date?: string | null;
     end_date?: string | null;
     due_date?: string | null;
     completed: boolean;
     assignee?: {
          id: string;
          name: string;
          email: string;
          image?: string | null;
     } | null;
     priority?: {
          id: string;
          label: string;
          color: string;
     } | null;
     user_id?: string | null;
     status?: string | null;
     status_id?: string | null;
     images?: string[] | null;
}

export interface Attachment {
     id: string;
     task_id: string;
     file_name: string;
     file_path: string;
     file_size: number;
     mime_type: string;
     uploaded_by: string;
     created_at: string;
}

export interface AttachmentsListProps {
     attachments: Attachment[];
     currentUser: User;
     taskId: string;
     onTaskUpdate?: () => void;
     onAttachmentsUpdate?: (updater: (prev: Attachment[]) => Attachment[]) => void;
     onUploadAttachment?: (file: File) => Promise<Attachment | null>;
}

export interface ApiTemplateColumn {
     id: string;
     title: string;
     order: number;
     created_at?: string | null;
}

export interface ApiTemplateResponse {
     id: string;
     name: string;
     description?: string | null;
     template_columns?: ApiTemplateColumn[] | null;
     columns?: ApiTemplateColumn[] | null;
}

export interface Comment {
     id: string;
     task_id: string;
     user_id: string;
     content: string;
     created_at: string;
     updated_at?: string;
     parent_id?: string | null;
     mentions?: { user_id: string; name: string }[];
     author: {
          id: string;
          name: string;
          email: string;
          image?: string | null;
     };
     replies?: Comment[];
}

export interface TaskCollaborator {
     id: string;
     task_id: string;
     user_id: string;
     user: User;
     created_at?: string;
}

export interface Task {
     sort_order: number;
     id: string;
     title: string;
     description: string;
     column_id: string;
     board_id: string;
     priority: string;
     user_id?: string;
     order: number;
     completed: boolean;
     created_at?: string;
     taskIndex?: number;
     updated_at?: string;
     images?: string[];
     assignee?: User | null;
     collaborators?: User[];
     start_date?: string;
     end_date?: string;
     due_date?: string;
     status?: string;
     status_id?: string | null;
     statuses?: Status[];
     is_recurring?: boolean;
     recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
     recurrence_interval?: number | null;
     recurrence_column_id?: string | null;
     next_occurrence_date?: string | null;
}

export interface TaskDetail {
     id?: string;
     title: string | null;
     description?: string | null;
     column_id: string | null;
     created_at?: string | null;
     updated_at?: string | null;
     priority?: string | null;
     images?: string[] | null;
     priority_info?: Priority | null;
     user_id?: string | null;
     assignee?: User | null;
     collaborators?: User[];
     created_by?: string | null;
     creator?: User | null;
     attachments?: Attachment[];
     comments?: Comment[];
     order?: number;
     start_date?: string | null;
     end_date?: string | null;
     due_date?: string | null;
     status?: string | null;
     status_id?: string | null;
     board_id?: string | null;
     imagePreview?: string | null;
     hasUnsavedChanges?: boolean;
     completed?: boolean;
     statuses?: Status[];
     is_recurring?: boolean;
     recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
     recurrence_interval?: number | null;
     recurrence_column_id?: string | null;
     next_occurrence_date?: string | null;
}

export interface Column {
     id: string;
     boardId: string;
     title: string;
     order: number;
     tasks: Task[];
}

export interface Board {
     statuses: Status[];
     id: string;
     title: string;
     user_id: string;
     ownerName?: string;
     ownerEmail?: string;
     columns: Column[];
     created_at?: string;
     updated_at?: string;
     _count?: {
          tasks: number;
          teamMembers: number;
          completedTasks?: number;
     };
}

export interface BoardWithCounts extends Board {
     _count: {
          tasks: number;
          teamMembers: number;
          completedTasks?: number;
     };
}

export interface BoardHeaderProps {
     boardTitle: string;
     onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
     onTitleBlur: () => void;
     onAddColumn: () => void;
     viewMode: 'columns' | 'list';
     onViewModeChange: (mode: 'columns' | 'list') => void;
     searchTerm: string;
     onSearchChange: (term: string) => void;
     priorities: PriorityOption[];
     filterPriority: string | null;
     onFilterPriorityChange: (prio: string | null) => void;
     assignees: AssigneeOption[];
     filterAssignee: string | null;
     onFilterAssigneeChange: (assigneeId: string | null) => void;
}

export interface AssigneeOption {
     id: string;
     name: string;
}

export interface PriorityOption {
     id: string;
     label: string;
     color: string;
}

export interface TeamMember {
     id: string;
     team_id: string;
     user_id: string;
     created_at?: string;
     user: User;
}

export interface Team {
     id: string;
     name: string;
     board_id?: string | null;
     owner_id?: string;
     users: TeamMember[];
     created_at?: string;
}

export interface CustomSelectOption {
     value: string;
     label: string;
     image?: string;
}

export interface CustomSelectProps {
     options: CustomSelectOption[];
     value: string[];
     onChange: (val: string[]) => void;
     isMulti?: boolean;
     placeholder?: string;
     label?: string;
     disabled?: boolean;
}

export interface TeamFormModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: () => Promise<void>;
     isCreatingTeam: boolean;
     editingTeamId: string | null;
     newTeamName: string;
     setNewTeamName: (val: string) => void;
     newTeamMembers: string[];
     setNewTeamMembers: (val: string[]) => void;
     editedTeamName: string;
     setEditedTeamName: (val: string) => void;
     editedTeamMembers: string[];
     setEditedTeamMembers: (val: string[]) => void;
     availableUsers: User[];
     boards: Board[];
     selectedBoardIds: string[];
     setSelectedBoardIds: (ids: string[]) => void;
}

export interface TeamListProps {
     teams: Team[];
     onEditTeam: (team: Team) => void;
     onDeleteTeam: (teamId: string) => void;
     availableUsers: User[];
}

export interface TeamListItemProps {
     team: Team;
     onEditTeam: (team: Team) => void;
     onDeleteTeam: (teamId: string) => void;
     availableUsers: User[];
}

export interface BoardListItemType {
     id: string;
     title: string;
     owner: string;
     _count?: {
          tasks: number;
          teamMembers: number;
     };
}

export interface BoardListProps {
     boards: BoardListItemType[];
     onEdit: (boardId: string) => void;
     onDelete: (boardId: string) => void;
}

interface TemplateTask {
     id: string;
     title: string;
     description?: string;
}

export interface TemplateColumn {
     id: string;
     title: string;
     order: number;
     tasks: TemplateTask[];
}

export interface BoardTemplate {
     id: string;
     name: string;
     description: string | null;
     is_custom: boolean;
     template_columns: Array<{
          id: string;
          template_id: string;
          title: string;
          order: number;
          created_at?: string;
     }>;
}

export interface TemplateSelectorProps {
     selectedTemplate?: BoardTemplate | null;
     onTemplateSelect: (tpl: BoardTemplate | null) => void;
     onCreateTemplate: () => void;
     disabled?: boolean;
     refreshTrigger?: number;
}

export interface CreateTemplateModalProps {
     isOpen: boolean;
     onClose: () => void;
     onTemplateCreated: (newTpl: BoardTemplate) => void;
}

export interface TaskContentProps {
     task: TaskDetail | null;
     currentUser: User;
     availableUsers: User[];
     priorities: Priority[];
     onUpdateTask: (updates: Partial<TaskDetail>) => void;
     taskId: string;
     setHasUnsavedChanges: (value: boolean) => void;
     isNewTask?: boolean;
     onTaskUpdate?: () => Promise<void>;
     onAttachmentsUpdate?: (updater: (attachments: Attachment[]) => Attachment[]) => void;
     teamMembers: TeamMember[];
     onAssigneeChange?: (assigneeId: string | null) => void;
     selectedAssigneeId?: string | null;
}

export interface TaskHeaderProps {
     task: TaskDetail | null;
     onClose: () => void;
     onUpdateTask: (updates: Partial<TaskDetail>) => void;
     hasUnsavedChanges?: boolean;
     onUnsavedChangesAlert?: () => void;
}

export interface TaskFooterProps {
     task?: TaskDetail;
     currentUser: User;
     isNewTask?: boolean;
     hasUnsavedChanges?: boolean;
     isSaving?: boolean;
     onSave?: () => void;
     onClose?: () => void;
     onDelete?: () => void;
}

export interface SingleTaskViewProps {
     taskId?: string;
     mode: SingleTaskMode;
     columnId?: string;
     boardId?: string;
     onClose: () => void;
     onTaskUpdate?: (task: TaskDetail) => void;
     onTaskAdd?: () => void;
     onTaskAdded?: (task: TaskDetail) => void;
     currentUser?: User;
     initialStartDate?: string;
     columns: Column[];
     statuses: Status[];
}

export interface UserSelectorProps {
     selectedUsers: User[];
     availableUsers: User[];
     onUsersChange: (userIds: string[]) => void;
     label?: string;
}

export interface CommentListProps {
     comments: Comment[];
     currentUser: User;
     task: TaskDetail;
     onDeleteComment: (commentId: string) => Promise<void>;
     onImagePreview: (url: string) => void;
}

export interface CommentsSectionProps {
     taskId: string;
     comments: Comment[];
     currentUser: User;
     task: TaskDetail | null;
     onRefreshComments: () => Promise<void>;
     onImagePreview: (url: string) => void;
     teamMembers: User[];
}

export interface CommentFormProps {
     currentUser: User;
     taskId: string;
     onAddComment: (content: string) => Promise<void>;
     onRefreshTask?: () => Promise<void>;
}

export interface ImagePreviewModalProps {
     imageUrl: string | null;
     onClose: () => void;
}

export interface CalendarEvent {
     id: string;
     title: string;
     start: string;
     end: string;
     priority: string;
     assignee: User | null;
     description: string;
     backgroundColor: string;
     borderColor: string;
     extendedProps: {
          priority: string;
          assignee: User | null;
          description: string;
     };
}

export interface CalendarProps {
     events: CalendarEvent[];
     viewMode?: 'month' | 'week' | 'day';
     onTaskClick?: (taskId: string) => void;
}

export interface ConfirmDialogProps {
     isOpen: boolean;
     title: string;
     message: string;
     confirmText?: string;
     cancelText?: string;
     onConfirm: () => void;
     onCancel: () => void;
     type?: 'warning' | 'danger' | 'info';
}

export interface ActionFooterProps {
     isNewTask: boolean;
     hasUnsavedChanges: boolean;
     isSaving: boolean;
     onSave: () => void;
     onClose: () => void;
     onDelete?: () => void;
     task?: TaskDetail;
     tempTitle?: string;
}

export const DEFAULT_TEMPLATES: Omit<BoardTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
     {
          name: 'Basic Kanban',
          description: 'Prosty układ trzech kolumn',
          is_custom: false,
          template_columns: [
               { id: 'temp-1', template_id: '', title: 'To Do', order: 0 },
               { id: 'temp-2', template_id: '', title: 'In Progress', order: 1 },
               { id: 'temp-3', template_id: '', title: 'Done', order: 2 },
          ],
     },
     {
          name: 'Development Workflow',
          description: 'Szablon dla zespołów deweloperskich',
          is_custom: false,
          template_columns: [
               { id: 'temp-4', template_id: '', title: 'Backlog', order: 0 },
               { id: 'temp-5', template_id: '', title: 'In Development', order: 1 },
               { id: 'temp-6', template_id: '', title: 'Code Review', order: 2 },
               { id: 'temp-7', template_id: '', title: 'Testing', order: 3 },
               { id: 'temp-8', template_id: '', title: 'Done', order: 4 },
          ],
     },
     {
          name: 'Marketing Campaign',
          description: 'Szablon dla kampanii marketingowych',
          is_custom: false,
          template_columns: [
               { id: 'temp-9', template_id: '', title: 'Ideas', order: 0 },
               { id: 'temp-10', template_id: '', title: 'Planning', order: 1 },
               { id: 'temp-11', template_id: '', title: 'In Progress', order: 2 },
               { id: 'temp-12', template_id: '', title: 'Review', order: 3 },
               { id: 'temp-13', template_id: '', title: 'Published', order: 4 },
          ],
     },
];

export interface UseTaskManagementProps {
     taskId?: string;
     mode: 'add' | 'edit';
     columnId?: string;
     boardId: string;
     currentUser?: User;
     initialStartDate?: string;
     onTaskUpdate?: (task: TaskDetail) => void;
     onTaskAdded?: (task: TaskDetail) => void;
     onClose: () => void;
}

export interface UseTaskManagementReturn {
     task: TaskDetail | null;
     loading: boolean;
     saving: boolean;
     error: string | null;
     hasUnsavedChanges: boolean;
     isNewTask: boolean;
     teamMembers: TeamMember[];
     updateTask: (updates: Partial<TaskDetail>) => void;
     updateTitle: (title: string) => void;
     updateDescription: (desc: string) => void;
     updatePriority: (priority: string | null) => Promise<void>;
     updateAssignee: (id: string | null, data?: User | null) => Promise<void>;
     updateDates: (dates: { start_date?: string | null; end_date?: string | null; due_date?: string | null }) => Promise<void>;
     updateImages: (images: string[] | null) => Promise<void>;
     saveNewTask: () => Promise<boolean>;
     saveExistingTask: () => Promise<boolean>;
     deleteTask: () => Promise<boolean>;
     markAsChanged: () => void;
     markAsSaved: () => void;
     fetchTaskData: () => Promise<void>;
     setTask: React.Dispatch<React.SetStateAction<TaskDetail | null>>;
     uploadAttachment: (file: File) => Promise<Attachment | null>;
}

export interface SubmissionForm {
     id: string;
     title: string;
     description: string;
     priority: string;
     client_id: string;
     board_id: string;
     column_id: string;
     status: string;
     status_id?: string;
     created_at?: string;
     updated_at?: string;
}

export interface ClientSubmission {
     id: string;
     title: string;
     description: string;
     column_id: string;
     board_id: string;
     priority: string;
     user_id?: string | null;
     board_title: string;
     order: number;
     sort_order: number;
     completed: boolean;
     created_at?: string;
     updated_at?: string;
     images?: string[] | null;
     assignee?: User | null;
     start_date?: string | null;
     end_date?: string | null;
     due_date?: string | null;
     status_id?: string | null;

     submission_id: string;
     client_name?: string;
     client_email?: string;

     status?: Status | null;
}
