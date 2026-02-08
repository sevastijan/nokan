'use client';

import { useEffect } from 'react';

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

export function useServiceWorker(): void {
     useEffect(() => {
          if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

          // In development, unregister any existing SW to avoid stale cache issues
          if (process.env.NODE_ENV === 'development') {
               navigator.serviceWorker.getRegistrations().then((regs) => {
                    regs.forEach((r) => r.unregister());
               });
               return;
          }

          let registration: ServiceWorkerRegistration | null = null;
          let intervalId: ReturnType<typeof setInterval> | null = null;

          const register = async () => {
               try {
                    registration = await navigator.serviceWorker.register('/sw.js');

                    registration.addEventListener('updatefound', () => {
                         const newWorker = registration?.installing;
                         if (!newWorker) return;

                         newWorker.addEventListener('statechange', () => {
                              if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                                   console.log('[SW] New version available');
                              }
                         });
                    });

                    intervalId = setInterval(() => {
                         registration?.update();
                    }, UPDATE_INTERVAL_MS);
               } catch (err) {
                    console.error('[SW] Registration failed:', err);
               }
          };

          // Register after page load to avoid blocking initial paint
          if (document.readyState === 'complete') {
               register();
          } else {
               window.addEventListener('load', register, { once: true });
          }

          return () => {
               if (intervalId) clearInterval(intervalId);
               window.removeEventListener('load', register);
          };
     }, []);
}
