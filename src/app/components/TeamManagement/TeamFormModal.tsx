'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiUsers, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Select, { StylesConfig } from 'react-select';
import CustomSelect from './CustomSelect';
import { TeamFormModalProps, CustomSelectOption } from '@/app/types/globalTypes';

type BoardOption = { value: string; label: string };

const customSelectStyles: StylesConfig<BoardOption, true> = {
     control: (base, state) => ({
          ...base,
          backgroundColor: '#1e293b',
          borderColor: state.isFocused ? '#00a68b' : '#475569',
          borderRadius: '12px',
          minHeight: '48px',
          boxShadow: state.isFocused ? '0 0 0 1px #00a68b' : 'none',
          '&:hover': { borderColor: '#00a68b' },
     }),
     placeholder: (base) => ({
          ...base,
          color: '#94a3b8',
     }),
     singleValue: (base) => ({
          ...base,
          color: '#fff',
     }),
     input: (base) => ({
          ...base,
          color: '#fff',
     }),
     multiValue: (base) => ({
          ...base,
          background: 'linear-gradient(to right, rgba(139,92,246,0.2), rgba(152,55,250,0.2))',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '12px',
     }),
     multiValueLabel: (base) => ({
          ...base,
          color: '#fff',
          fontWeight: 500,
     }),
     multiValueRemove: (base) => ({
          ...base,
          color: '#fff',
          ':hover': {
               backgroundColor: 'rgba(255,255,255,0.1)',
               color: '#fff',
          },
     }),
     menu: (base) => ({
          ...base,
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          overflow: 'hidden',
     }),
     option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? '#374151' : '#1e293b',
          color: '#fff',
          cursor: 'pointer',
     }),
     dropdownIndicator: (base) => ({
          ...base,
          color: '#94a3b8',
     }),
     clearIndicator: (base) => ({
          ...base,
          color: '#94a3b8',
     }),
     indicatorSeparator: (base) => ({
          ...base,
          backgroundColor: '#475569',
     }),
     menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
     }),
};

