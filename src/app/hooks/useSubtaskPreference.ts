'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'nokan_show_subtasks_';

export function getSubtaskPreference(userId: string): boolean {
     if (typeof window === 'undefined') return false;
     return localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) === 'true';
}

export function setSubtaskPreference(userId: string, value: boolean): void {
     if (typeof window === 'undefined') return;
     if (value) {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, 'true');
     } else {
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
     }
}

export function useSubtaskPreference(userId: string | undefined): [boolean, (value: boolean) => void] {
     const [enabled, setEnabledState] = useState(false);

     useEffect(() => {
          if (userId) {
               setEnabledState(getSubtaskPreference(userId));
          }
     }, [userId]);

     const setEnabled = useCallback(
          (value: boolean) => {
               if (!userId) return;
               setSubtaskPreference(userId, value);
               setEnabledState(value);
          },
          [userId],
     );

     return [enabled, setEnabled];
}
