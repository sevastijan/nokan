import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';

interface Notification {
     id: string;
     user_id: string;
     type: string;
     task_id?: string;
     board_id?: string;
     message: string;
     read: boolean;
     created_at: string;
}

export const notificationEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     addNotification: builder.mutation<
          Notification,
          {
               user_id: string;
               type: string;
               task_id?: string;
               board_id?: string;
               message: string;
          }
     >({
          async queryFn(payload) {
               try {
                    const { data, error } = await getSupabase()
                         .from('notifications')
                         .insert({ ...payload, read: false })
                         .select('*')
                         .single();
                    if (error || !data) throw error || new Error('Add notification failed');
                    return { data };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { user_id }) => [{ type: 'Notification', id: user_id }],
     }),

     getNotifications: builder.query<Notification[], string>({
          async queryFn(userId) {
               try {
                    const { data, error } = await getSupabase().from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
                    if (error) throw error;
                    return { data: data || [] };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result, _error, userId) => (result ? [{ type: 'Notification', id: userId }] : []),
     }),

     deleteNotification: builder.mutation<{ id: string }, { id: string }>({
          async queryFn({ id }) {
               try {
                    const { error } = await getSupabase().from('notifications').delete().eq('id', id);
                    if (error) throw error;
                    return { data: { id } };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { id }) => [{ type: 'Notification', id }],
     }),

     markNotificationRead: builder.mutation<{ id: string }, { id: string }>({
          async queryFn({ id }) {
               try {
                    const { error } = await getSupabase().from('notifications').update({ read: true }).eq('id', id);
                    if (error) throw error;
                    return { data: { id } };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { id }) => [{ type: 'Notification', id }],
     }),
});
