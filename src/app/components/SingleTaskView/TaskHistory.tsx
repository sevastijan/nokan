'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiChevronDown, FiChevronUp, FiRotateCcw } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';
import { useGetTaskSnapshotsQuery, useRestoreTaskSnapshotMutation } from '@/app/store/apiSlice';
import { Column, TaskSnapshot } from '@/app/types/globalTypes';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

const FIELD_LABELS: Record<string, string> = {
     title: 'Tytuł',
     description: 'Opis',
     column_id: 'Kolumna',
     priority: 'Priorytet',
     user_id: 'Przypisany',
     status_id: 'Status',
     start_date: 'Data rozpoczęcia',
     end_date: 'Data zakończenia',
     due_date: 'Termin',
     completed: 'Ukończone',
     type: 'Typ',
     parent_id: 'Nadrzędne zadanie',
     restored: 'Przywrócono',
};

interface TaskHistoryProps {
     taskId: string;
     columns?: Column[];
     onRestore?: () => void;
}

function formatFieldValue(field: string, value: unknown, columns?: Column[]): string {
     if (value === null || value === undefined) return '—';

     if (field === 'completed') return value ? 'Tak' : 'Nie';
     if (field === 'type') return value === 'story' ? 'Story' : 'Task';
     if (field === 'column_id' && columns) {
          const col = columns.find((c) => c.id === value);
          return col?.title || String(value);
     }
     if (field === 'description') {
          const str = String(value);
          if (str.length > 80) return str.substring(0, 80) + '...';
          return str || '(pusty)';
     }
     if (field.includes('date') && value) {
          try {
               return new Date(String(value)).toLocaleDateString('pl-PL');
          } catch {
               return String(value);
          }
     }

     return String(value);
}

