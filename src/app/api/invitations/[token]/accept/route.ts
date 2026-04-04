import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { token } = await params;

		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		const supabase = getSupabaseAdmin();

		// Resolve caller's Supabase user ID from session email
		const { data: callerUser, error: callerError } = await supabase
			.from('users')
			.select('id')
			.eq('email', session.user.email)
			.single();

		if (callerError || !callerUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 401 });
		}

		// Fetch invitation
		const { data: invitation, error } = await supabase
			.from('board_invitations')
			.select('id, board_id, status, expires_at')
			.eq('token', token)
			.single();

		if (error || !invitation) {
			return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
		}

		if (invitation.status !== 'pending') {
			return NextResponse.json({ error: 'Invitation already used or expired', status: invitation.status }, { status: 400 });
		}

		if (new Date(invitation.expires_at) < new Date()) {
			await supabase
				.from('board_invitations')
				.update({ status: 'expired' })
				.eq('id', invitation.id);

			return NextResponse.json({ error: 'Invitation expired', status: 'expired' }, { status: 400 });
		}

		// Add user to board's team (same pattern as addMemberToBoard in boardEndpoints.ts)
		const { data: existingTeam, error: findError } = await supabase
			.from('teams')
			.select('id')
			.eq('board_id', invitation.board_id)
			.maybeSingle();

		if (findError && findError.code !== 'PGRST116') {
			throw findError;
		}

		let teamId: string;

		if (existingTeam) {
			teamId = existingTeam.id;
		} else {
			const { data: board } = await supabase
				.from('boards')
				.select('title')
				.eq('id', invitation.board_id)
				.single();

			const { data: newTeam, error: createError } = await supabase
				.from('teams')
				.insert({
					board_id: invitation.board_id,
					name: board?.title || 'Team',
				})
				.select('id')
				.single();

			if (createError || !newTeam) {
				throw createError || new Error('Failed to create team');
			}
			teamId = newTeam.id;
		}

		// Insert team member (handle duplicate gracefully)
		const { error: insertError } = await supabase
			.from('team_members')
			.insert({ team_id: teamId, user_id: callerUser.id });

		if (insertError && insertError.code !== '23505') {
			throw insertError;
		}

		// Mark invitation as accepted
		await supabase
			.from('board_invitations')
			.update({ status: 'accepted' })
			.eq('id', invitation.id);

		return NextResponse.json({ success: true, boardId: invitation.board_id });
	} catch (error) {
		console.error('Accept invitation error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
