import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAvatar, removeAvatar } from '@/app/store/slices/avatarSlice';
import { User } from '@/app/types/globalTypes';

/**
 * Generates an avatar URL from user's image or initials.
 * If `user.image` exists, returns that. Otherwise builds UI Avatars URL.
 */
export const getAvatarUrl = (user: User | null): string | null => {
     if (!user) return null;
     if (user.image) {
          return user.image;
     }

     // Safely handle possible null/undefined name
     if (!user.name || user.name.trim() === '') {
          return null; // or fallback URL, e.g. generic avatar
     }

     const initials = user.name
          .trim()
          .split(' ')
          .map((n) => n[0] ?? '')
          .join('')
          .toUpperCase()
          .slice(0, 2);

     // If no valid initials, return null or fallback
     if (!initials) return null;

     const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4285f4&color=ffffff&size=96`;
     return url;
};

/**
 * Custom hook: returns avatar URL for given user, caching it in Redux.
 */
export const useUserAvatar = (user: User | null): string | null => {
     const dispatch = useAppDispatch();
     const cache = useAppSelector((state) => state.avatars.cache);
     const key = user?.email || user?.id || '';
     const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

     useEffect(() => {
          if (!user || !key) {
               setAvatarUrl(null);
               return;
          }

          const url = getAvatarUrl(user);

          if (url) {
               if (cache[key] !== url) {
                    dispatch(setAvatar({ key, url }));
               }
               setAvatarUrl(url);
          } else {
               setAvatarUrl(null);
               if (cache[key]) {
                    dispatch(removeAvatar(key));
               }
          }
     }, [user, key, cache, dispatch]);

     // Return cached value if available and matches current user
     if (user && key && cache[key]) {
          return cache[key];
     }

     return avatarUrl;
};
