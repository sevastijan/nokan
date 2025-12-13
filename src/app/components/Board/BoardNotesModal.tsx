'use client';

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import BoardNotesEditor from './BoardNotesEditor';
import { useGetBoardNotesQuery, useSaveBoardNotesMutation } from '@/app/store/apiSlice';
import { toast } from 'sonner';

interface BoardNotesModalProps {
     isOpen: boolean;
     onClose: () => void;
     boardId: string;
}

export default function BoardNotesModal({ isOpen, onClose, boardId }: BoardNotesModalProps) {
     const modalRef = useRef<HTMLDivElement>(null);

     const { data: notes, isLoading } = useGetBoardNotesQuery(boardId, {
          skip: !isOpen,
     });

     const [saveNotes, { isLoading: isSaving }] = useSaveBoardNotesMutation();

     useEffect(() => {
          if (!isOpen) return;

          const handleEscape = (e: KeyboardEvent) => {
               if (e.key === 'Escape') onClose();
          };

          document.addEventListener('keydown', handleEscape);
          document.body.style.overflow = 'hidden';

          return () => {
               document.removeEventListener('keydown', handleEscape);
               document.body.style.overflow = 'unset';
          };
     }, [isOpen, onClose]);

     useEffect(() => {
          if (!isOpen) return;

          const handleClickOutside = (e: MouseEvent) => {
               if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                    onClose();
               }
          };

          setTimeout(() => {
               document.addEventListener('mousedown', handleClickOutside);
          }, 100);

          return () => {
               document.removeEventListener('mousedown', handleClickOutside);
          };
     }, [isOpen, onClose]);

     const handleSave = async (content: string) => {
          try {
               await saveNotes({
                    boardId,
                    content: { html: content },
               }).unwrap();
               toast.success('Notatki zostały zapisane');
          } catch (error) {
               console.error('Error saving notes:', error);
               toast.error('Nie udało się zapisać notatek');
          }
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
               <div ref={modalRef} className="w-full max-w-5xl h-[85vh] bg-slate-800 rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
                         <h2 className="text-xl font-bold text-slate-100">Board Notes</h2>
                         <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-slate-200" aria-label="Close notes">
                              <FiX className="w-6 h-6" />
                         </button>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 overflow-hidden">
                         {isLoading ? (
                              <div className="flex items-center justify-center h-full">
                                   <div className="text-slate-400">Ładowanie notatek...</div>
                              </div>
                         ) : (
                              <BoardNotesEditor initialContent={notes?.content?.html || null} onSave={handleSave} isSaving={isSaving} />
                         )}
                    </div>
               </div>
          </div>
     );
}
