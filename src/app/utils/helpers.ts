import { toast } from 'sonner';
import { TaskDetail } from '@/app/types/globalTypes';

export type PriorityStyleConfig = {
     bgColor: string;
     textColor: string;
     borderColor: string;
     dotColor: string;
};

/**
 * Calculates duration in days between two ISO date strings.
 * Returns number of days (rounded up), or null if invalid or end < start.
 */
export function calculateDuration(start: string | null | undefined, end: string | null | undefined): number | null {
     if (!start || !end) return null;
     const d1 = new Date(start);
     const d2 = new Date(end);
     const diffMs = d2.getTime() - d1.getTime();
     if (isNaN(diffMs) || diffMs < 0) return null;
     const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
     return days;
}

/**
 * Formats date string to a readable Polish format with date and time.
 * If invalid or missing, returns fallback strings.
 */
export const formatDate = (dateString: string | null | undefined): string => {
     if (!dateString) return 'Unknown date';
     try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return 'Invalid date';
          return date.toLocaleDateString('pl-PL', {
               year: 'numeric',
               month: 'long',
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit',
               hour12: false,
          });
     } catch (error) {
          console.error('Error formatting date:', error);
          return 'Invalid date';
     }
};

/**
 * Maps priority ID string to Tailwind CSS classes for badge styling.
 * Returns an object with bg/text/border classes and a dot color.
 */
export function getPriorityStyleConfig(priorityId: string): PriorityStyleConfig {
     const configs: Record<string, PriorityStyleConfig> = {
          urgent: {
               bgColor: 'bg-red-950/40',
               textColor: 'text-red-400/90',
               borderColor: 'border-red-900/30',
               dotColor: '#dc2626',
          },
          high: {
               bgColor: 'bg-orange-950/40',
               textColor: 'text-orange-400/90',
               borderColor: 'border-orange-900/30',
               dotColor: '#ea580c',
          },
          medium: {
               bgColor: 'bg-yellow-500/15',
               textColor: 'text-yellow-400',
               borderColor: 'border-yellow-500/30',
               dotColor: '#eab308',
          },
          low: {
               bgColor: 'bg-slate-700/40',
               textColor: 'text-slate-400',
               borderColor: 'border-slate-600/30',
               dotColor: '#64748b',
          },
     };
     // fallback to 'medium' if unknown
     return configs[priorityId.toLowerCase()] || configs.medium;
}

/**
 * Truncates text to maxWords words, appending "..." if longer.
 */
export function truncateText(text: string, maxWords: number = 12): string {
     if (!text) return '';
     const words = text.trim().split(/\s+/);
     return words.length <= maxWords ? text : words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Converts file size in bytes to human-readable format.
 */
export const formatFileSize = (bytes: number): string => {
     if (bytes === 0) return '0 Bytes';
     const k = 1024;
     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));
     return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Returns an emoji icon based on MIME type.
 */
export const getFileIcon = (mimeType: string): string => {
     if (mimeType.startsWith('image/')) return '🖼️';
     if (mimeType.startsWith('video/')) return '🎥';
     if (mimeType.startsWith('audio/')) return '🎵';
     if (mimeType.includes('pdf')) return '📄';
     if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
     if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
     if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
     return '📁';
};

/**
 * Copies a task-specific URL to the clipboard, with param "task" in query string.
 */
export const copyTaskUrlToClipboard = async (taskId: string): Promise<void> => {
     const currentUrl = new URL(window.location.href);
     currentUrl.searchParams.set('task', taskId);
     try {
          await navigator.clipboard.writeText(currentUrl.toString());
          toast('Link copied to clipboard!');
     } catch (error) {
          console.error('Error copying task URL:', error);
     }
};

/**
 * Extracts id param "task" from given URL string.
 */
export const extractTaskIdFromUrl = (url: string): string | null => {
     try {
          const urlObj = new URL(url);
          return urlObj.searchParams.get('task');
     } catch (error) {
          console.error('Failed to extract taskId:', error);
          return null;
     }
};

/**
 * Picks updatable fields from TaskDetail into UpdatableTask shape, including sort_order.
 */
export type UpdatableTask = {
     column_id?: string;
     title?: string;
     order?: number;
     description?: string | null;
     priority?: string | null;
     user_id?: string | null;
     start_date?: string | null;
     end_date?: string | null;
     completed?: boolean;
     status_id?: string | null;
};

export function pickUpdatable(task: TaskDetail): Partial<TaskDetail> {
     const result: Partial<TaskDetail> = {};

     if (task.column_id !== undefined) {
          result.column_id = task.column_id;
     }

     if (task.title !== undefined) {
          result.title = task.title;
     }

     if (task.order !== undefined) {
          result.order = task.order;
     }

     if (task.description !== undefined) {
          result.description = task.description;
     }

     if (task.priority !== undefined) {
          result.priority = task.priority;
     }

     if (task.user_id !== undefined) {
          result.user_id = task.user_id;
     }

     if (task.start_date !== undefined) {
          result.start_date = task.start_date;
     }

     if (task.end_date !== undefined) {
          result.end_date = task.end_date;
     }

     if (task.completed !== undefined) {
          result.completed = task.completed;
     }

     if (task.status_id !== undefined) {
          result.status_id = task.status_id;
     }

     if (task.bug_url !== undefined) {
          result.bug_url = task.bug_url;
     }

     if (task.bug_scenario !== undefined) {
          result.bug_scenario = task.bug_scenario;
     }

     return result;
}
