import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { supabase } from '@/app/lib/supabase';
import { Column } from '@/app/types/globalTypes';

export const columnEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     addColumn: builder.mutation<Column, { board_id: string; title: string; order: number }>({
          async queryFn({ board_id, title, order }) {
               try {
                    const { data, error } = await supabase.from('columns').insert({ board_id, title, order }).select('*').single();
                    if (error || !data) throw error || new Error('Add column failed');
                    const mapped: Column = {
                         id: data.id,
                         boardId: data.board_id,
                         title: data.title,
                         order: data.order,
                         tasks: [],
                    };
                    return { data: mapped };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.addColumn] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { board_id }) => [{ type: 'Board', id: board_id }],
     }),

     removeColumn: builder.mutation<{ id: string }, { columnId: string }>({
          async queryFn({ columnId }) {
               try {
                    await supabase.from('tasks').delete().eq('column_id', columnId);
                    const { error } = await supabase.from('columns').delete().eq('id', columnId);
                    if (error) throw error;
                    return { data: { id: columnId } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.removeColumn] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { columnId }) => [{ type: 'Column', id: columnId }],
     }),

     updateColumnOrder: builder.mutation<{ id: string; order: number }, { columnId: string; order: number }>({
          async queryFn({ columnId, order }) {
               try {
                    const { data, error } = await supabase.from('columns').update({ order }).eq('id', columnId).select('id, order').single();
                    if (error || !data) throw error || new Error('Update column order failed');
                    return { data };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.updateColumnOrder] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { columnId }) => [
               { type: 'Column', id: columnId },
               { type: 'Board', id: 'LIST' },
          ],
     }),

     updateColumnTitle: builder.mutation<{ id: string; title: string }, { columnId: string; title: string }>({
          async queryFn({ columnId, title }) {
               try {
                    const { error } = await supabase.from('columns').update({ title }).eq('id', columnId);
                    if (error) throw error;
                    return { data: { id: columnId, title } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.updateColumnTitle] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { columnId }) => [{ type: 'Column', id: columnId }],
     }),
});
