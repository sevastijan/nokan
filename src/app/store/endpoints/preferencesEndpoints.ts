import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import type { NotificationPreferences, NotificationPreferencesInput } from '@/app/types/emailTypes';

const defaultPreferences: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
     email_task_assigned: true,
     email_task_unassigned: true,
     email_status_changed: true,
     email_priority_changed: true,
     email_new_comment: true,
     email_due_date_changed: true,
     email_collaborator_added: true,
     email_collaborator_removed: true,
     email_mention: true,
     email_new_submission: true,
};

export const preferencesEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     getNotificationPreferences: builder.query<NotificationPreferences, string>({
          async queryFn(userId) {
               try {
                    const { data, error } = await getSupabase()
                         .from('notification_preferences')
                         .select('*')
                         .eq('user_id', userId)
                         .single();

                    if (error && error.code !== 'PGRST116') {
                         throw error;
                    }

                    if (data) {
                         return { data };
                    }

                    // Create default preferences if none exist
                    const { data: newPrefs, error: insertError } = await getSupabase()
                         .from('notification_preferences')
                         .insert({
                              user_id: userId,
                              ...defaultPreferences,
                         })
                         .select()
                         .single();

                    if (insertError) {
                         // Return virtual defaults if insert fails
                         return {
                              data: {
                                   id: 'default',
                                   user_id: userId,
                                   ...defaultPreferences,
                                   created_at: new Date().toISOString(),
                                   updated_at: new Date().toISOString(),
                              } as NotificationPreferences,
                         };
                    }

                    return { data: newPrefs };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (_result, _error, userId) => [{ type: 'NotificationPreferences' as const, id: userId }],
     }),

     updateNotificationPreferences: builder.mutation<
          NotificationPreferences,
          { userId: string; preferences: NotificationPreferencesInput }
     >({
          async queryFn({ userId, preferences }) {
               try {
                    const { data, error } = await getSupabase()
                         .from('notification_preferences')
                         .upsert(
                              {
                                   user_id: userId,
                                   ...preferences,
                                   updated_at: new Date().toISOString(),
                              },
                              { onConflict: 'user_id' }
                         )
                         .select()
                         .single();

                    if (error) throw error;
                    return { data };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { userId }) => [{ type: 'NotificationPreferences' as const, id: userId }],
     }),
});
