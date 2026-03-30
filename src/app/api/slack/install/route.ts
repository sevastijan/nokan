import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nokan.nkdlab.space';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    if (!boardId) {
      return NextResponse.json({ error: 'Missing boardId' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check user role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Read Slack client ID from app settings
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'slack_client_id')
      .single();

    if (!setting?.value) {
      return NextResponse.json(
        { error: 'Slack App not configured' },
        { status: 500 },
      );
    }

    const clientId = setting.value;
    const state = Buffer.from(JSON.stringify({ boardId })).toString('base64');
    const redirectUri = encodeURIComponent(`${APP_URL}/api/slack/callback`);

    const slackUrl =
      `https://slack.com/oauth/v2/authorize` +
      `?client_id=${clientId}` +
      `&scope=chat:write,channels:read,groups:read,incoming-webhook` +
      `&redirect_uri=${redirectUri}` +
      `&state=${state}`;

    return NextResponse.redirect(slackUrl);
  } catch (error) {
    console.error('[slack/install] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