export default function TeamFormModal({
     isOpen,
     onClose,
     onSubmit,
     isCreatingTeam,
     editingTeamId,
     newTeamName,
     setNewTeamName,
     newTeamMembers,
     setNewTeamMembers,
     editedTeamName,
     setEditedTeamName,
     editedTeamMembers,
     setEditedTeamMembers,
     availableUsers,
     boards,
     selectedBoardIds,
     setSelectedBoardIds,
}: TeamFormModalProps) {
     const { t } = useTranslation();
     const modalRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
          if (!isOpen) return;
          const onKey = (e: KeyboardEvent) => {
               if (e.key === 'Escape') onClose();
          };
          document.addEventListener('keydown', onKey);
          return () => document.removeEventListener('keydown', onKey);
     }, [isOpen, onClose]);

     const userOptions: CustomSelectOption[] = useMemo(
          () =>
               availableUsers.map((u) => ({
                    value: u.id!,
                    label: `${u.name} (${u.email})`,
                    image: u.image ?? undefined,
               })),
          [availableUsers],
     );

     const boardOptions: BoardOption[] = useMemo(() => boards.map((b) => ({ value: b.id, label: b.title })), [boards]);

     const selectedBoardOptions = useMemo(() => boardOptions.filter((opt) => selectedBoardIds.includes(opt.value)), [boardOptions, selectedBoardIds]);

     const handleMembersChange = (vals: string[] | null) => {
          const arr = vals || [];
          if (editingTeamId) {
               setEditedTeamMembers(arr);
          } else {
               setNewTeamMembers(arr);
          }
     };

     const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (editingTeamId) {
               setEditedTeamName(value);
          } else {
               setNewTeamName(value);
          }
     };

     const disableSubmit = isCreatingTeam || (editingTeamId ? !editedTeamName.trim() : !newTeamName.trim());

     const backdropV = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
     const modalV = {
          hidden: { opacity: 0, scale: 0.95, y: 50 },
          visible: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9, y: 80 },
     };

     return (
          <AnimatePresence>
               {isOpen && (
                    <motion.div className="fixed inset-0 z-50 overflow-y-auto" initial="hidden" animate="visible" exit="hidden">
                         <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm" variants={backdropV} onClick={onClose} />

                         <div className="flex items-center justify-center min-h-screen p-4 text-center">
                              <motion.div
                                   ref={modalRef}
                                   className="relative w-full max-w-2xl mx-auto overflow-visible rounded-2xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 text-left shadow-2xl"
                                   variants={modalV}
                                   initial="hidden"
                                   animate="visible"
                                   exit="exit"
                                   transition={{ duration: 0.25 }}
                              >
                                   {/* Header */}
                                   <div className="bg-gradient-to-r from-brand-600/20 to-brand-600/20 px-6 py-4 border-b border-slate-700/50">
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center space-x-3">
                                                  <div className="p-2 bg-gradient-to-r from-brand-600 to-brand-600 rounded-xl">
                                                       <FiUsers className="w-5 h-5 text-white" />
                                                  </div>
                                                  <div>
                                                       <h3 className="text-xl font-semibold text-white">{editingTeamId ? t('teams.editTeam') : t('teams.createNewTeam')}</h3>
                                                       <p className="text-slate-400 text-sm">{editingTeamId ? t('teams.updateTeamDetails') : t('teams.setupNewTeam')}</p>
                                                  </div>
                                             </div>
                                             <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all">
                                                  <FiX className="w-5 h-5" />
                                             </button>
                                        </div>
                                   </div>

                                   {/* Body */}
                                   <div className="p-6 space-y-6">
                                        {/* Boards */}
                                        <div className="space-y-2">
                                             <label className="flex items-center gap-2 text-sm font-medium text-white">
                                                  <FiSettings className="w-4 h-4 text-brand-400" />
                                                  {t('teams.boardsTab')}
                                             </label>
                                             <Select<BoardOption, true>
                                                  isMulti
                                                  closeMenuOnSelect={false}
                                                  hideSelectedOptions={false}
                                                  options={boardOptions}
                                                  value={selectedBoardOptions}
                                                  onChange={(opts) => setSelectedBoardIds(opts ? opts.map((o) => o.value) : [])}
                                                  placeholder={t('teams.selectBoards')}
                                                  styles={customSelectStyles}
                                                  menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                             />
                                        </div>

                                        {/* Team Name */}
                                        <div className="space-y-2">
                                             <label className="flex items-center gap-2 text-sm font-medium text-white">
                                                  <FiUsers className="w-4 h-4 text-brand-400" />
                                                  {t('teams.teamName')}
                                             </label>
                                             <input
                                                  type="text"
                                                  placeholder={t('teams.enterTeamName')}
                                                  value={editingTeamId ? editedTeamName : newTeamName}
                                                  onChange={handleNameChange}
                                                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                                             />
                                        </div>

                                        {/* Members */}
                                        <div className="space-y-2">
                                             <label className="flex items-center gap-2 text-sm font-medium text-white">
                                                  <FiUsers className="w-4 h-4 text-emerald-400" />
                                                  {t('teams.teamMembers')}
                                             </label>
                                             <CustomSelect isMulti options={userOptions} value={editingTeamId ? editedTeamMembers : newTeamMembers} onChange={handleMembersChange} />
                                        </div>
                                   </div>

                                   {/* Footer */}
                                   <div className="bg-slate-800/50 px-6 py-4 border-t border-slate-700/50 flex justify-end space-x-3">
                                        <button onClick={onClose} className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition">
                                             {t('common.cancel')}
                                        </button>
                                        <button
                                             onClick={onSubmit}
                                             disabled={disableSubmit}
                                             className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50"
                                        >
                                             {isCreatingTeam ? (
                                                  <>
                                                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                       {editingTeamId ? t('teams.updating') : t('teams.creating')}
                                                  </>
                                             ) : editingTeamId ? (
                                                  t('teams.updateTeam')
                                             ) : (
                                                  <>
                                                       <FiUsers className="w-4 h-4" />
                                                       {t('teams.createTeam')}
                                                  </>
                                             )}
                                        </button>
                                   </div>
                              </motion.div>
                         </div>
                    </motion.div>
               )}
          </AnimatePresence>
     );
}
