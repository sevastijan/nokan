// components/StatusSelector.tsx
import { useState, useRef } from 'react';
import { FaChevronDown, FaPlus, FaTrash } from 'react-icons/fa';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import { toast } from 'react-toastify';

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
     const [isOpen, setIsOpen] = useState(false);
     const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
     const [isAdding, setIsAdding] = useState(false);
     const [newLabel, setNewLabel] = useState('');
     const [newColor, setNewColor] = useState('#94a3b8');
     const dropdownRef = useRef<HTMLDivElement>(null);
     const inputRef = useRef<HTMLInputElement>(null);

     useOutsideClick([dropdownRef], () => {
          setIsOpen(false);
          setIsAdding(false);
          setNewLabel('');
     });

     const selectedStatus = statuses.find((s) => s.id === selectedStatusId);

     const handleAddStatus = async () => {
          const trimmed = newLabel.trim();
          if (!trimmed || !boardId) {
               toast.error('Brak nazwy lub boardId');
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

               toast.success(`Dodano: ${trimmed}`);
               setNewLabel('');
               setIsAdding(false);
          } catch {
               toast.error('Nie udało się dodać statusu');
          }
     };

     const handleDeleteStatus = async (statusId: string, e: React.MouseEvent) => {
          e.stopPropagation();

          const status = statuses.find((s) => s.id === statusId);
          if (!status) return;

          if (!confirm(`Na pewno usunąć status "${status.label}"?`)) return;

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

               toast.success('Status usunięty');
          } catch {
               toast.error('Nie udało się usunąć statusu');
          }
     };

     return (
          <div className="relative">
               {label && <span className="block text-sm font-medium text-slate-300 mb-2">{label}</span>}

               <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white transition-all ${
                         disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500'
                    }`}
               >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         {selectedStatus ? (
                              <>
                                   <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: selectedStatus.color }} />
                                   <span className="truncate font-medium">{selectedStatus.label}</span>
                              </>
                         ) : (
                              <span className="text-slate-400">Wybierz status...</span>
                         )}
                    </div>
                    {!disabled && <FaChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
               </button>

               {isOpen && !disabled && (
                    <div ref={dropdownRef} className="absolute z-50 w-full mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
                         <div className="max-h-64 overflow-y-auto">
                              {statuses.map((status) => (
                                   <button
                                        key={status.id}
                                        type="button"
                                        onClick={() => onChange(status.id)}
                                        className={`group w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                                             selectedStatusId === status.id ? 'bg-purple-600/20 text-white' : 'hover:bg-slate-600'
                                        }`}
                                   >
                                        <div className="flex items-center gap-3">
                                             <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                                             <span className="truncate font-medium">{status.label}</span>
                                        </div>

                                        {/* Kosz przy KAŻDYM statusie */}
                                        <button onClick={(e) => handleDeleteStatus(status.id, e)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                                             <FaTrash className="w-3.5 h-3.5" />
                                        </button>
                                   </button>
                              ))}

                              {isAdding ? (
                                   <div className="p-3 border-t border-slate-600 space-y-3">
                                        <input
                                             ref={inputRef}
                                             type="text"
                                             value={newLabel}
                                             onChange={(e) => setNewLabel(e.target.value)}
                                             onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                                             placeholder="Nazwa statusu"
                                             className="w-full px-3 py-2 bg-slate-600 rounded text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                             autoFocus
                                        />
                                        <div className="flex items-center gap-2">
                                             <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                                             <span className="text-xs text-slate-400">Kolor</span>
                                        </div>
                                        <div className="flex gap-2">
                                             <button onClick={handleAddStatus} className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded">
                                                  Dodaj
                                             </button>
                                             <button
                                                  onClick={() => {
                                                       setIsAdding(false);
                                                       setNewLabel('');
                                                  }}
                                                  className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded"
                                             >
                                                  Anuluj
                                             </button>
                                        </div>
                                   </div>
                              ) : (
                                   <button
                                        onClick={() => setIsAdding(true)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-purple-400 hover:bg-slate-600 transition-colors border-t border-slate-600"
                                   >
                                        <FaPlus className="w-4 h-4" />
                                        <span className="font-medium">Dodaj nowy status</span>
                                   </button>
                              )}
                         </div>
                    </div>
               )}
          </div>
     );
};

export default StatusSelector;
