import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { supabase } from '@/app/lib/supabase';
import { Board } from '@/app/types/globalTypes';

interface TemplateColumn {
     title: string;
     order: number;
     tasks: { title: string; description?: string | null }[];
}

interface Template {
     id: string;
     name: string;
     description?: string | null;
     created_at?: string;
}

interface TemplateColumnData {
     id: string;
     title: string;
     order: number;
     template_id: string;
}

interface TemplateTask {
     id: string;
     title: string;
     description?: string | null;
     priority?: string | null;
     template_id: string;
     column_id: string;
     sort_order?: number;
}

interface BoardColumnData {
     id: string;
     title: string;
     order: number;
     board_id: string;
}

export const templateEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     addBoardTemplate: builder.mutation<
          Template & { template_columns: (TemplateColumnData & { tasks: { title: string; description?: string | null }[] })[] },
          {
               name: string;
               description?: string | null;
               columns: TemplateColumn[];
          }
     >({
          async queryFn({ name, description, columns }) {
               try {
                    const { data: template, error: templateErr } = await supabase.from('board_templates').insert({ name, description }).select('*').single();
                    if (templateErr || !template) throw templateErr || new Error('Template creation failed');
                    const templateId = template.id;

                    const columnsToInsert = columns.map((col, idx) => ({
                         title: col.title,
                         order: col.order ?? idx,
                         template_id: templateId,
                    }));
                    const { data: insertedCols, error: colsErr } = await supabase.from('template_columns').insert(columnsToInsert).select('*');
                    if (colsErr || !insertedCols) throw colsErr || new Error('Columns creation failed');

                    const templateTasksToInsert = (insertedCols as TemplateColumnData[]).flatMap((col, colIdx) =>
                         (columns[colIdx].tasks || []).map((task, tIdx) => ({
                              title: task.title,
                              description: task.description || null,
                              template_id: templateId,
                              column_id: col.id,
                              sort_order: tIdx,
                         })),
                    );
                    if (templateTasksToInsert.length > 0) {
                         const { error: tasksErr } = await supabase.from('template_tasks').insert(templateTasksToInsert);
                         if (tasksErr) throw tasksErr;
                    }

                    return {
                         data: {
                              ...template,
                              template_columns: (insertedCols as TemplateColumnData[]).map((col, idx) => ({
                                   ...col,
                                   tasks: columns[idx]?.tasks || [], // Use input tasks (no IDs)
                              })),
                         },
                    };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: () => [{ type: 'Board', id: 'TEMPLATE-LIST' }],
     }),

     createBoardFromTemplate: builder.mutation<Board, { title: string; templateId: string; user_id: string }>({
          async queryFn({ title, templateId, user_id }) {
               try {
                    const { data: newBoard, error: boardErr } = await supabase.from('boards').insert({ title, user_id }).select('*').single();
                    if (boardErr || !newBoard) throw boardErr || new Error('Failed to create board');
                    const boardId = newBoard.id;

                    const { data: templateCols, error: templateColsErr } = await supabase.from('template_columns').select('*').eq('template_id', templateId).order('order', { ascending: true });
                    if (templateColsErr) throw templateColsErr;
                    if (!templateCols || templateCols.length === 0) throw new Error('No columns found for this template');

                    const columnsToInsert = (templateCols as TemplateColumnData[]).map((col, idx) => ({
                         title: col.title,
                         order: col.order ?? idx,
                         board_id: boardId,
                    }));
                    const { data: insertedColumns, error: columnsErr } = await supabase.from('columns').insert(columnsToInsert).select('*');
                    if (columnsErr || !insertedColumns) throw columnsErr || new Error('Failed to create columns');

                    const templateIdToColumnId: Record<string, string> = {};
                    (templateCols as TemplateColumnData[]).forEach((tc, i) => {
                         templateIdToColumnId[tc.id] = (insertedColumns as BoardColumnData[])[i].id;
                    });

                    const { data: templateTasks, error: tasksErr } = await supabase.from('template_tasks').select('*').eq('template_id', templateId).order('sort_order', { ascending: true });
                    if (tasksErr) throw tasksErr;

                    if (templateTasks && templateTasks.length > 0) {
                         const tasksToInsert = (templateTasks as TemplateTask[]).map((task) => ({
                              title: task.title,
                              description: task.description,
                              priority: task.priority ?? null,
                              board_id: boardId,
                              column_id: templateIdToColumnId[task.column_id],
                              sort_order: task.sort_order ?? 0,
                              completed: false,
                         }));
                         const { error: insertTasksErr } = await supabase.from('tasks').insert(tasksToInsert);
                         if (insertTasksErr) throw insertTasksErr;
                    }

                    let ownerName, ownerEmail;
                    try {
                         const { data: userData } = await supabase.from('users').select('name,email').eq('id', user_id).single();
                         if (userData) {
                              ownerName = userData.name;
                              ownerEmail = userData.email;
                         }
                    } catch {}

                    const resultBoard: Board = {
                         id: newBoard.id,
                         title: newBoard.title,
                         user_id: newBoard.user_id,
                         ownerName,
                         ownerEmail,
                         columns: (insertedColumns as BoardColumnData[]).map((c) => ({
                              id: c.id,
                              boardId: boardId,
                              title: c.title,
                              order: c.order,
                              tasks: [],
                         })),
                         created_at: newBoard.created_at,
                         updated_at: newBoard.updated_at,
                    };

                    return { data: resultBoard };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.createBoardFromTemplate] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: () => [{ type: 'Board', id: 'LIST' }],
     }),
});
