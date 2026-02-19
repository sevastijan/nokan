import { useState, useRef } from 'react';
import { FaChevronDown, FaPlus, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import { toast } from 'sonner';

interface Status {
     id: string;
     label: string;
     color: string;
}

interface StatusSelectorProps {
     statuses: Status[];
     selectedStatusId: string | null;
     onChange: (statusId: string) => void;
     onStatusesChange?: (newStatuses: Status[]) => void;
     boardId?: string;
     disabled?: boolean;
     label?: string;
}

const StatusSelector = ({ statuses: initialStatuses, selectedStatusId, onChange, onStatusesChange, boardId, disabled = false, label = 'Status' }: StatusSelectorProps) => {
     const { t } = useTranslation();
     const [isOpen, setIsOpen] = useState(false);
     const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
     const [isAdding, setIsAdding] = useState(false);
     const [newLabel, setNewLabel] = useState('');
     const [newColor, setNewColor] = useState('#94a3b8');
     const containerRef = useRef<HTMLDivElement>(null);
     const inputRef = useRef<HTMLInputElement>(null);

     useOutsideClick([containerRef], () => {
          setIsOpen(false);
          setIsAdding(false);
          setNewLabel('');
     });

     const selectedStatus = statuses.find((s) => s.id === selectedStatusId);

     const handleAddStatus = async () => {
          const trimmed = newLabel.trim();
          if (!trimmed || !boardId) {
               toast.error(t('status.noNameOrBoardId'));
               return;
          }

          try {
               const res = await fetch('/api/statuses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ board_id: boardId, label: trimmed, color: newColor }),
               });

               if (!res.ok) throw new Error();

               const data = await res.json();
               const newStatus: Status = { id: data.id, label: data.label, color: data.color };

               const updated = [...statuses, newStatus];
               setStatuses(updated);
               onStatusesChange?.(updated);
               onChange(data.id);

               toast.success(t('status.added', { name: trimmed }));
               setNewLabel('');
               setIsAdding(false);
          } catch {
               toast.error(t('status.addFailed'));
          }
     };

     const handleDeleteStatus = async (statusId: string, e: React.MouseEvent) => {
          e.stopPropagation();

          const status = statuses.find((s) => s.id === statusId);
          if (!status) return;

          if (!confirm(t('status.confirmDelete', { label: status.label }))) return;

          try {
               const res = await fetch(`/api/statuses?id=${statusId}`, {
                    method: 'DELETE',
               });

               if (!res.ok) throw new Error();

               const updated = statuses.filter((s) => s.id !== statusId);
               setStatuses(updated);
               onStatusesChange?.(updated);

               if (selectedStatusId === statusId) {
                    onChange(updated[0]?.id || '');
               }

               toast.success(t('status.deleted'));
          } catch {
               toast.error(t('status.deleteFailed'));
          }
     };

     return (
          <div ref={containerRef} className="relative">
               {label && <span className="block text-sm font-medium text-slate-300 mb-2">{label}</span>}

               <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                         w-full flex items-center justify-between gap-3 px-3 py-2.5 min-h-[46px]
                         bg-slate-700/50 border rounded-lg text-white
                         transition-all duration-200
                         ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'}
                         ${isOpen ? 'border-purple-500/50 ring-2 ring-purple-500/50 bg-slate-700/70' : 'border-slate-600/50'}
                    `}
               >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                         {selectedStatus ? (
                              <>
                                   <div
                                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-md"
                                        style={{ backgroundColor: selectedStatus.color, boxShadow: `0 0 8px ${selectedStatus.color}40` }}
                                   />
                                   <span className="truncate font-medium text-sm">{selectedStatus.label}</span>
                              </>
                         ) : (
                              <span className="text-slate-500 text-sm">{t('status.selectStatus')}</span>
                         )}
                    </div>
                    {!disabled && <FaChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
               </button>

               {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-800 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
                         <div className="max-h-64 overflow-y-auto thin-scrollbar">
                              {statuses.map((status) => (
                                   <button
                                        key={status.id}
                                        type="button"
                                        onClick={() => {
                                             onChange(status.id);
                                             setIsOpen(false);
                                        }}
                                        className={`
                                             group w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left
                                             transition-all duration-150
                                             ${selectedStatusId === status.id ? 'bg-purple-500/15' : 'hover:bg-slate-700/50'}
                                        `}
                                   >
                                        <div className="flex items-center gap-2.5">
                                             <div
                                                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                                  style={{ backgroundColor: status.color, boxShadow: `0 0 6px ${status.color}30` }}
                                             />
                                             <span className={`truncate text-sm font-medium ${selectedStatusId === status.id ? 'text-white' : 'text-slate-300'}`}>
                                                  {status.label}
                                             </span>
                                        </div>

                                        <div
                                             role="button"
                                             onClick={(e) => handleDeleteStatus(status.id, e)}
                                             className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-150 p-1 hover:bg-red-500/10 rounded"
                                        >
                                             <FaTrash className="w-3 h-3" />
                                        </div>
                                   </button>
                              ))}

                              {isAdding ? (
                                   <div className="p-3 border-t border-slate-700/30 space-y-3 bg-slate-800/50">
                                        <input
                                             ref={inputRef}
                                             type="text"
                                             value={newLabel}
                                             onChange={(e) => setNewLabel(e.target.value)}
                                             onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                                             placeholder={t('status.statusName')}
                                             className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                             autoFocus
                                        />
                                        <div className="flex items-center gap-3">
                                             <input
                                                  type="color"
                                                  value={newColor}
                                                  onChange={(e) => setNewColor(e.target.value)}
                                                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-600/50"
                                             />
                                             <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: newColor, boxShadow: `0 0 8px ${newColor}40` }} />
                                             <span className="text-xs text-slate-500">{t('status.preview')}</span>
                                        </div>
                                        <div className="flex gap-2">
                                             <button
                                                  onClick={handleAddStatus}
                                                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                                             >
                                                  {t('common.add')}
                                             </button>
                                             <button
                                                  onClick={() => {
                                                       setIsAdding(false);
                                                       setNewLabel('');
                                                  }}
                                                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                                             >
                                                  {t('common.cancel')}
                                             </button>
                                        </div>
                                   </div>
                              ) : (
                                   <button
                                        onClick={() => setIsAdding(true)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-purple-400 hover:bg-slate-700/50 transition-all duration-150 border-t border-slate-700/30"
                                   >
                                        <FaPlus className="w-3.5 h-3.5" />
                                        <span className="text-sm font-medium">{t('status.addNew')}</span>
                                   </button>
                              )}
                         </div>
                    </div>
               )}
          </div>
     );
};

export default StatusSelector;
