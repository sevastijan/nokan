import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface ChatChannel {
     id: string;
     name: string;
     description: string | null;
     is_private: boolean;
     is_direct: boolean;
     is_archived?: boolean;
     created_by: string | null;
     created_at: string;
}

interface ChatMemberResponse {
     channel_id: string;
     chat_channels: ChatChannel | null;
}

export interface ChatMessage {
     id: string;
     channel_id: string;
     user_id: string;
     user_name: string;
     user_avatar: string;
     content: string;
     created_at: string;
}

export interface UserProfile {
     id: string;
     name: string;
     image: string | null;
     email: string;
     google_id?: string;
     custom_name?: string;
}

export interface CreateChannelPayload {
     name: string;
     description?: string;
     created_by: string;
     is_private?: boolean;
     is_direct?: boolean;
}

export interface SendMessagePayload {
     channel_id: string;
     user_id: string;
     content: string;
     user_name: string;
     user_avatar: string;
}

export const chatEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     getChatChannels: builder.query<ChatChannel[], string>({
          async queryFn(userId) {
               try {
                    const { data, error } = await getSupabase().from('chat_members').select('channel_id, chat_channels (*)').eq('user_id', userId);

                    if (error) throw error;

                    const channels = (data as unknown as ChatMemberResponse[]).map((item) => item.chat_channels).filter((channel): channel is ChatChannel => channel !== null);

                    return { data: channels };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result) => (result ? [...result.map(({ id }) => ({ type: 'ChatChannels' as const, id })), { type: 'ChatChannels', id: 'LIST' }] : [{ type: 'ChatChannels', id: 'LIST' }]),
     }),

     createChatChannel: builder.mutation<ChatChannel, CreateChannelPayload>({
          async queryFn(payload) {
               try {
                    const { data, error } = await getSupabase().from('chat_channels').insert([payload]).select().single();
                    if (error) throw error;
                    return { data: data as ChatChannel };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: [{ type: 'ChatChannels', id: 'LIST' }],
     }),

     addChatMember: builder.mutation<null, { channel_id: string; user_id: string }>({
          async queryFn(payload) {
               try {
                    const { error } = await getSupabase().from('chat_members').upsert([payload], { onConflict: 'channel_id,user_id' });
                    if (error) throw error;
                    return { data: null };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          // Kluczowe: unieważniamy listę członków dla tego konkretnego kanału
          invalidatesTags: (_result, _error, arg) => [
               { type: 'ChatChannels', id: 'LIST' },
               { type: 'ChatMembers', id: arg.channel_id },
          ],
     }),

     removeChatMember: builder.mutation<null, { channel_id: string; user_id: string }>({
          async queryFn({ channel_id, user_id }) {
               try {
                    const { error } = await getSupabase().from('chat_members').delete().eq('channel_id', channel_id).eq('user_id', user_id);
                    if (error) throw error;
                    return { data: null };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, arg) => [
               { type: 'ChatChannels', id: 'LIST' },
               { type: 'ChatMembers', id: arg.channel_id },
          ],
     }),

     getChatMessages: builder.query<ChatMessage[], string>({
          async queryFn(channelId) {
               try {
                    const { data, error } = await getSupabase().from('chat_messages').select('*').eq('channel_id', channelId).order('created_at', { ascending: true });
                    if (error) throw error;
                    return { data: (data as ChatMessage[]) || [] };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (_result, _error, id) => [{ type: 'ChatMessages' as const, id }],
     }),

     sendChatMessage: builder.mutation<null, SendMessagePayload>({
          async queryFn(payload) {
               try {
                    const { error } = await getSupabase().from('chat_messages').insert([payload]);
                    if (error) throw error;
                    return { data: null };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
     }),

     deleteChatChannel: builder.mutation<null, string>({
          async queryFn(channelId) {
               try {
                    const { error } = await getSupabase().from('chat_channels').delete().eq('id', channelId);
                    if (error) throw error;
                    return { data: null };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: [{ type: 'ChatChannels', id: 'LIST' }],
     }),

     updateChatChannel: builder.mutation<null, { channelId: string; updates: Partial<ChatChannel> }>({
          async queryFn({ channelId, updates }) {
               try {
                    const { error } = await getSupabase().from('chat_channels').update(updates).eq('id', channelId);
                    if (error) throw error;
                    return { data: null };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: [{ type: 'ChatChannels', id: 'LIST' }],
     }),

     searchUsers: builder.query<UserProfile[], string>({
          async queryFn(searchTerm) {
               try {
                    const { data, error } = await getSupabase()
                         .from('users')
                         .select('id, name, image, email, google_id, custom_name')
                         .or(`name.ilike.%${searchTerm}%,custom_name.ilike.%${searchTerm}%`)
                         .limit(10);

                    if (error) throw error;

                    const formattedData = (data as UserProfile[]).map((u) => ({
                         ...u,
                         name: u.custom_name || u.name,
                    }));

                    return { data: formattedData };
               } catch (err) {
                    const error = err as PostgrestError | Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
     }),

     getChatMembers: builder.query<UserProfile[], string>({
          async queryFn(channelId) {
               const supabase = getSupabase();
               try {
                    const { data: memberRows, error: mErr } = await supabase.from('chat_members').select('user_id').eq('channel_id', channelId);
                    if (mErr) throw mErr;
                    if (!memberRows || memberRows.length === 0) return { data: [] };

                    const ids = memberRows.map((r) => r.user_id);
                    const results = await Promise.all(
                         ids.map(async (id) => {
                              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                              const baseQuery = supabase.from('users').select('id, name, image, email, google_id, custom_name');
                              return isUuid ? baseQuery.eq('id', id).maybeSingle() : baseQuery.eq('google_id', id).maybeSingle();
                         }),
                    );

                    const profiles = results
                         .map((r) => r.data as UserProfile | null)
                         .filter((u): u is UserProfile => u !== null)
                         .map((u) => ({
                              ...u,
                              name: u.custom_name || u.name,
                         }));

                    return { data: profiles };
               } catch (err) {
                    return {
                         error: {
                              status: 'CUSTOM_ERROR',
                              error: err instanceof Error ? err.message : 'Unknown error',
                         },
                    };
               }
          },
          providesTags: (_result, _error, id) => [{ type: 'ChatMembers' as const, id }],
     }),
});
