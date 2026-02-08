'use client';

import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

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

interface UsePushSubscriptionReturn {
	isSupported: boolean;
	isSubscribed: boolean;
	loading: boolean;
	subscribe: () => Promise<boolean>;
	unsubscribe: () => Promise<boolean>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
	const [isSupported, setIsSupported] = useState(false);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [loading, setLoading] = useState(true);

	// Check current subscription state on mount
	useEffect(() => {
		const check = async () => {
			if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
				setIsSupported(false);
				setLoading(false);
				return;
			}

			setIsSupported(true);

			try {
				const registration = await navigator.serviceWorker.ready;
				const sub = await registration.pushManager.getSubscription();
				setIsSubscribed(!!sub);
			} catch {
				setIsSubscribed(false);
			}
			setLoading(false);
		};

		check();
	}, []);

	const subscribe = useCallback(async (): Promise<boolean> => {
		if (!isSupported) return false;
		setLoading(true);

		try {
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				setLoading(false);
				return false;
			}

			const registration = await navigator.serviceWorker.ready;
			const sub = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
			});

			// Save subscription to server
			const res = await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subscription: sub.toJSON() }),
			});

			if (!res.ok) {
				await sub.unsubscribe();
				setLoading(false);
				return false;
			}

			setIsSubscribed(true);
			setLoading(false);
			return true;
		} catch {
			setLoading(false);
			return false;
		}
	}, [isSupported]);

	const unsubscribe = useCallback(async (): Promise<boolean> => {
		if (!isSupported) return false;
		setLoading(true);

		try {
			const registration = await navigator.serviceWorker.ready;
			const sub = await registration.pushManager.getSubscription();

			if (sub) {
				const endpoint = sub.endpoint;
				await sub.unsubscribe();

				await fetch('/api/push/subscribe', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ endpoint }),
				});
			}

			setIsSubscribed(false);
			setLoading(false);
			return true;
		} catch {
			setLoading(false);
			return false;
		}
	}, [isSupported]);

	return { isSupported, isSubscribed, loading, subscribe, unsubscribe };
}
