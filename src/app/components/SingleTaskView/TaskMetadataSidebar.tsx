'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaRedo, FaLayerGroup } from 'react-icons/fa';
import { FiCalendar, FiPlus, FiCheck, FiChevronRight, FiChevronLeft, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import Avatar from '../Avatar/Avatar';
import { Column, TaskType } from '@/app/types/globalTypes';
import { formatDate } from '@/app/utils/helpers';
import { getPriorities } from '@/app/lib/api';
import { Priority } from '@/app/types/globalTypes';

interface TaskMetadataSidebarProps {
     task: {
          creator: {
               id?: string;
               name?: string | null;
               image?: string | null;
               custom_name?: string | null;
               custom_image?: string | null;
               email?: string | null;
          } | null;
          created_at?: string | null;
          updated_at?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_recurring?: boolean;
          recurrence_interval?: number | null;
          recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
          collaborators?: Array<{
               id: string;
               name?: string | null;
               image?: string | null;
               custom_name?: string | null;
               custom_image?: string | null;
               email?: string | null;
          }> | null;
          type?: TaskType;
          parent_id?: string | null;
     };
     columns: Column[];
     selectedAssignees?: TaskMetadataSidebarProps['task']['collaborators'];
     localColumnId?: string;
     onRecurringModalOpen: () => void;
     onOpenTask?: (taskId: string) => void;
     onTypeChange?: (type: TaskType) => void;
     canChangeType?: boolean;
     availableUsers?: Array<{ id: string; name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email: string }>;
     formAssignees?: Array<{ id: string; name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email: string }>;
     onAssigneesChange?: (userIds: string[]) => void;
     selectedPriority?: string | null;
     onPriorityChange?: (priorityId: string | null) => void;
     onColumnChange?: (newColId: string) => void;
     startDate?: string;
     endDate?: string;
     onDateChange?: (type: 'start' | 'end', value: string) => void;
     completed?: boolean;
     onCompletionToggle?: (completed: boolean) => void;
}

const getDisplayData = (
     user: { name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email?: string | null } | null,
) => {
     if (!user) return { name: 'Unknown', image: '' };
     return {
          name: user.custom_name || user.name || user.email || 'User',
          image: user.custom_image || user.image || '',
     };
};

type AssigneeUser = { id: string; name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email?: string | null };

const AssigneesPicker = ({ assignees, availableUsers, canEdit, onAssigneesChange, label, noAssignedLabel }: {
     assignees: AssigneeUser[];
     availableUsers: AssigneeUser[];
     canEdit: boolean;
     onAssigneesChange?: (userIds: string[]) => void;
     label: string;
     noAssignedLabel: string;
}) => {
     const [open, setOpen] = useState(false);
     const ref = useRef<HTMLDivElement>(null);

     useEffect(() => {
          if (!open) return;
          const handleClick = (e: MouseEvent) => {
               if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
          };
          const handleKey = (e: KeyboardEvent) => {
               if (e.key === 'Escape') setOpen(false);
          };
          // Use setTimeout to avoid catching the same click that opened the dropdown
          const timer = setTimeout(() => {
               document.addEventListener('mousedown', handleClick, true);
               document.addEventListener('keydown', handleKey);
          }, 0);
          return () => {
               clearTimeout(timer);
               document.removeEventListener('mousedown', handleClick, true);
               document.removeEventListener('keydown', handleKey);
          };
     }, [open]);

     const toggleUser = useCallback((userId: string) => {
          if (!onAssigneesChange) return;
          const currentIds = assignees.map((a) => a.id);
          const newIds = currentIds.includes(userId) ? currentIds.filter((id) => id !== userId) : [...currentIds, userId];
          onAssigneesChange(newIds);
     }, [assignees, onAssigneesChange]);

     const isSelected = (userId: string) => assignees.some((a) => a.id === userId);

     return (
          <div className="relative" ref={ref}>
               <div className="flex items-center justify-between md:block">
                    <p className="text-xs text-slate-400 md:mb-2 shrink-0">{label}</p>
                    <div className="group/assignees flex items-center gap-1.5 cursor-pointer" onClick={() => canEdit && setOpen((p) => !p)}>
                    {assignees.length > 0 ? (
                         <div className="flex -space-x-1.5 group-hover/assignees:brightness-110 transition">
                              {assignees.slice(0, 3).map((a) => {
                                   const { name, image } = getDisplayData(a);
                                   return (
                                        <div key={a.id} className="relative group/av">
                                             <Avatar src={image} alt={name} size={28} className="ring-2 ring-slate-900" />
                                             <div className="hidden md:block absolute bottom-full left-0 mb-1.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 whitespace-nowrap opacity-0 group-hover/av:opacity-100 transition pointer-events-none z-10 max-w-[180px] truncate">
                                                  {name}
                                             </div>
                                        </div>
                                   );
                              })}
                              {assignees.length > 3 && (
                                   <div className="w-7 h-7 rounded-full bg-slate-700 ring-2 ring-slate-900 flex items-center justify-center">
                                        <span className="text-[9px] font-medium text-slate-300">+{assignees.length - 3}</span>
                                   </div>
                              )}
                         </div>
                    ) : (
                         <span className="text-sm text-slate-600 group-hover/assignees:text-slate-400 transition">{noAssignedLabel}</span>
                    )}
               </div>
               </div>

               {/* Dropdown */}
               {open && (
                    <div className="absolute right-0 md:left-0 md:right-0 mt-2 min-w-[220px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 z-50 overflow-hidden">
                         <ul className="max-h-52 overflow-auto py-1">
                              {availableUsers.map((user) => {
                                   const selected = isSelected(user.id);
                                   const { name, image } = getDisplayData(user);
                                   return (
                                        <li
                                             key={user.id}
                                             className={`px-3 py-2 cursor-pointer flex items-center gap-2.5 transition-colors ${selected ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'}`}
                                             onClick={() => toggleUser(user.id)}
                                        >
                                             <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${selected ? 'bg-brand-500' : 'border border-slate-600'}`}>
                                                  {selected && <FiCheck className="w-3 h-3 text-white" />}
                                             </div>
                                             <Avatar src={image} alt={name} size={22} />
                                             <span className={`text-sm truncate ${selected ? 'text-slate-200' : 'text-slate-400'}`}>{name}</span>
                                        </li>
                                   );
                              })}
                         </ul>
                    </div>
               )}
          </div>
     );
};

const DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

function formatDisplayDate(dateStr: string): string {
     if (!dateStr) return '';
     const d = new Date(dateStr + 'T00:00:00');
     return `${d.getDate()} ${MONTHS_PL[d.getMonth()].slice(0, 3).toLowerCase()} ${d.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number) {
     const firstDay = new Date(year, month, 1);
     const lastDay = new Date(year, month + 1, 0);
     const days: (number | null)[] = [];
     let startDay = firstDay.getDay();
     startDay = startDay === 0 ? 6 : startDay - 1; // Monday first
     for (let i = 0; i < startDay; i++) days.push(null);
     for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
     return days;
}

const DateField = ({ value, onChange, min }: { value: string; onChange: (v: string) => void; min?: string }) => {
     const [open, setOpen] = useState(false);
     const ref = useRef<HTMLDivElement>(null);
     const today = new Date();
     const selected = value ? new Date(value + 'T00:00:00') : null;
     const [viewYear, setViewYear] = useState(selected?.getFullYear() || today.getFullYear());
     const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

     useEffect(() => {
          if (!open) return;
          const handleClick = (e: MouseEvent) => {
               if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
          };
          const handleKey = (e: KeyboardEvent) => {
               if (e.key === 'Escape') setOpen(false);
          };
          const timer = setTimeout(() => {
               document.addEventListener('mousedown', handleClick, true);
               document.addEventListener('keydown', handleKey);
          }, 10);
          return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleClick, true); document.removeEventListener('keydown', handleKey); };
     }, [open]);

     useEffect(() => {
          if (open && selected) {
               setViewYear(selected.getFullYear());
               setViewMonth(selected.getMonth());
          }
     }, [open]);

     const days = getDaysInMonth(viewYear, viewMonth);

     const handleSelect = (day: number) => {
          const m = String(viewMonth + 1).padStart(2, '0');
          const d = String(day).padStart(2, '0');
          onChange(`${viewYear}-${m}-${d}`);
          setOpen(false);
     };

     const prevMonth = () => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
          else setViewMonth((m) => m - 1);
     };
     const nextMonth = () => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
          else setViewMonth((m) => m + 1);
     };

     const isDisabled = (day: number) => {
          if (!min) return false;
          const m = String(viewMonth + 1).padStart(2, '0');
          const d = String(day).padStart(2, '0');
          return `${viewYear}-${m}-${d}` < min;
     };

     const isToday = (day: number) => day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
     const isSelected = (day: number) => selected && day === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();

     return (
          <div className="relative" ref={ref}>
               <div className="group relative">
                    {value ? (
                         <>
                              <button
                                   onClick={() => setOpen((p) => !p)}
                                   className="inline-flex items-center gap-1 py-0.5 text-sm transition cursor-pointer group/date"
                              >
                                   <span className="text-slate-300 text-xs group-hover/date:text-white transition">{formatDisplayDate(value)}</span>
                                   <span className="hidden md:inline text-slate-500 text-sm opacity-0 group-hover/date:opacity-100 transition">&#8250;</span>
                              </button>
                              <button
                                   onClick={() => onChange('')}
                                   className="hidden md:block absolute -right-5 top-0.5 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-400 transition p-0.5"
                              >
                                   <FiX className="w-3 h-3" />
                              </button>
                         </>
                    ) : (
                         <button
                              onClick={() => setOpen((p) => !p)}
                              className="inline-flex items-center gap-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
                         >
                              <FiCalendar className="w-3 h-3" />
                              <span>Ustaw</span>
                         </button>
                    )}
               </div>

               {open && (
                    <div className="absolute right-0 md:left-0 md:right-auto mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/40 z-[200] p-3 w-[250px]">
                         {/* Month/Year header */}
                         <div className="flex items-center justify-between mb-3">
                              <button onClick={prevMonth} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition">
                                   <FiChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-xs font-medium text-slate-200">
                                   {MONTHS_PL[viewMonth]} {viewYear}
                              </span>
                              <button onClick={nextMonth} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition">
                                   <FiChevronRight className="w-4 h-4" />
                              </button>
                         </div>

                         {/* Day headers */}
                         <div className="grid grid-cols-7 gap-0 mb-1">
                              {DAYS_PL.map((d) => (
                                   <div key={d} className="text-center text-[10px] font-medium text-slate-500 py-1">{d}</div>
                              ))}
                         </div>

                         {/* Days grid */}
                         <div className="grid grid-cols-7 gap-0">
                              {days.map((day, i) => (
                                   <div key={i} className="aspect-square flex items-center justify-center">
                                        {day ? (
                                             <button
                                                  onClick={() => !isDisabled(day) && handleSelect(day)}
                                                  disabled={isDisabled(day)}
                                                  className={`w-7 h-7 rounded-md text-xs transition flex items-center justify-center ${
                                                       isSelected(day)
                                                            ? 'bg-brand-500 text-white font-semibold'
                                                            : isToday(day)
                                                            ? 'bg-slate-700 text-white'
                                                            : isDisabled(day)
                                                            ? 'text-slate-700 cursor-not-allowed'
                                                            : 'text-slate-300 hover:bg-slate-700 cursor-pointer'
                                                  }`}
                                             >
                                                  {day}
                                             </button>
                                        ) : null}
                                   </div>
                              ))}
                         </div>

                         {/* Today button */}
                         <button
                              onClick={() => {
                                   const t = new Date();
                                   handleSelect(t.getDate());
                                   setViewMonth(t.getMonth());
                                   setViewYear(t.getFullYear());
                              }}
                              className="w-full mt-2 text-[10px] text-brand-400 hover:text-brand-300 transition py-1"
                         >
                              Dzisiaj
                         </button>
                         {value && (
                              <button
                                   onClick={() => { onChange(''); setOpen(false); }}
                                   className="w-full text-[10px] text-red-400/70 hover:text-red-400 transition py-1"
                              >
                                   Usuń termin
                              </button>
                         )}
                    </div>
               )}
          </div>
     );
};

const STATUS_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function getColumnColor(index: number): string {
     return STATUS_COLORS[index % STATUS_COLORS.length];
}

const StatusPicker = ({ columns, value, onChange, completed, onCompletionToggle }: {
     columns: Column[];
     value: string;
     onChange: (id: string) => void;
     completed?: boolean;
     onCompletionToggle?: (completed: boolean) => void;
}) => {
     const [open, setOpen] = useState(false);
     const ref = useRef<HTMLDivElement>(null);

     useEffect(() => {
          if (!open) return;
          const handleClick = (e: MouseEvent) => {
               if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
          };
          const handleKey = (e: KeyboardEvent) => {
               if (e.key === 'Escape') setOpen(false);
          };
          const timer = setTimeout(() => {
               document.addEventListener('mousedown', handleClick, true);
               document.addEventListener('keydown', handleKey);
          }, 0);
          return () => {
               clearTimeout(timer);
               document.removeEventListener('mousedown', handleClick, true);
               document.removeEventListener('keydown', handleKey);
          };
     }, [open]);

     const currentIndex = columns.findIndex((c) => c.id === value);
     const current = currentIndex >= 0 ? columns[currentIndex] : null;
     const getColColor = (col: Column, idx: number) => {
          if (col.color) return col.color;
          if (typeof window !== 'undefined') {
               const saved = localStorage.getItem(`col-color-${col.id}`);
               if (saved) return saved;
          }
          return getColumnColor(idx);
     };
     const currentColor = current ? getColColor(current, currentIndex) : '#64748b';
     const nextColumn = currentIndex >= 0 && currentIndex < columns.length - 1 ? columns[currentIndex + 1] : null;

     return (
          <div className="relative" ref={ref}>
               <div className="flex items-center gap-2">
                    {/* Status pill with arrow */}
                    <div className="flex items-center rounded-md overflow-hidden" style={{ backgroundColor: currentColor }}>
                         <button
                              onClick={() => setOpen((p) => !p)}
                              className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white hover:brightness-110 transition cursor-pointer"
                         >
                              {current?.title || '—'}
                         </button>
                         {nextColumn && !completed && (
                              <button
                                   onClick={() => onChange(nextColumn.id)}
                                   className="px-1.5 py-1 border-l border-white/20 text-white/70 hover:text-white hover:brightness-110 transition cursor-pointer"
                                   title={nextColumn.title}
                              >
                                   <FiChevronRight className="w-3 h-3" />
                              </button>
                         )}
                    </div>

                    {/* Completion checkbox */}
                    {onCompletionToggle && (
                         <button
                              onClick={() => onCompletionToggle(!completed)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
                                   completed
                                        ? 'bg-brand-500 text-white'
                                        : 'bg-slate-800 border border-slate-700 text-slate-700 hover:border-slate-500 hover:text-slate-400'
                              }`}
                         >
                              <FiCheck className="w-3 h-3" />
                         </button>
                    )}
               </div>

               {/* Dropdown */}
               {open && (
                    <div className="absolute right-0 md:left-0 md:right-auto mt-2 min-w-[200px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 z-50 overflow-hidden py-1">
                         {columns.map((col, idx) => {
                              const color = getColColor(col, idx);
                              return (
                                   <button
                                        key={col.id}
                                        onClick={() => { onChange(col.id); setOpen(false); }}
                                        className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${
                                             col.id === value ? 'bg-slate-700/60 text-white' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
                                        }`}
                                   >
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                        {col.title}
                                        {col.id === value && <FiCheck className="w-3.5 h-3.5 ml-auto text-brand-400" />}
                                   </button>
                              );
                         })}
                    </div>
               )}
          </div>
     );
};

