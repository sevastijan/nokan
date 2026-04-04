import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const boardId = searchParams.get('boardId');

		if (!boardId) {
			return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
		}

		const supabase = getSupabaseAdmin();

		const { data, error } = await supabase
			.from('board_invitations')
			.select('*')
			.eq('board_id', boardId)
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Fetch invitations error:', error);
			return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
		}

		return NextResponse.json(data ?? []);
	} catch (error) {
		console.error('Get board invitations error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const invitationId = searchParams.get('invitationId');

		if (!invitationId) {
			return NextResponse.json({ error: 'invitationId is required' }, { status: 400 });
		}

		const supabase = getSupabaseAdmin();

		const { error } = await supabase
			.from('board_invitations')
			.update({ status: 'expired' })
			.eq('id', invitationId);

		if (error) {
			console.error('Cancel invitation error:', error);
			return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Cancel invitation error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
