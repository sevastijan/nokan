import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { Resend } from 'resend';
import { boardInvitationTemplate, htmlToPlainText } from '@/app/lib/email/templates';

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const PRODUCTION_URL = 'https://nokan.nkdlab.space';

// Invitation links are opened by someone else, so a localhost URL from a dev
// environment would be dead on arrival - only accept a public app URL here.
const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const APP_URL = configuredAppUrl && !configuredAppUrl.includes('localhost') ? configuredAppUrl : PRODUCTION_URL;

export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
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

		// Resolve caller's Supabase user ID from session email
		const { data: callerUser, error: callerError } = await supabase
			.from('users')
			.select('id, email, name, custom_name')
			.eq('email', session.user.email)
			.single();

		if (callerError || !callerUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 401 });
		}

		const callerId = callerUser.id;

		// Self-invite check
		if (callerUser.email.toLowerCase() === email) {
			return NextResponse.json({ error: 'Nie możesz zaprosić samego siebie' }, { status: 400 });
		}

		// Verify board exists
		const { data: board, error: boardError } = await supabase
			.from('boards')
			.select('id, title, user_id')
			.eq('id', boardId)
			.single();

		if (boardError || !board) {
			return NextResponse.json({ error: 'Board not found' }, { status: 404 });
		}

		// Check caller is owner or team member
		const isOwner = board.user_id === callerId;
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
					.eq('user_id', callerId)
					.maybeSingle();

				if (!membership) {
					return NextResponse.json({ error: 'No permission to invite to this board' }, { status: 403 });
				}
			} else {
				return NextResponse.json({ error: 'No permission to invite to this board' }, { status: 403 });
			}
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
				invited_by: callerId,
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

		const inviterName = callerUser.custom_name || callerUser.name || 'Użytkownik';
		const inviteUrl = `${APP_URL}/invite/${invitation.token}`;

		// Send email. A text part and a Reply-To pointing at a real person both
		// lower the spam score - invitations go to recipients who have never
		// received mail from this domain before.
		const html = boardInvitationTemplate(board.title, inviterName, inviteUrl);
		const resend = new Resend(process.env.RESEND_API_KEY);
		const { error: emailError } = await resend.emails.send({
			from: EMAIL_FROM,
			to: email,
			replyTo: callerUser.email,
			subject: `${inviterName} zaprasza Cię do tablicy "${board.title}"`,
			html,
			text: htmlToPlainText(html),
		});

		if (emailError) {
			console.error('Invitation email error:', emailError);
		}

		// The invitation exists either way, so this is not a failure - but the caller
		// must know the email did not go out, otherwise a silent "sent" toast hides
		// every delivery problem. The link is returned so it can be shared manually.
		return NextResponse.json({
			success: true,
			emailSent: !emailError,
			emailError: emailError ? emailError.message : undefined,
			inviteUrl,
			invitation: { id: invitation.id, token: invitation.token },
		});
	} catch (error) {
		console.error('Send invitation error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
