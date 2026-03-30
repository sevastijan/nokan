import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import type { SlackIntegration } from '@/app/types/slackTypes';

export const slackEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({

  getAppSettings: builder.query<Record<string, string>, void>({
    async queryFn() {
      try {
        const { data, error } = await getSupabase()
          .from('app_settings')
          .select('key, value');
        if (error) throw error;
        const map: Record<string, string> = {};
        (data || []).forEach((row: { key: string; value: string }) => {
          map[row.key] = row.value;
        });
        return { data: map };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    providesTags: [{ type: 'AppSettings' as const, id: 'LIST' }],
  }),

  saveAppSetting: builder.mutation<void, { key: string; value: string }>({
    async queryFn({ key, value }) {
      try {
        const { error } = await getSupabase()
          .from('app_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    invalidatesTags: [{ type: 'AppSettings' as const, id: 'LIST' }],
  }),

  getSlackIntegration: builder.query<SlackIntegration | null, string>({
    async queryFn(boardId) {
      try {
        const { data, error } = await getSupabase()
          .from('slack_integrations')
          .select('*')
          .eq('board_id', boardId)
          .single();
        if (error && error.code === 'PGRST116') return { data: null };
        if (error) throw error;
        return { data: data as SlackIntegration };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    providesTags: (_r, _e, boardId) => [{ type: 'SlackIntegration' as const, id: boardId }],
  }),

  disconnectSlack: builder.mutation<void, string>({
    async queryFn(boardId) {
      try {
        const res = await fetch(`/api/slack/disconnect?boardId=${boardId}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Disconnect failed');
        }
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, boardId) => [{ type: 'SlackIntegration' as const, id: boardId }],
  }),
});
