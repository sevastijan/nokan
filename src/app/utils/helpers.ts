// src/app/utils/helpers.ts

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  setAvatar,
  removeAvatar,
  clearAvatars,
} from "@/app/store/slices/avatarSlice";
import { toast } from "react-toastify";
import { supabase } from "@/app/lib/supabase";
import { User, TaskDetail } from "@/app/types/globalTypes";

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
export function calculateDuration(
  start: string | null | undefined,
  end: string | null | undefined
): number | null {
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
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

/**
 * Maps priority ID string to Tailwind CSS classes for badge styling.
 * Returns an object with bg/text/border classes and a dot color.
 */
export function getPriorityStyleConfig(
  priorityId: string
): PriorityStyleConfig {
  const configs: Record<string, PriorityStyleConfig> = {
    urgent: {
      bgColor: "bg-red-500/20",
      textColor: "text-red-400",
      borderColor: "border-red-500/30",
      dotColor: "#ef4444",
    },
    high: {
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-500",
      borderColor: "border-orange-500/30",
      dotColor: "#f97316",
    },
    medium: {
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/30",
      dotColor: "#f59e0b",
    },
    low: {
      bgColor: "bg-green-500/20",
      textColor: "text-green-400",
      borderColor: "border-green-500/30",
      dotColor: "#10b981",
    },
  };
  // fallback to 'medium' if unknown
  return configs[priorityId.toLowerCase()] || configs.medium;
}

/**
 * Truncates text to maxWords words, appending "..." if longer.
 */
export function truncateText(text: string, maxWords: number = 12): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  return words.length <= maxWords
    ? text
    : words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Generates avatar URL from a user's initials or image.
 * If user.image is a full URL, returns it directly.
 * If user.image is a non-empty string (assumed Supabase storage path under bucket "avatars"), attempts to get public URL.
 * Otherwise falls back to generating via ui-avatars.com based on initials.
 */
export function getAvatarUrl(user: User | null): string | null {
  if (!user) return null;
  // If image is a full URL, return as is.
  if (
    user.image &&
    (user.image.startsWith("http://") || user.image.startsWith("https://"))
  ) {
    return user.image;
  }
  // If image is a non-empty string but not URL, treat as Supabase bucket path.
  if (user.image) {
    try {
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(user.image);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    } catch (e) {
      console.error("Error obtaining public avatar URL:", e);
    }
  }
  // Fallback: generate via initials
  if (user.name) {
    const initials = user.name
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      initials
    )}&background=374151&color=ffffff&size=128`;
  }
  return null;
}

/**
 * Custom React hook for loading and caching a user's avatar URL in Redux store.
 * Uses `setAvatar`, `removeAvatar`, `clearAvatars` actions from avatarSlice.
 */
export const useUserAvatar = (user: User | null): string | null => {
  const dispatch = useAppDispatch();
  const cache = useAppSelector((state) => state.avatars.cache);
  // Use email or id as cache key
  const key = user?.email || user?.id || "";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !key) {
      // If no user or no key, clear local avatar state
      setAvatarUrl(null);
      return;
    }
    // Generate URL
    const url = getAvatarUrl(user);
    if (url) {
      // If cache differs or missing, dispatch setAvatar
      if (cache[key] !== url) {
        dispatch(setAvatar({ key, url }));
      }
      setAvatarUrl(url);
    } else {
      // No URL obtained: clear local state and remove from cache if exists
      setAvatarUrl(null);
      if (cache[key]) {
        dispatch(removeAvatar(key));
      }
    }
  }, [user, key, cache, dispatch]);

  return avatarUrl;
};

/**
 * Converts file size in bytes to human-readable format.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Returns an emoji icon based on MIME type.
 */
export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "📊";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
  return "📁";
};

/**
 * Copies a task-specific URL to the clipboard, with param "task" in query string.
 */
export const copyTaskUrlToClipboard = async (taskId: string): Promise<void> => {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("task", taskId);
  try {
    await navigator.clipboard.writeText(currentUrl.toString());
    toast("Link copied to clipboard!");
  } catch (error) {
    console.error("Error copying task URL:", error);
  }
};

/**
 * Extracts id param "task" from given URL string.
 */
export const extractTaskIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("task");
  } catch (error) {
    console.error("Failed to extract taskId:", error);
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
  sort_order?: number;
  description?: string | null;
  priority?: string | null;
  user_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  completed?: boolean;
};
export function pickUpdatable(task: TaskDetail): UpdatableTask {
  const whitelist: (keyof UpdatableTask)[] = [
    "column_id",
    "title",
    "order",
    "sort_order",
    "description",
    "priority",
    "user_id",
    "start_date",
    "end_date",
    "completed",
  ];
  return whitelist.reduce((acc, key) => {
    const v = (task as any)[key];
    if (typeof v !== "undefined") {
      (acc as any)[key] = v;
    }
    return acc;
  }, {} as UpdatableTask);
}
