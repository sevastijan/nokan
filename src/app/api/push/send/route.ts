import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

function getServiceSupabase() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SERVICE_ROLE_KEY!
	);
}

webpush.setVapidDetails(
	'mailto:noreply@nokan.app',
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
	userId: string;
	title: string;
	body: string;
	url?: string;
	tag?: string;
	type: 'notification' | 'chat';
}

// POST — send push notification to a user's devices
export async function POST(req: NextRequest) {
	const token = await getToken({ req });
	if (!token?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const payload: PushPayload = await req.json();
	if (!payload.userId || !payload.title) {
		return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 });
	}

	const supabase = getServiceSupabase();

	// Check user's push preferences
	const { data: prefs } = await supabase
		.from('notification_preferences')
		.select('push_enabled, push_chat_enabled')
		.eq('user_id', payload.userId)
		.single();

	// Default to enabled if no preferences row
	const pushEnabled = prefs?.push_enabled ?? true;
	const pushChatEnabled = prefs?.push_chat_enabled ?? true;

	if (payload.type === 'notification' && !pushEnabled) {
		return NextResponse.json({ success: true, skipped: true, reason: 'push_disabled' });
	}
	if (payload.type === 'chat' && !pushChatEnabled) {
		return NextResponse.json({ success: true, skipped: true, reason: 'push_chat_disabled' });
	}

	// Get all subscriptions for this user
	const { data: subscriptions } = await supabase
		.from('push_subscriptions')
		.select('id, endpoint, p256dh, auth')
		.eq('user_id', payload.userId);

	if (!subscriptions || subscriptions.length === 0) {
		return NextResponse.json({ success: true, skipped: true, reason: 'no_subscriptions' });
	}

	const pushPayload = JSON.stringify({
		title: payload.title,
		body: payload.body,
		url: payload.url || '/',
		tag: payload.tag || `${payload.type}-${Date.now()}`,
	});

	const expiredIds: string[] = [];

	await Promise.allSettled(
		subscriptions.map(async (sub) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: sub.endpoint,
						keys: { p256dh: sub.p256dh, auth: sub.auth },
					},
					pushPayload
				);
			} catch (err: unknown) {
				const statusCode = (err as { statusCode?: number })?.statusCode;
				// 410 Gone or 404 = subscription expired, clean up
				if (statusCode === 410 || statusCode === 404) {
					expiredIds.push(sub.id);
				}
			}
		})
	);

	// Clean up expired subscriptions
	if (expiredIds.length > 0) {
		await supabase
			.from('push_subscriptions')
			.delete()
			.in('id', expiredIds);
	}

	return NextResponse.json({ success: true, sent: subscriptions.length - expiredIds.length });
}
