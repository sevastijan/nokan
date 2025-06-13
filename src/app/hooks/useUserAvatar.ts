// src/app/hooks/useUserAvatar.ts
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setAvatar, removeAvatar } from "@/app/store/slices/avatarSlice";
import { User } from "@/app/types/globalTypes";

/**
 * Generates an avatar URL from user's image or initials.
 * If `user.image` exists, returns that. Otherwise builds UI Avatars URL.
 */
export const getAvatarUrl = (user: User | null): string | null => {
  if (!user) return null;
  if (user.image) {
    return user.image;
  }
  const initials = user.name
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  // Using UI Avatars or any other service:
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=4285f4&color=ffffff&size=96`;
  return url;
};

/**
 * Custom hook: returns avatar URL for given user, caching it in Redux.
 * Comments in English inside code.
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
    // Generate URL based on current user data
    const url = getAvatarUrl(user);
    if (url) {
      // If cached URL is different or missing, dispatch to store
      if (cache[key] !== url) {
        dispatch(setAvatar({ key, url }));
      }
      setAvatarUrl(url);
    } else {
      // No URL (unlikely), clear local
      setAvatarUrl(null);
      // Optionally remove from cache
      if (cache[key]) {
        dispatch(removeAvatar(key));
      }
    }
  }, [user, key, cache, dispatch]);

  return avatarUrl;
};
