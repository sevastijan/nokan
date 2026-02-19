'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SingleTaskView from '@/app/components/SingleTaskView/SingleTaskView';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import {
     useGetUserBoardsQuery,
     useGetTasksByBoardsAndDateQuery,
     useGetColumnsByBoardIdQuery,
} from '@/app/store/slices/calendarApiSlice';
import type { CalendarTask } from '@/app/store/slices/calendarApiSlice';
import {
     format,
     startOfMonth,
     endOfMonth,
     startOfWeek,
     endOfWeek,
     addDays,
     addMonths,
     subMonths,
     isSameMonth,
     isSameDay,
     parseISO,
     differenceInCalendarDays,
     max as dateMax,
     min as dateMin,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Layers } from 'lucide-react';
import Avatar from '@/app/components/Avatar/Avatar';
import Loader from '@/app/components/Loader';
import { getPriorityStyleConfig } from '@/app/utils/helpers';
import type { User } from '@/app/types/globalTypes';

/* ──────────────────────────────────────────────
   Board color palette — deterministic per index
   ────────────────────────────────────────────── */
const BOARD_COLORS = [
     { bg: 'bg-blue-500/20', border: 'border-blue-500/40', dot: 'bg-blue-500', bar: 'from-blue-600/80 to-blue-500/60', text: 'text-blue-400' },
     { bg: 'bg-violet-500/20', border: 'border-violet-500/40', dot: 'bg-violet-500', bar: 'from-violet-600/80 to-violet-500/60', text: 'text-violet-400' },
     { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', dot: 'bg-emerald-500', bar: 'from-emerald-600/80 to-emerald-500/60', text: 'text-emerald-400' },
     { bg: 'bg-amber-500/20', border: 'border-amber-500/40', dot: 'bg-amber-500', bar: 'from-amber-600/80 to-amber-500/60', text: 'text-amber-400' },
     { bg: 'bg-rose-500/20', border: 'border-rose-500/40', dot: 'bg-rose-500', bar: 'from-rose-600/80 to-rose-500/60', text: 'text-rose-400' },
     { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', dot: 'bg-cyan-500', bar: 'from-cyan-600/80 to-cyan-500/60', text: 'text-cyan-400' },
     { bg: 'bg-pink-500/20', border: 'border-pink-500/40', dot: 'bg-pink-500', bar: 'from-pink-600/80 to-pink-500/60', text: 'text-pink-400' },
     { bg: 'bg-teal-500/20', border: 'border-teal-500/40', dot: 'bg-teal-500', bar: 'from-teal-600/80 to-teal-500/60', text: 'text-teal-400' },
];

const MAX_VISIBLE_TASKS = 3;

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
interface ProcessedTask {
     id: string;
     title: string;
     start: Date;
     end: Date;
     assignee?: User | null;
     boardId: string | null;
     priorityId: string | null;
     priorityLabel: string | null;
     priorityColor: string | null;
     boardTitle: string | null;
}

interface TaskForWeek {
     id: string;
     title: string;
     assignee?: User | null;
     colStart: number;
     colSpan: number;
     lane: number;
     boardId: string | null;
     priorityId: string | null;
}

interface BoardPickerState {
     visible: boolean;
     date: string;
     x: number;
     y: number;
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
const Calendar = () => {
     const { t } = useTranslation();
     const { currentUser, loading: userLoading, authStatus } = useCurrentUser();
     const userId = currentUser?.id;

     const dayNames = [t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat'), t('calendar.sun')];

     /* ── Boards ────────────────────────────── */
     const { data: boards = [], isLoading: boardsLoading, isError: boardsError } = useGetUserBoardsQuery(userId ?? '', { skip: !userId });

     const boardColorMap = useMemo(() => {
          const map = new Map<string, (typeof BOARD_COLORS)[number]>();
          boards.forEach((b, i) => map.set(b.id, BOARD_COLORS[i % BOARD_COLORS.length]));
          return map;
     }, [boards]);

     /* ── Board filter (all selected by default) */
     const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set());

     useEffect(() => {
          if (boards.length > 0 && selectedBoardIds.size === 0) {
               setSelectedBoardIds(new Set(boards.map((b) => b.id)));
          }
     }, [boards, selectedBoardIds.size]);

     const toggleBoard = useCallback((boardId: string) => {
          setSelectedBoardIds((prev) => {
               const next = new Set(prev);
               if (next.has(boardId)) {
                    if (next.size === 1) return prev; // keep at least one
                    next.delete(boardId);
               } else {
                    next.add(boardId);
               }
               return next;
          });
     }, []);

     const selectAllBoards = useCallback(() => {
          setSelectedBoardIds(new Set(boards.map((b) => b.id)));
     }, [boards]);

     /* ── Month navigation ──────────────────── */
     const [currentMonth, setCurrentMonth] = useState(new Date());
     const [direction, setDirection] = useState(0);

     const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
     const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

     const calStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart]);
     const calEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd]);

     const fetchStart = format(calStart, 'yyyy-MM-dd');
     const fetchEnd = format(calEnd, 'yyyy-MM-dd');

     const boardIdsToFetch = useMemo(() => Array.from(selectedBoardIds), [selectedBoardIds]);

     const { data: tasksRaw = [], refetch: refetchTasks } = useGetTasksByBoardsAndDateQuery(
          { boardIds: boardIdsToFetch, start: fetchStart, end: fetchEnd },
          { skip: boardIdsToFetch.length === 0 },
     );

     const prevMonth = useCallback(() => {
          setDirection(-1);
          setCurrentMonth((m) => subMonths(m, 1));
     }, []);

     const nextMonth = useCallback(() => {
          setDirection(1);
          setCurrentMonth((m) => addMonths(m, 1));
     }, []);

     const goToToday = useCallback(() => {
          const today = new Date();
          setDirection(today > currentMonth ? 1 : -1);
          setCurrentMonth(today);
     }, [currentMonth]);

     /* ── Columns (for selected board when adding task) ── */
     const [activeBoardForNew, setActiveBoardForNew] = useState<string | undefined>(undefined);
     const [selectedColumnForNew, setSelectedColumnForNew] = useState<string | undefined>(undefined);

     const { data: columns = [], isLoading: columnsLoading } = useGetColumnsByBoardIdQuery(activeBoardForNew ?? '', {
          skip: !activeBoardForNew,
     });

     useEffect(() => {
          if (activeBoardForNew && !columnsLoading && columns.length > 0 && !selectedColumnForNew) {
               setSelectedColumnForNew(columns[0].id);
          }
     }, [columnsLoading, columns, activeBoardForNew, selectedColumnForNew]);

     /* ── Task modal state ──────────────────── */
     const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
     const [taskModalMode, setTaskModalMode] = useState<'add' | 'edit'>('add');
     const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
     const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);

     /* ── Board picker for adding tasks ─────── */
     const [boardPicker, setBoardPicker] = useState<BoardPickerState>({ visible: false, date: '', x: 0, y: 0 });
     const boardPickerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
          if (!boardPicker.visible) return;
          const handleClick = (e: MouseEvent) => {
               if (boardPickerRef.current && !boardPickerRef.current.contains(e.target as Node)) {
                    setBoardPicker((s) => ({ ...s, visible: false }));
               }
          };
          document.addEventListener('mousedown', handleClick);
          return () => document.removeEventListener('mousedown', handleClick);
     }, [boardPicker.visible]);

     /* ── Weeks grid ────────────────────────── */
     const weeks = useMemo(() => {
          const wks: Date[][] = [];
          let curr = calStart;
          while (curr <= calEnd) {
               const week: Date[] = [];
               for (let i = 0; i < 7; i++) {
                    week.push(addDays(curr, i));
               }
               wks.push(week);
               curr = addDays(curr, 7);
          }
          return wks;
     }, [calStart, calEnd]);

     /* ── Process tasks ─────────────────────── */
     const tasksProcessed: ProcessedTask[] = useMemo(() => {
          if (!tasksRaw) return [];
          return tasksRaw
               .filter((t: CalendarTask) => t.type !== 'story')
               .map((t: CalendarTask) => {
                    if (!t.start_date) return null;
                    try {
                         const s = parseISO(t.start_date);
                         const e = t.end_date ? parseISO(t.end_date) : s;
                         return {
                              id: t.id!,
                              title: t.title ?? '',
                              start: s,
                              end: e,
                              assignee: t.assignee ?? null,
                              boardId: t.board_id ?? null,
                              priorityId: t.priority ?? null,
                              priorityLabel: t.priority_label ?? null,
                              priorityColor: t.priority_color ?? null,
                              boardTitle: t.board_title ?? null,
                         } as ProcessedTask;
                    } catch {
                         return null;
                    }
               })
               .filter((x): x is ProcessedTask => x !== null);
     }, [tasksRaw]);

     /* ── Assign lanes to avoid overlap ─────── */
     const tasksByWeek: TaskForWeek[][] = useMemo(() => {
          return weeks.map((week) => {
               const rowStart = week[0];
               const rowEnd = week[6];
               const rowTasks: TaskForWeek[] = [];

               tasksProcessed.forEach((t) => {
                    const rs = dateMax([t.start, rowStart]);
                    const re = dateMin([t.end, rowEnd]);
                    if (rs <= re) {
                         const startIdx = differenceInCalendarDays(rs, rowStart);
                         const endIdx = differenceInCalendarDays(re, rowStart);
                         rowTasks.push({
                              id: t.id,
                              title: t.title,
                              assignee: t.assignee,
                              colStart: startIdx + 1,
                              colSpan: endIdx - startIdx + 1,
                              lane: 0,
                              boardId: t.boardId,
                              priorityId: t.priorityId,
                         });
                    }
               });

               // Assign lanes (greedy)
               const lanes: { end: number }[] = [];
               // Sort by colStart, then wider spans first
               rowTasks.sort((a, b) => a.colStart - b.colStart || b.colSpan - a.colSpan);
               for (const task of rowTasks) {
                    let placed = false;
                    for (let i = 0; i < lanes.length; i++) {
                         if (task.colStart > lanes[i].end) {
                              task.lane = i;
                              lanes[i].end = task.colStart + task.colSpan - 1;
                              placed = true;
                              break;
                         }
                    }
                    if (!placed) {
                         task.lane = lanes.length;
                         lanes.push({ end: task.colStart + task.colSpan - 1 });
                    }
               }

               return rowTasks;
          });
     }, [weeks, tasksProcessed]);

     /* ── Overflow tasks per day ────────────── */
     const overflowByDay = useMemo(() => {
          const map = new Map<string, number>();
          weeks.forEach((week, wi) => {
               week.forEach((day, di) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const tasksInDay = tasksByWeek[wi].filter(
                         (t) => di + 1 >= t.colStart && di + 1 < t.colStart + t.colSpan,
                    );
                    const hidden = tasksInDay.filter((t) => t.lane >= MAX_VISIBLE_TASKS).length;
                    if (hidden > 0) map.set(dayKey, hidden);
               });
          });
          return map;
     }, [weeks, tasksByWeek]);

     /* ── Handlers ──────────────────────────── */
     const handleDateClick = useCallback(
          (date: Date, e: React.MouseEvent) => {
               const activeBoardsArray = Array.from(selectedBoardIds);

               if (activeBoardsArray.length === 0) return;

               const dateStr = format(date, 'yyyy-MM-dd');

               if (activeBoardsArray.length === 1) {
                    // Auto-select the only active board
                    setActiveBoardForNew(activeBoardsArray[0]);
                    setSelectedColumnForNew(undefined);
                    setSelectedDate(dateStr);
                    setSelectedTaskId(undefined);
                    setTaskModalMode('add');
                    setIsTaskModalOpen(true);
               } else {
                    // Show board picker
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setBoardPicker({
                         visible: true,
                         date: dateStr,
                         x: rect.left + rect.width / 2,
                         y: rect.top + rect.height / 2,
                    });
               }
          },
          [selectedBoardIds],
     );

     const handleBoardPickerSelect = useCallback(
          (boardId: string) => {
               setActiveBoardForNew(boardId);
               setSelectedColumnForNew(undefined);
               setSelectedDate(boardPicker.date);
               setSelectedTaskId(undefined);
               setTaskModalMode('add');
               setIsTaskModalOpen(true);
               setBoardPicker((s) => ({ ...s, visible: false }));
          },
          [boardPicker.date],
     );

     const handleTaskClick = useCallback((taskId: string, boardId: string | null) => {
          setSelectedTaskId(taskId);
          setActiveBoardForNew(boardId ?? undefined);
          setSelectedColumnForNew(undefined);
          setTaskModalMode('edit');
          setIsTaskModalOpen(true);
     }, []);

     const closeTaskModal = useCallback(() => {
          setIsTaskModalOpen(false);
          setSelectedDate(undefined);
          setSelectedTaskId(undefined);
          setSelectedColumnForNew(undefined);
     }, []);

     /* ── Loading / error states ────────────── */
     if (authStatus === 'loading' || userLoading || boardsLoading) {
          return <Loader text={t('calendar.loading')} />;
     }
     if (authStatus === 'unauthenticated' || !userId) {
          return (
               <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                         <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                         <p className="text-slate-400 text-lg">{t('calendar.signInRequired')}</p>
                    </div>
               </div>
          );
     }
     if (boardsError) {
          return (
               <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                         <CalendarIcon className="w-12 h-12 text-red-500/60 mx-auto mb-4" />
                         <p className="text-red-400 text-lg">{t('calendar.loadFailed')}</p>
                    </div>
               </div>
          );
     }
     if (boards.length === 0) {
          return (
               <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                         <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                         <p className="text-slate-400 text-lg">{t('calendar.noBoards')}</p>
                         <p className="text-slate-500 text-sm mt-1">{t('calendar.createBoardHint')}</p>
                    </div>
               </div>
          );
     }

     /* ── Month animation variants ──────────── */
     const monthVariants = {
          enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
          center: { x: 0, opacity: 1 },
          exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
     };

     const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: pl });
     const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

     return (
          <>
               <div className="flex flex-col gap-4">
                    {/* ── Toolbar ────────────────────────── */}
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              {/* Month nav */}
                              <div className="flex items-center gap-2">
                                   <button
                                        onClick={prevMonth}
                                        className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
                                        aria-label={t('calendar.prevMonth')}
                                   >
                                        <ChevronLeft className="w-5 h-5" />
                                   </button>

                                   <AnimatePresence mode="wait" custom={direction}>
                                        <motion.h2
                                             key={currentMonth.toISOString()}
                                             custom={direction}
                                             variants={monthVariants}
                                             initial="enter"
                                             animate="center"
                                             exit="exit"
                                             transition={{ duration: 0.2 }}
                                             className="text-white text-lg font-semibold min-w-[180px] text-center select-none"
                                        >
                                             {capitalizedMonth}
                                        </motion.h2>
                                   </AnimatePresence>

                                   <button
                                        onClick={nextMonth}
                                        className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
                                        aria-label={t('calendar.nextMonth')}
                                   >
                                        <ChevronRight className="w-5 h-5" />
                                   </button>

                                   <button
                                        onClick={goToToday}
                                        className="ml-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 transition-colors"
                                   >
                                        {t('calendar.today')}
                                   </button>
                              </div>
                         </div>

                         {/* ── Board filter chips ──────────── */}
                         {boards.length > 1 && (
                              <div className="flex items-center gap-2 mt-3 flex-wrap">
                                   <button
                                        onClick={selectAllBoards}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                                             selectedBoardIds.size === boards.length
                                                  ? 'bg-white/10 border-white/30 text-white'
                                                  : 'bg-transparent border-slate-600/50 text-slate-500 hover:text-slate-300 hover:border-slate-500'
                                        }`}
                                   >
                                        {t('calendar.allBoards')}
                                   </button>
                                   {boards.map((board) => {
                                        const color = boardColorMap.get(board.id) ?? BOARD_COLORS[0];
                                        const isActive = selectedBoardIds.has(board.id);
                                        return (
                                             <button
                                                  key={board.id}
                                                  onClick={() => toggleBoard(board.id)}
                                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                                                       isActive
                                                            ? `${color.bg} ${color.border} ${color.text}`
                                                            : 'bg-transparent border-slate-700/50 text-slate-500 hover:text-slate-400 hover:border-slate-600'
                                                  }`}
                                             >
                                                  <span className={`w-2 h-2 rounded-full ${isActive ? color.dot : 'bg-slate-600'}`} />
                                                  {board.title}
                                             </button>
                                        );
                                   })}
                              </div>
                         )}
                    </div>

                    {/* ── Calendar grid ──────────────────── */}
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                         {/* Day names header */}
                         <div className="grid grid-cols-7 border-b border-slate-700/50">
                              {dayNames.map((d) => (
                                   <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        {d}
                                   </div>
                              ))}
                         </div>

                         {/* Weeks */}
                         <AnimatePresence mode="wait" custom={direction}>
                              <motion.div
                                   key={currentMonth.toISOString()}
                                   custom={direction}
                                   initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                                   transition={{ duration: 0.2 }}
                              >
                                   {weeks.map((week, wi) => (
                                        <div key={wi} className="grid grid-cols-7 relative" style={{ minHeight: '7rem' }}>
                                             {/* Day cells */}
                                             {week.map((day) => {
                                                  const inMonth = isSameMonth(day, monthStart);
                                                  const isToday = isSameDay(day, new Date());
                                                  const dayKey = format(day, 'yyyy-MM-dd');
                                                  const overflow = overflowByDay.get(dayKey);

                                                  return (
                                                       <div
                                                            key={day.toISOString()}
                                                            className={`relative border-b border-r border-slate-700/30 p-1.5 cursor-pointer group transition-colors ${
                                                                 inMonth ? 'bg-slate-800/40 hover:bg-slate-700/40' : 'bg-slate-800/20'
                                                            } ${isToday ? 'ring-1 ring-inset ring-purple-500/50' : ''}`}
                                                            onClick={(e) => handleDateClick(day, e)}
                                                       >
                                                            <div className="flex items-center justify-between">
                                                                 <span
                                                                      className={`inline-flex items-center justify-center text-xs font-medium w-6 h-6 rounded-full ${
                                                                           isToday
                                                                                ? 'bg-purple-600 text-white'
                                                                                : inMonth
                                                                                  ? 'text-slate-300'
                                                                                  : 'text-slate-600'
                                                                      }`}
                                                                 >
                                                                      {format(day, 'd')}
                                                                 </span>
                                                                 <Plus className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            {overflow && (
                                                                 <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-medium">
                                                                      +{overflow}
                                                                 </div>
                                                            )}
                                                       </div>
                                                  );
                                             })}

                                             {/* Task bars overlay */}
                                             <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '1.75rem' }}>
                                                  {tasksByWeek[wi]
                                                       .filter((t) => t.lane < MAX_VISIBLE_TASKS)
                                                       .map((t) => {
                                                            const leftPct = ((t.colStart - 1) / 7) * 100;
                                                            const widthPct = (t.colSpan / 7) * 100;
                                                            const topPx = t.lane * 22;

                                                            const boardColor = t.boardId ? boardColorMap.get(t.boardId) : null;
                                                            const priorityStyle = t.priorityId ? getPriorityStyleConfig(t.priorityId) : null;

                                                            // Use priority color for task bar border, board color for gradient
                                                            const barGradient = boardColor?.bar ?? 'from-slate-600/80 to-slate-500/60';
                                                            const borderClass = priorityStyle
                                                                 ? priorityStyle.borderColor
                                                                 : 'border-transparent';

                                                            return (
                                                                 <div
                                                                      key={t.id}
                                                                      className={`absolute flex items-center bg-gradient-to-r ${barGradient} border ${borderClass} text-white text-[11px] px-1.5 rounded-md cursor-pointer pointer-events-auto hover:brightness-125 transition-all shadow-sm`}
                                                                      style={{
                                                                           left: `calc(${leftPct}% + 2px)`,
                                                                           width: `calc(${widthPct}% - 4px)`,
                                                                           top: `${topPx}px`,
                                                                           height: '20px',
                                                                      }}
                                                                      onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           handleTaskClick(t.id, t.boardId);
                                                                      }}
                                                                      title={t.title}
                                                                 >
                                                                      {t.assignee?.image && (
                                                                           <Avatar
                                                                                src={t.assignee.image}
                                                                                alt={t.assignee.name ?? undefined}
                                                                                size={14}
                                                                                className="mr-1 flex-shrink-0"
                                                                           />
                                                                      )}
                                                                      <span className="truncate leading-tight">{t.title}</span>
                                                                 </div>
                                                            );
                                                       })}
                                             </div>
                                        </div>
                                   ))}
                              </motion.div>
                         </AnimatePresence>
                    </div>
               </div>

               {/* ── Board picker popover ──────────── */}
               <AnimatePresence>
                    {boardPicker.visible && (
                         <motion.div
                              ref={boardPickerRef}
                              className="fixed z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                              style={{ left: boardPicker.x, top: boardPicker.y, transform: 'translate(-50%, -50%)' }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                         >
                              <div className="px-3 py-2 border-b border-slate-700/50">
                                   <p className="text-xs font-medium text-slate-400">{t('calendar.selectBoard')}</p>
                              </div>
                              <div className="py-1 max-h-60 overflow-y-auto">
                                   {boards
                                        .filter((b) => selectedBoardIds.has(b.id))
                                        .map((board) => {
                                             const color = boardColorMap.get(board.id) ?? BOARD_COLORS[0];
                                             return (
                                                  <button
                                                       key={board.id}
                                                       onClick={() => handleBoardPickerSelect(board.id)}
                                                       className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/60 transition-colors"
                                                  >
                                                       <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                                                       {board.title}
                                                  </button>
                                             );
                                        })}
                              </div>
                         </motion.div>
                    )}
               </AnimatePresence>

               {/* ── Task modal ─────────────────────── */}
               <AnimatePresence>
                    {isTaskModalOpen && activeBoardForNew && (taskModalMode === 'edit' || (columns.length > 0 && selectedColumnForNew)) && (
                         <motion.div
                              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={closeTaskModal}
                         >
                              <motion.div
                                   className="bg-slate-800 text-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto border border-slate-700/50 shadow-2xl"
                                   initial={{ y: 30, opacity: 0 }}
                                   animate={{ y: 0, opacity: 1 }}
                                   exit={{ y: 30, opacity: 0 }}
                                   transition={{ duration: 0.2 }}
                                   onClick={(e) => e.stopPropagation()}
                              >
                                   <SingleTaskView
                                        taskId={taskModalMode === 'edit' ? selectedTaskId : undefined}
                                        mode={taskModalMode === 'edit' ? 'edit' : 'add'}
                                        columnId={
                                             taskModalMode === 'edit'
                                                  ? tasksRaw.find((t) => t.id === selectedTaskId)?.column_id ?? undefined
                                                  : selectedColumnForNew!
                                        }
                                        boardId={activeBoardForNew}
                                        initialStartDate={selectedDate}
                                        onClose={closeTaskModal}
                                        onTaskAdded={() => {
                                             refetchTasks();
                                        }}
                                        onTaskUpdate={() => {
                                             refetchTasks();
                                             closeTaskModal();
                                        }}
                                        currentUser={currentUser!}
                                        columns={columns}
                                        statuses={[]}
                                   />
                              </motion.div>
                         </motion.div>
                    )}
               </AnimatePresence>
          </>
     );
};

export default Calendar;
