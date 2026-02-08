'use client';

import { useEffect, useRef } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

/** localStorage key – when 'true' the user has explicitly opted out of push */
export const PUSH_OPTED_OUT_KEY = 'nokan_push_opted_out';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; ++i) {
		output[i] = raw.charCodeAt(i);
	}
	return output;
}

/**
 * Automatically subscribes to push notifications on app load.
 * Skips if:
 *  - push is not supported
 *  - user explicitly opted out (localStorage flag)
 *  - already subscribed
 *  - browser notification permission is denied
 *
 * Runs once per mount (guarded by ref).
 */
export function useAutoPushSubscription(userId: string | null): void {
	const attemptedRef = useRef(false);

	useEffect(() => {
		if (!userId || attemptedRef.current) return;
		if (typeof window === 'undefined') return;
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
		if (localStorage.getItem(PUSH_OPTED_OUT_KEY) === 'true') return;

		attemptedRef.current = true;

		const autoSubscribe = async () => {
			try {
				const registration = await navigator.serviceWorker.ready;
				const existingSub = await registration.pushManager.getSubscription();

				// Already subscribed — nothing to do
				if (existingSub) return;

				// Request permission (shows browser prompt only if 'default')
				const permission = await Notification.requestPermission();
				if (permission !== 'granted') return;

				const sub = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
				});

				// Save subscription to server
				await fetch('/api/push/subscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ subscription: sub.toJSON() }),
				});
			} catch {
				// Silent failure — push is best-effort
			}
		};

		autoSubscribe();
	}, [userId]);
}
