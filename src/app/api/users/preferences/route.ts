import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authOptions } from '@/app/lib/auth';

const defaultPreferences = {
     email_task_assigned: true,
     email_status_changed: true,
     email_new_comment: true,
     email_due_date_changed: true,
};

/**
 * GET: Retrieve user's notification preferences.
 * Returns existing preferences or creates and returns defaults for new users.
 */
export async function GET() {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const supabase = getSupabaseAdmin();

          // Resolve internal user ID from email
          const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single();

          if (!user) {
               return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }

          const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).single();

          if (error && error.code !== 'PGRST116') {
               return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          // If preferences exist, return them
          if (data) {
               return NextResponse.json(data);
          }

          // Create default preferences for new user
          const { data: newPrefs, error: insertError } = await supabase
               .from('notification_preferences')
               .insert({
                    user_id: user.id,
                    ...defaultPreferences,
               })
               .select()
               .single();

          if (insertError) {
               // Fallback: return defaults if insertion fails
               return NextResponse.json({
                    user_id: user.id,
                    ...defaultPreferences,
               });
          }

          return NextResponse.json(newPrefs);
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * PUT: Update user's notification preferences.
 * Only allowed boolean fields are updated via upsert.
 */
export async function PUT(request: NextRequest) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const body = await request.json();
          const allowedFields = ['email_task_assigned', 'email_status_changed', 'email_new_comment', 'email_due_date_changed'];

          const updates: Record<string, boolean> = {};
          for (const field of allowedFields) {
               if (typeof body[field] === 'boolean') {
                    updates[field] = body[field];
               }
          }

          if (Object.keys(updates).length === 0) {
               return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
          }

          const supabase = getSupabaseAdmin();

          // Resolve internal user ID from email
          const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single();

          if (!user) {
               return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }

          const { data, error } = await supabase
               .from('notification_preferences')
               .upsert(
                    {
                         user_id: user.id,
                         ...updates,
                         updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' },
               )
               .select()
               .single();

          if (error) {
               console.error('Preferences update error:', error);
               return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
          }

          return NextResponse.json(data);
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
