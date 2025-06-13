import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setAvatar } from "@/app/store/slices/avatarSlice";
import { User } from "@/app/types/globalTypes";
import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const getAvatarUrl = (user: User | null): string | null => {
  if (!user) return null;

  if (user.image) return user.image;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=4285f4&color=ffffff&size=96`;
};
export const useUserAvatar = (user: User | null): string | null => {
  const dispatch = useAppDispatch();
  const cache = useAppSelector((state) => state.avatars.cache);
  const key = user?.email || user?.id || "";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !key) return;

    // Jeśli avatar w cache — użyj
    if (cache[key]) {
      setAvatarUrl(cache[key]);
      return;
    }

    // Wygeneruj nowy avatar
    const url = getAvatarUrl(user);
    if (url) {
      dispatch(setAvatar({ key, url }));
      setAvatarUrl(url);
    }
  }, [user, key, cache, dispatch]);

  return avatarUrl;
};
// Formatowanie daty na polski zapis
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

// Formatowanie rozmiaru pliku
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Dobór ikony do typu pliku
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

// Kopiowanie linku do taska
export const copyTaskUrlToClipboard = async (taskId: string): Promise<void> => {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("id", taskId);

  try {
    await navigator.clipboard.writeText(currentUrl.toString());
    toast("Link copied to clipboard!");
  } catch (error) {
    console.error("Error during copying task url:", error);
  }
};
