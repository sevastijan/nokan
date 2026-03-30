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
  let boardId: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Decode state to extract boardId
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        boardId = decoded.boardId || null;
      } catch {
        // Invalid state
      }
    }

    if (!code || !boardId) {
      return NextResponse.redirect(`${APP_URL}/dashboard?slack=error`);
    }

    const supabase = getServiceSupabase();

    // Read Slack credentials from app settings
    const [clientIdResult, clientSecretResult] = await Promise.all([
      supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'slack_client_id')
        .single(),
      supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'slack_client_secret')
        .single(),
    ]);

    const clientId = clientIdResult.data?.value;
    const clientSecret = clientSecretResult.data?.value;

    if (!clientId || !clientSecret) {
      console.error('[slack/callback] Missing Slack credentials in app_settings');
      return NextResponse.redirect(`${APP_URL}/board/${boardId}?slack=error`);
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${APP_URL}/api/slack/callback`,
      }),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      console.error('[slack/callback] OAuth error:', data.error);
      return NextResponse.redirect(`${APP_URL}/board/${boardId}?slack=error`);
    }

    // Get session for created_by
    const session = await getServerSession(authOptions);
    let createdBy: string | null = null;

    if (session?.user?.email) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      createdBy = user?.id || null;
    }

    // Upsert Slack integration
    const { error: upsertError } = await supabase
      .from('slack_integrations')
      .upsert(
        {
          board_id: boardId,
          channel_id: data.incoming_webhook?.channel_id || 'pending',
          channel_name: data.incoming_webhook?.channel || null,
          workspace_name: data.team?.name || null,
          team_id: data.team?.id || null,
          access_token: data.access_token,
          active: true,
          ...(createdBy ? { created_by: createdBy } : {}),
        },
        { onConflict: 'board_id' },
      );

    if (upsertError) {
      console.error('[slack/callback] upsert error:', upsertError);
      return NextResponse.redirect(`${APP_URL}/board/${boardId}?slack=error`);
    }

    return NextResponse.redirect(`${APP_URL}/board/${boardId}?slack=connected`);
  } catch (error) {
    console.error('[slack/callback] error:', error);
    const redirectPath = boardId ? `/board/${boardId}?slack=error` : '/dashboard?slack=error';
    return NextResponse.redirect(`${APP_URL}${redirectPath}`);
  }
}
