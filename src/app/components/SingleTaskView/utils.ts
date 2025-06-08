import React from "react";
import { User } from "./types";
import { toast } from "react-toastify";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const getUserAvatar = async (user: User, retryCount = 0): Promise<string> => {
  if (user.image) {
    return user.image;
  }

  const initials = user.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=4285f4&color=ffffff&size=96`;

  try {
    const response = await fetch(avatarUrl);

    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        console.warn(`Rate limited. Retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return getUserAvatar(user, retryCount + 1); // Recursive call to retry
      } else {
        console.error("Max retries reached. Failed to fetch avatar.");
        return ""; // Return a default avatar or an empty string
      }
    }

    if (!response.ok) {
      console.error(`Failed to fetch avatar. Status: ${response.status}`);
      return ""; // Return a default avatar or an empty string
    }

    return avatarUrl;
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return ""; // Return a default avatar or an empty string
  }
};

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Unknown date";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

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

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIcon = (mimeType: string) => {
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

export const copyTaskUrlToClipboard = async (taskId: string) => {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("id", taskId);

  try {
    await navigator.clipboard.writeText(currentUrl.toString());

    toast("Link copied to clipboard!");
  } catch (error) {
    console.error("Error during copying task url:", error);
  }
};
