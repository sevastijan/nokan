import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { Resend } from 'resend';
import { boardInvitationTemplate } from '@/app/lib/email/templates';

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nokan.nkdlab.space';

export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { boardId, email: rawEmail, role } = body;

		if (!boardId || !rawEmail) {
			return NextResponse.json({ error: 'boardId and email are required' }, { status: 400 });
		}

		const email = rawEmail.trim().toLowerCase();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
		}

		const supabase = getSupabaseAdmin();

		// Verify board exists and caller has access
		const { data: board, error: boardError } = await supabase
			.from('boards')
			.select('id, title, user_id')
			.eq('id', boardId)
			.single();

		if (boardError || !board) {
			return NextResponse.json({ error: 'Board not found' }, { status: 404 });
		}

		// Check caller is owner or team member
		const isOwner = board.user_id === session.user.id;
		if (!isOwner) {
			const { data: team } = await supabase
				.from('teams')
				.select('id')
				.eq('board_id', boardId)
				.maybeSingle();

			if (team) {
				const { data: membership } = await supabase
					.from('team_members')
					.select('id')
					.eq('team_id', team.id)
					.eq('user_id', session.user.id)
					.maybeSingle();

				if (!membership) {
					return NextResponse.json({ error: 'No permission to invite to this board' }, { status: 403 });
				}
			} else {
				return NextResponse.json({ error: 'No permission to invite to this board' }, { status: 403 });
			}
		}

		// Check self-invite
		const { data: callerUser } = await supabase
			.from('users')
			.select('email')
			.eq('id', session.user.id)
			.single();

		if (callerUser?.email?.toLowerCase() === email) {
			return NextResponse.json({ error: 'Nie możesz zaprosić samego siebie' }, { status: 400 });
		}

		// Check if user with this email is already a board member
		const { data: existingUser } = await supabase
			.from('users')
			.select('id')
			.eq('email', email)
			.maybeSingle();

		if (existingUser) {
			const { data: team } = await supabase
				.from('teams')
				.select('id')
				.eq('board_id', boardId)
				.maybeSingle();

			if (team) {
				const { data: existingMember } = await supabase
					.from('team_members')
					.select('id')
					.eq('team_id', team.id)
					.eq('user_id', existingUser.id)
					.maybeSingle();

				if (existingMember) {
					return NextResponse.json({ error: 'Ten użytkownik jest już członkiem tej tablicy' }, { status: 409 });
				}
			}
		}

		// Insert invitation
		const { data: invitation, error: insertError } = await supabase
			.from('board_invitations')
			.insert({
				board_id: boardId,
				email,
				invited_by: session.user.id,
				role: role || 'MEMBER',
			})
			.select('id, token')
			.single();

		if (insertError) {
			if (insertError.code === '23505') {
				return NextResponse.json({ error: 'Zaproszenie dla tego adresu email już zostało wysłane' }, { status: 409 });
			}
			console.error('Invitation insert error:', insertError);
			return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
		}

		// Get inviter name
		const { data: inviter } = await supabase
			.from('users')
			.select('name, custom_name')
			.eq('id', session.user.id)
			.single();

		const inviterName = inviter?.custom_name || inviter?.name || 'Użytkownik';
		const inviteUrl = `${APP_URL}/invite/${invitation.token}`;

		// Send email
		const resend = new Resend(process.env.RESEND_API_KEY);
		const { error: emailError } = await resend.emails.send({
			from: EMAIL_FROM,
			to: email,
			subject: `${inviterName} zaprasza Cię do tablicy "${board.title}"`,
			html: boardInvitationTemplate(board.title, inviterName, inviteUrl),
		});

		if (emailError) {
			console.error('Invitation email error:', emailError);
			// Invitation created but email failed - don't rollback, user can resend
		}

		return NextResponse.json({ success: true, invitation: { id: invitation.id, token: invitation.token } });
	} catch (error) {
		console.error('Send invitation error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
