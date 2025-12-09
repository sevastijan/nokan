import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '../../auth/[...nextauth]/route';

const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const defaultPreferences = {
     email_task_assigned: true,
     email_status_changed: true,
     email_new_comment: true,
     email_due_date_changed: true,
};

export async function GET() {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.id) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const { data, error } = await supabase
               .from('notification_preferences')
               .select('*')
               .eq('user_id', session.user.id)
               .single();

          if (error && error.code !== 'PGRST116') {
               // PGRST116 = no rows found
               return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          // Return existing preferences or defaults
          if (data) {
               return NextResponse.json(data);
          }

          // Create default preferences for new user
          const { data: newPrefs, error: insertError } = await supabase
               .from('notification_preferences')
               .insert({
                    user_id: session.user.id,
                    ...defaultPreferences,
               })
               .select()
               .single();

          if (insertError) {
               // Return defaults if insert fails (maybe table doesn't exist yet)
               return NextResponse.json({
                    user_id: session.user.id,
                    ...defaultPreferences,
               });
          }

          return NextResponse.json(newPrefs);
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

export async function PUT(request: NextRequest) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.id) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const body = await request.json();
          const allowedFields = [
               'email_task_assigned',
               'email_status_changed',
               'email_new_comment',
               'email_due_date_changed',
          ];

          // Filter only allowed fields
          const updates: Record<string, boolean> = {};
          for (const field of allowedFields) {
               if (typeof body[field] === 'boolean') {
                    updates[field] = body[field];
               }
          }

          if (Object.keys(updates).length === 0) {
               return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
          }

          // Upsert preferences
          const { data, error } = await supabase
               .from('notification_preferences')
               .upsert(
                    {
                         user_id: session.user.id,
                         ...updates,
                         updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
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