const PriorityPicker = ({ selectedPriority, onChange }: { selectedPriority: string | null; onChange: (id: string | null) => void }) => {
     const { t } = useTranslation();
     const [open, setOpen] = useState(false);
     const [priorities, setPriorities] = useState<Priority[]>([]);
     const ref = useRef<HTMLDivElement>(null);

     const labelMap: Record<string, string> = {
          'Low': t('priority.low'),
          'Normal': t('priority.normal'),
          'Medium': t('priority.medium'),
          'High': t('priority.high'),
          'Urgent': t('priority.urgent'),
     };

     const getLabel = (p: Priority) => labelMap[p.label] || p.label;

     useEffect(() => {
          getPriorities().then(setPriorities).catch(() => {});
     }, []);

     useEffect(() => {
          if (!open) return;
          const handleClick = (e: MouseEvent) => {
               if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
          };
          const handleKey = (e: KeyboardEvent) => {
               if (e.key === 'Escape') setOpen(false);
          };
          const timer = setTimeout(() => {
               document.addEventListener('mousedown', handleClick, true);
               document.addEventListener('keydown', handleKey);
          }, 0);
          return () => {
               clearTimeout(timer);
               document.removeEventListener('mousedown', handleClick, true);
               document.removeEventListener('keydown', handleKey);
          };
     }, [open]);

     const current = priorities.find((p) => p.id === selectedPriority);

     return (
          <div className="relative" ref={ref}>
               <button
                    onClick={() => setOpen((p) => !p)}
                    className="inline-flex items-center gap-2 py-0.5 text-sm transition cursor-pointer group/pri"
               >
                    {current ? (
                         <>
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: current.color }} />
                              <span className="text-slate-300 text-xs group-hover/pri:text-white transition">{getLabel(current)}</span>
                              <span className="hidden md:inline text-slate-500 text-sm opacity-0 group-hover/pri:opacity-100 transition">&#8250;</span>
                         </>
                    ) : (
                         <span className="text-slate-500 text-xs group-hover/pri:text-slate-200 transition">—</span>
                    )}
               </button>

               {open && (
                    <div className="absolute right-0 md:left-0 md:right-auto mt-1 min-w-[150px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 z-50 overflow-hidden py-1">
                         {priorities
                              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                              .map((p) => (
                              <button
                                   key={p.id}
                                   onClick={() => { onChange(p.id); setOpen(false); }}
                                   className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${
                                        p.id === selectedPriority ? 'bg-slate-700/60 text-white' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
                                   }`}
                              >
                                   <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                   {getLabel(p)}
                                   {p.id === selectedPriority && <FiCheck className="w-3.5 h-3.5 ml-auto text-brand-400" />}
                              </button>
                         ))}
                    </div>
               )}
          </div>
     );
};

const TaskMetadataSidebar = ({ task, columns, selectedAssignees = [], localColumnId, onRecurringModalOpen, onOpenTask, onTypeChange, canChangeType = true, availableUsers, formAssignees, onAssigneesChange, selectedPriority, onPriorityChange, onColumnChange, startDate, endDate, onDateChange, completed, onCompletionToggle }: TaskMetadataSidebarProps) => {
     const { t } = useTranslation();
     const currentColumnTitle = columns.find((c) => c.id === localColumnId)?.title || '—';
     const isSubtask = Boolean(task.parent_id);
     const taskType = task.type || 'task';
     const assignees = selectedAssignees || [];
     const creatorDisplay = getDisplayData(task.creator);

     return (
          <aside className="w-full md:w-72 lg:w-80 md:bg-slate-900 md:border-l border-slate-800 overflow-visible text-white shrink-0 md:sticky md:top-0 md:self-start">
               <div className="py-3 md:p-5 space-y-0 md:space-y-5">

                    {/* Mobile: compact rows / Desktop: stacked sections */}

                    {/* Status */}
                    <div className="flex items-center justify-between md:block py-2 md:py-0 border-b border-slate-800/60 md:border-0">
                         <p className="text-xs text-slate-400 md:mb-2 shrink-0">Status</p>
                         <div className="relative">
                              {onColumnChange ? (
                                   <StatusPicker columns={columns} value={localColumnId || ''} onChange={onColumnChange} completed={completed} onCompletionToggle={onCompletionToggle} />
                              ) : (
                                   <p className="text-sm text-slate-200">{currentColumnTitle}</p>
                              )}
                         </div>
                    </div>

                    {/* Priority */}
                    {onPriorityChange && (
                         <div className="flex items-center justify-between md:block py-2 md:py-0 border-b border-slate-800/60 md:border-0">
                              <p className="text-xs text-slate-400 md:mb-2 shrink-0">{t('listView.priority')}</p>
                              <div className="relative">
                                   <PriorityPicker selectedPriority={selectedPriority ?? null} onChange={onPriorityChange} />
                              </div>
                         </div>
                    )}

                    {/* Assignees */}
                    <div className="py-2 md:py-0 border-b border-slate-800/60 md:border-0">
                         <AssigneesPicker
                              assignees={formAssignees || assignees}
                              availableUsers={availableUsers || []}
                              canEdit={!!onAssigneesChange}
                              onAssigneesChange={onAssigneesChange}
                              label={t('taskMeta.assigned')}
                              noAssignedLabel={t('taskMeta.noAssigned')}
                         />
                    </div>

                    {/* Dates */}
                    {onDateChange && (
                         <>
                              <div className="flex items-center justify-between md:block py-2 md:py-0 border-b border-slate-800/60 md:border-0">
                                   <p className="text-xs text-slate-400 md:mb-2 shrink-0">{t('taskDates.startDate')}</p>
                                   <DateField value={startDate || ''} onChange={(v) => onDateChange('start', v)} />
                              </div>
                              <div className="flex items-center justify-between md:block py-2 md:py-0 border-b border-slate-800/60 md:border-0">
                                   <p className="text-xs text-slate-400 md:mb-2 shrink-0">{t('taskDates.dueDate')}</p>
                                   <DateField value={endDate || ''} onChange={(v) => onDateChange('end', v)} min={startDate || undefined} />
                              </div>
                         </>
                    )}

                    {/* Recurring */}
                    <div className="flex items-center justify-between md:block py-2 md:py-0 border-b border-slate-800/60 md:border-0">
                         <p className="text-xs text-slate-400 md:mb-2 shrink-0">Cykliczność</p>
                         <button
                              onClick={onRecurringModalOpen}
                              className={`inline-flex items-center gap-1.5 py-0.5 text-xs transition cursor-pointer ${
                                   task.is_recurring ? 'text-brand-300 hover:text-brand-200' : 'text-slate-500 hover:text-slate-300'
                              }`}
                         >
                              {task.is_recurring && task.recurrence_interval && task.recurrence_type ? (
                                   <>
                                        <FaRedo className="w-2.5 h-2.5" />
                                        <span>Co {task.recurrence_interval} {task.recurrence_type === 'daily' ? (task.recurrence_interval === 1 ? 'dzień' : 'dni') : task.recurrence_type === 'weekly' ? (task.recurrence_interval === 1 ? 'tydzień' : 'tygodni') : task.recurrence_type === 'monthly' ? (task.recurrence_interval === 1 ? 'miesiąc' : 'miesięcy') : (task.recurrence_interval === 1 ? 'rok' : 'lat')}</span>
                                   </>
                              ) : (
                                   <span>Ustaw</span>
                              )}
                         </button>
                    </div>

                    {/* Subtask parent link */}
                    {isSubtask && task.parent_id && onOpenTask && (
                         <div className="flex items-center justify-between md:block py-2 md:py-0 border-b border-slate-800/60 md:border-0">
                              <p className="text-xs text-slate-400 md:mb-2 shrink-0">{t('taskMeta.subtask')}</p>
                              <button onClick={() => onOpenTask(task.parent_id!)} className="text-xs text-brand-400 hover:text-brand-300 transition">
                                   {t('taskMeta.viewStory')} →
                              </button>
                         </div>
                    )}



               </div>
          </aside>
     );
};

export default TaskMetadataSidebar;
