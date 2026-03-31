import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import type { WikiPage } from '@/app/types/wikiTypes';

export const wikiEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({

  getWikiPages: builder.query<WikiPage[], void>({
    async queryFn() {
      try {
        const { data, error } = await getSupabase()
          .from('wiki_pages')
          .select('id, title, icon, parent_id, sort_order, created_by, updated_by, created_at, updated_at')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        return { data: (data || []) as WikiPage[] };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    providesTags: (result) =>
      result
        ? [...result.map((p) => ({ type: 'WikiPage' as const, id: p.id })), { type: 'WikiPage' as const, id: 'LIST' }]
        : [{ type: 'WikiPage' as const, id: 'LIST' }],
  }),

  getWikiPageById: builder.query<WikiPage, string>({
    async queryFn(pageId) {
      try {
        const { data, error } = await getSupabase()
          .from('wiki_pages')
          .select('*')
          .eq('id', pageId)
          .single();
        if (error) throw error;
        return { data: data as WikiPage };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    providesTags: (_r, _e, id) => [{ type: 'WikiPage' as const, id }],
  }),

  createWikiPage: builder.mutation<WikiPage, { title?: string; parent_id?: string | null; icon?: string; created_by?: string }>({
    async queryFn(payload) {
      try {
        // Get max sort_order for siblings
        const siblingQuery = payload.parent_id
          ? getSupabase().from('wiki_pages').select('sort_order').eq('parent_id', payload.parent_id)
          : getSupabase().from('wiki_pages').select('sort_order').is('parent_id', null);
        const { data: siblings } = await siblingQuery.order('sort_order', { ascending: false }).limit(1);
        const nextOrder = ((siblings?.[0]?.sort_order as number) ?? -1) + 1;

        const { data, error } = await getSupabase()
          .from('wiki_pages')
          .insert({ ...payload, sort_order: nextOrder })
          .select('*')
          .single();
        if (error) throw error;
        return { data: data as WikiPage };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    invalidatesTags: [{ type: 'WikiPage', id: 'LIST' }],
  }),

  updateWikiPage: builder.mutation<WikiPage, { id: string; data: Partial<WikiPage> }>({
    async queryFn({ id, data: payload }) {
      try {
        const { data, error } = await getSupabase()
          .from('wiki_pages')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return { data: data as WikiPage };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { id }) => [{ type: 'WikiPage', id }, { type: 'WikiPage', id: 'LIST' }],
  }),

  deleteWikiPage: builder.mutation<void, string>({
    async queryFn(id) {
      try {
        const { error } = await getSupabase().from('wiki_pages').delete().eq('id', id);
        if (error) throw error;
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    invalidatesTags: [{ type: 'WikiPage', id: 'LIST' }],
  }),

  reorderWikiPages: builder.mutation<void, { pages: { id: string; parent_id: string | null; sort_order: number }[] }>({
    async queryFn({ pages }) {
      try {
        for (const page of pages) {
          await getSupabase()
            .from('wiki_pages')
            .update({ parent_id: page.parent_id, sort_order: page.sort_order })
            .eq('id', page.id);
        }
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR' as const, error: (err as Error).message } };
      }
    },
    invalidatesTags: [{ type: 'WikiPage', id: 'LIST' }],
  }),
});
