import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { TaskSnapshot } from '@/app/types/globalTypes';

const SNAPSHOTABLE_FIELDS = [
     'title',
     'description',
     'column_id',
     'priority',
     'user_id',
     'status_id',
     'start_date',
     'end_date',
     'due_date',
     'completed',
     'type',
     'parent_id',
] as const;

function pickSnapshotFields(task: Record<string, unknown>): Record<string, unknown> {
     const snapshot: Record<string, unknown> = {};
     for (const field of SNAPSHOTABLE_FIELDS) {
          if (field in task) {
               snapshot[field] = task[field];
          }
     }
     return snapshot;
}

function diffFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
     const changed: string[] = [];
     for (const field of SNAPSHOTABLE_FIELDS) {
          const a = before[field] ?? null;
          const b = after[field] ?? null;
          if (JSON.stringify(a) !== JSON.stringify(b)) {
               changed.push(field);
          }
     }
     return changed;
}

export { SNAPSHOTABLE_FIELDS, pickSnapshotFields, diffFields };

export const taskSnapshotEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     getTaskSnapshots: builder.query<TaskSnapshot[], string>({
          async queryFn(taskId) {
               try {
                    const { data, error } = await getSupabase()
                         .from('task_snapshots')
                         .select(
                              `
                              id,
                              task_id,
                              version,
                              changed_by,
                              snapshot,
                              changed_fields,
                              created_at,
                              user:users(
                                   id, name, email, image, custom_name, custom_image
                              )
                         `,
                         )
                         .eq('task_id', taskId)
                         .order('version', { ascending: false });

                    if (error) throw error;

                    const snapshots: TaskSnapshot[] = (data || []).map((row: Record<string, unknown>) => {
                         const userRaw = row.user as Record<string, unknown> | Record<string, unknown>[] | null;
                         let changedByUser: TaskSnapshot['changed_by_user'] = null;

                         if (Array.isArray(userRaw) && userRaw.length > 0) {
                              const u = userRaw[0];
                              changedByUser = {
                                   id: u.id as string,
                                   name: u.name as string,
                                   email: u.email as string,
                                   image: u.image as string | null,
                                   custom_name: u.custom_name as string | null,
                                   custom_image: u.custom_image as string | null,
                              };
                         } else if (userRaw && !Array.isArray(userRaw)) {
                              changedByUser = {
                                   id: userRaw.id as string,
                                   name: userRaw.name as string,
                                   email: userRaw.email as string,
                                   image: userRaw.image as string | null,
                                   custom_name: userRaw.custom_name as string | null,
                                   custom_image: userRaw.custom_image as string | null,
                              };
                         }

                         return {
                              id: row.id as string,
                              task_id: row.task_id as string,
                              version: row.version as number,
                              changed_by: row.changed_by as string | null,
                              changed_by_user: changedByUser,
                              snapshot: row.snapshot as Record<string, unknown>,
                              changed_fields: row.changed_fields as string[],
                              created_at: row.created_at as string,
                         };
                    });

                    return { data: snapshots };
               } catch (err) {
                    const error = err as Error;
                    console.error('[getTaskSnapshots] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (_result, _error, taskId) => [{ type: 'TaskSnapshot', id: taskId }],
     }),

     restoreTaskSnapshot: builder.mutation<
          { success: boolean },
          { taskId: string; snapshotId: string; userId?: string }
     >({
          async queryFn({ taskId, snapshotId, userId }) {
               try {
                    // 1. Read the snapshot to restore
                    const { data: snapshotRow, error: fetchErr } = await getSupabase()
                         .from('task_snapshots')
                         .select('snapshot, version')
                         .eq('id', snapshotId)
                         .single();

                    if (fetchErr || !snapshotRow) throw fetchErr || new Error('Snapshot not found');

                    const snapshotData = snapshotRow.snapshot as Record<string, unknown>;

                    // 2. Get current task state before restore
                    const { data: currentTask, error: currentErr } = await getSupabase()
                         .from('tasks')
                         .select('*')
                         .eq('id', taskId)
                         .single();

                    if (currentErr || !currentTask) throw currentErr || new Error('Task not found');

                    const beforeSnapshot = pickSnapshotFields(currentTask as Record<string, unknown>);

                    // 3. Build update payload from snapshot (only snapshotable fields)
                    const updatePayload: Record<string, unknown> = {};
                    for (const field of SNAPSHOTABLE_FIELDS) {
                         if (field in snapshotData) {
                              updatePayload[field] = snapshotData[field];
                         }
                    }

                    // 4. Apply the restore
                    const { error: updateErr } = await getSupabase()
                         .from('tasks')
                         .update(updatePayload)
                         .eq('id', taskId);

                    if (updateErr) throw updateErr;

                    // 5. Create a new snapshot marking the restore
                    const { data: maxVersionRow } = await getSupabase()
                         .from('task_snapshots')
                         .select('version')
                         .eq('task_id', taskId)
                         .order('version', { ascending: false })
                         .limit(1)
                         .single();

                    const nextVersion = (maxVersionRow?.version ?? 0) + 1;

                    await getSupabase().from('task_snapshots').insert({
                         task_id: taskId,
                         version: nextVersion,
                         changed_by: userId || null,
                         snapshot: beforeSnapshot,
                         changed_fields: ['restored'],
                    });

                    return { data: { success: true } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[restoreTaskSnapshot] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { taskId }) => [
               { type: 'TaskSnapshot', id: taskId },
               { type: 'Task', id: taskId },
          ],
     }),
});
