import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const { token } = await params;

		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		const supabase = getSupabaseAdmin();

		const { data: invitation, error } = await supabase
			.from('board_invitations')
			.select(`
				id,
				board_id,
				email,
				invited_by,
				token,
				role,
				status,
				created_at,
				expires_at
			`)
			.eq('token', token)
			.single();

		if (error || !invitation) {
			return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
		}

		// Check if already used
		if (invitation.status === 'accepted') {
			return NextResponse.json({ status: 'already_used' });
		}

		if (invitation.status === 'expired') {
			return NextResponse.json({ status: 'expired' });
		}

		// Check expiry
		if (new Date(invitation.expires_at) < new Date()) {
			await supabase
				.from('board_invitations')
				.update({ status: 'expired' })
				.eq('id', invitation.id);

			return NextResponse.json({ status: 'expired' });
		}

		// Fetch board name
		const { data: board } = await supabase
			.from('boards')
			.select('title')
			.eq('id', invitation.board_id)
			.single();

		// Fetch inviter name
		const { data: inviter } = await supabase
			.from('users')
			.select('name, custom_name')
			.eq('id', invitation.invited_by)
			.single();

		return NextResponse.json({
			status: 'pending',
			boardName: board?.title || 'Tablica',
			inviterName: inviter?.custom_name || inviter?.name || 'Użytkownik',
			email: invitation.email,
			boardId: invitation.board_id,
			role: invitation.role,
		});
	} catch (error) {
		console.error('Get invitation error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