function SnapshotEntry({
     snapshot,
     columns,
     onRestore,
}: {
     snapshot: TaskSnapshot;
     columns?: Column[];
     onRestore: (snapshotId: string, version: number) => void;
}) {
     const [expanded, setExpanded] = useState(false);
     const isRestoreEntry = snapshot.changed_fields.includes('restored');

     const user = snapshot.changed_by_user;
     const displayName = user?.custom_name || user?.name || 'System';
     const avatarUrl = user?.custom_image || user?.image;

     const changeSummary = useMemo(() => {
          if (isRestoreEntry) return 'Przywrócono poprzednią wersję';
          return snapshot.changed_fields.map((f) => FIELD_LABELS[f] || f).join(', ');
     }, [snapshot.changed_fields, isRestoreEntry]);

     const timeAgo = useMemo(() => {
          try {
               return formatDistanceToNow(new Date(snapshot.created_at), { addSuffix: true, locale: pl });
          } catch {
               return snapshot.created_at;
          }
     }, [snapshot.created_at]);

     return (
          <div className="bg-slate-800/60 rounded-lg border border-slate-700/40 overflow-hidden">
               <div className="flex items-center gap-3 p-3">
                    {/* Avatar */}
                    <div className="shrink-0">
                         {avatarUrl ? (
                              <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
                         ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-300">
                                   {displayName.charAt(0).toUpperCase()}
                              </div>
                         )}
                    </div>

                    {/* Change info */}
                    <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-200 truncate">{displayName}</span>
                              <span className="text-xs text-slate-500">v{snapshot.version}</span>
                         </div>
                         <p className="text-xs text-slate-400 truncate">
                              {isRestoreEntry ? (
                                   <span className="text-amber-400">{changeSummary}</span>
                              ) : (
                                   <>
                                        Zmieniono: <span className="text-slate-300">{changeSummary}</span>
                                   </>
                              )}
                         </p>
                    </div>

                    {/* Time & actions */}
                    <div className="flex items-center gap-2 shrink-0">
                         <span className="text-xs text-slate-500 hidden sm:inline">{timeAgo}</span>

                         {!isRestoreEntry && (
                              <>
                                   <button
                                        onClick={() => setExpanded(!expanded)}
                                        className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                                        title={expanded ? 'Zwiń' : 'Rozwiń szczegóły'}
                                   >
                                        {expanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                                   </button>

                                   <button
                                        onClick={() => onRestore(snapshot.id, snapshot.version)}
                                        className="p-1 rounded hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                                        title="Przywróć tę wersję"
                                   >
                                        <FiRotateCcw className="w-3.5 h-3.5" />
                                   </button>
                              </>
                         )}
                    </div>
               </div>

               {/* Timestamp on mobile */}
               <div className="px-3 pb-2 sm:hidden">
                    <span className="text-xs text-slate-500">{timeAgo}</span>
               </div>

               {/* Expanded diff */}
               <AnimatePresence>
                    {expanded && !isRestoreEntry && (
                         <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                         >
                              <div className="px-3 pb-3 border-t border-slate-700/30 pt-2 space-y-1.5">
                                   {snapshot.changed_fields.map((field) => (
                                        <div key={field} className="flex items-start gap-2 text-xs">
                                             <span className="text-slate-500 font-medium min-w-25">{FIELD_LABELS[field] || field}:</span>
                                             <span className="text-slate-400">
                                                  {formatFieldValue(field, snapshot.snapshot[field], columns)}
                                             </span>
                                             <span className="text-slate-600 mx-1">&rarr;</span>
                                             <span className="text-slate-300 italic">nowa wartość</span>
                                        </div>
                                   ))}
                              </div>
                         </motion.div>
                    )}
               </AnimatePresence>
          </div>
     );
}

export default function TaskHistory({ taskId, columns, onRestore }: TaskHistoryProps) {
     const { data: snapshots = [], isLoading } = useGetTaskSnapshotsQuery(taskId);
     const [restoreSnapshot] = useRestoreTaskSnapshotMutation();
     const { currentUser } = useCurrentUser();
     const [showAll, setShowAll] = useState(false);
     const [confirmRestore, setConfirmRestore] = useState<{ id: string; version: number } | null>(null);

     const visibleSnapshots = useMemo(() => {
          if (showAll) return snapshots;
          return snapshots.slice(0, 3);
     }, [snapshots, showAll]);

     const handleRestore = useCallback(
          async (snapshotId: string, version: number) => {
               setConfirmRestore({ id: snapshotId, version });
          },
          [],
     );

     const confirmRestoreAction = useCallback(async () => {
          if (!confirmRestore) return;
          try {
               await restoreSnapshot({
                    taskId,
                    snapshotId: confirmRestore.id,
                    userId: currentUser?.id,
               }).unwrap();
               toast.success(`Przywrócono wersję ${confirmRestore.version}`);
               onRestore?.();
          } catch {
               toast.error('Nie udało się przywrócić wersji');
          } finally {
               setConfirmRestore(null);
          }
     }, [confirmRestore, restoreSnapshot, taskId, currentUser?.id, onRestore]);

     if (isLoading) {
          return (
               <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                    <div className="animate-pulse space-y-2">
                         <div className="h-4 bg-slate-700/50 rounded w-1/3" />
                         <div className="h-12 bg-slate-700/30 rounded" />
                    </div>
               </div>
          );
     }

     if (snapshots.length === 0) return null;

     return (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
               {/* Section header */}
               <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                    <div className="w-1 h-4 bg-linear-to-b from-emerald-500 to-teal-500 rounded-full" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historia zmian</h3>
                    <FiClock className="w-3.5 h-3.5 text-slate-500 ml-1" />
                    <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{snapshots.length}</span>
               </div>

               {/* Snapshot entries */}
               <div className="space-y-2">
                    {visibleSnapshots.map((snapshot) => (
                         <SnapshotEntry key={snapshot.id} snapshot={snapshot} columns={columns} onRestore={handleRestore} />
                    ))}
               </div>

               {/* Show all toggle */}
               {snapshots.length > 3 && (
                    <button
                         onClick={() => setShowAll(!showAll)}
                         className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 rounded-lg hover:bg-slate-700/30"
                    >
                         {showAll ? 'Zwiń' : `Pokaż wszystkie (${snapshots.length})`}
                    </button>
               )}

               {/* Confirm restore modal */}
               <AnimatePresence>
                    {confirmRestore && (
                         <motion.div
                              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setConfirmRestore(null)}
                         >
                              <motion.div
                                   className="bg-slate-800 rounded-xl border border-slate-700/50 p-6 max-w-sm mx-4 shadow-2xl"
                                   initial={{ scale: 0.95, opacity: 0 }}
                                   animate={{ scale: 1, opacity: 1 }}
                                   exit={{ scale: 0.95, opacity: 0 }}
                                   onClick={(e) => e.stopPropagation()}
                              >
                                   <h4 className="text-lg font-semibold text-white mb-2">Przywróć wersję</h4>
                                   <p className="text-sm text-slate-400 mb-4">
                                        Czy na pewno chcesz przywrócić wersję {confirmRestore.version}? Obecny stan zadania zostanie zapisany w historii.
                                   </p>
                                   <div className="flex gap-3 justify-end">
                                        <button
                                             onClick={() => setConfirmRestore(null)}
                                             className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                             Anuluj
                                        </button>
                                        <button
                                             onClick={confirmRestoreAction}
                                             className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                                        >
                                             Przywróć
                                        </button>
                                   </div>
                              </motion.div>
                         </motion.div>
                    )}
               </AnimatePresence>
          </div>
     );
}
