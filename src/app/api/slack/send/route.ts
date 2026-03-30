import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { buildSlackMessage } from '@/app/lib/slack/messageBuilder';
import type { SlackChangeType } from '@/app/types/slackTypes';

export const dynamic = 'force-dynamic';

function getServiceSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!);
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { boardId, taskId, taskTitle, changeType, changedBy, details } = body as {
      boardId: string;
      taskId: string;
      taskTitle: string;
      changeType: SlackChangeType;
      changedBy: string;
      details?: string;
    };

    if (!boardId || !taskId || !taskTitle || !changeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if board has active Slack integration
    const { data: integration } = await supabase
      .from('slack_integrations')
      .select('*')
      .eq('board_id', boardId)
      .eq('active', true)
      .single();

    if (!integration) {
      return NextResponse.json({ success: true, skipped: true, reason: 'no_integration' });
    }

    // Get board name
    const { data: board } = await supabase
      .from('boards')
      .select('title')
      .eq('id', boardId)
      .single();

    // Resolve changedBy UUID to display name
    let displayName = changedBy;
    if (changedBy && changedBy.length > 10) {
      const { data: user } = await supabase
        .from('users')
        .select('name, custom_name')
        .eq('id', changedBy)
        .single();
      if (user) {
        displayName = user.custom_name || user.name || 'Ktoś';
      }
    }

    const taskUrl = `https://nokan.nkdlab.space/board/${boardId}?task=${taskId}`;
    const message = buildSlackMessage({
      taskTitle,
      taskUrl,
      changeType,
      changedBy: displayName,
      boardName: board?.title || 'Board',
      details,
    });

    // Send to Slack
    const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: integration.channel_id,
        ...message,
      }),
    });

    const slackResult = await slackResponse.json();

    // Handle token revocation
    if (!slackResult.ok && (slackResult.error === 'token_revoked' || slackResult.error === 'invalid_auth' || slackResult.error === 'account_inactive')) {
      await supabase
        .from('slack_integrations')
        .update({ active: false })
        .eq('id', integration.id);
      return NextResponse.json({ success: false, deactivated: true });
    }

    return NextResponse.json({ success: slackResult.ok });
  } catch (error) {
    console.error('[slack/send] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
