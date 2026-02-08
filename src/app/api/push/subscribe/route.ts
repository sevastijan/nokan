import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SERVICE_ROLE_KEY!
	);
}

// POST — save push subscription for current user
export async function POST(req: NextRequest) {
	const token = await getToken({ req });
	if (!token?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { subscription } = await req.json();
	if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
		return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
	}

	const supabase = getServiceSupabase();

	// Resolve user id from email
	const { data: user } = await supabase
		.from('users')
		.select('id')
		.eq('email', token.email)
		.single();

	if (!user) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	const { error } = await supabase
		.from('push_subscriptions')
		.upsert(
			{
				user_id: user.id,
				endpoint: subscription.endpoint,
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
			},
			{ onConflict: 'user_id,endpoint' }
		);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}

// DELETE — remove push subscription for current user
export async function DELETE(req: NextRequest) {
	const token = await getToken({ req });
	if (!token?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { endpoint } = await req.json();
	if (!endpoint) {
		return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
	}

	const supabase = getServiceSupabase();

	const { data: user } = await supabase
		.from('users')
		.select('id')
		.eq('email', token.email)
		.single();

	if (!user) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	await supabase
		.from('push_subscriptions')
		.delete()
		.eq('user_id', user.id)
		.eq('endpoint', endpoint);

	return NextResponse.json({ success: true });
}
