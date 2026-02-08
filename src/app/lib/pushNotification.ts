/**
 * Fire-and-forget push notification sender.
 * Called from RTK Query mutations after successful DB operations.
 */
export function triggerPushNotification(payload: {
	userId: string;
	title: string;
	body: string;
	url?: string;
	tag?: string;
	type: 'notification' | 'chat';
}): void {
	fetch('/api/push/send', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	}).catch(() => {
		// Silent failure — push is best-effort
	});
}
