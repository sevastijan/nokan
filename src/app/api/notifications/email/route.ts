import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { sendEmailNotification } from '@/app/lib/email/emailService';
import type { EmailNotificationType } from '@/app/types/emailTypes';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface EmailRequestBody {
     type: EmailNotificationType;
     taskId: string;
     taskTitle: string;
     boardId: string;
     boardName?: string;
     recipientId: string;
     metadata?: {
          oldStatus?: string;
          newStatus?: string;
          commenterName?: string;
          commentPreview?: string;
          newDueDate?: string;
          oldPriority?: string;
          newPriority?: string;
          assignerName?: string;
          unassignerName?: string;
     };
}

const preferenceKeyMap: Record<EmailNotificationType, string> = {
     task_assigned: 'email_task_assigned',
     task_unassigned: 'email_task_unassigned',
     status_changed: 'email_status_changed',
     priority_changed: 'email_priority_changed',
     new_comment: 'email_new_comment',
     due_date_changed: 'email_due_date_changed',
};

export async function POST(request: NextRequest) {
     try {
          const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

          if (!token?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const body: EmailRequestBody = await request.json();
          const { type, taskId, taskTitle, boardId, boardName, recipientId, metadata } = body;

          if (!type || !taskId || !taskTitle || !boardId || !recipientId) {
               return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
          }

          // Get recipient's email and preferences
          const { data: recipient, error: userError } = await supabase.from('users').select('id, email, name').eq('id', recipientId).single();

          if (userError || !recipient) {
               return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
          }

          // Check notification preferences
          const { data: preferences } = await supabase.from('notification_preferences').select('*').eq('user_id', recipientId).single();

          // If no preferences exist, default to all enabled
          const preferenceKey = preferenceKeyMap[type];
          const isEnabled = preferences ? preferences[preferenceKey] !== false : true;

          if (!isEnabled) {
               return NextResponse.json({
                    success: true,
                    skipped: true,
                    reason: 'User has disabled this notification type',
               });
          }

          // Don't send email to yourself
          if (recipient.email === token.email) {
               return NextResponse.json({
                    success: true,
                    skipped: true,
                    reason: 'Cannot send notification to yourself',
               });
          }

          // Send email
          const result = await sendEmailNotification({
               type,
               taskId,
               taskTitle,
               boardId,
               boardName,
               recipientId,
               recipientEmail: recipient.email,
               metadata,
          });

          if (!result.success) {
               return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
          }

          return NextResponse.json({ success: true });
     } catch (error) {
          console.error('Email notification error:', error);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
