'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Users, UserPlus, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import TeamList from './TeamList';
import TeamFormModal from './TeamFormModal';
import Loader from '../Loader';
import { Team } from '@/app/types/globalTypes';

import {
     useGetCurrentUserQuery,
     useGetMyBoardsQuery,
     useGetMyTeamsQuery,
     useAddTeamMutation,
     useUpdateTeamMutation,
     useDeleteTeamMutation,
     useUpdateTeamBoardsMutation,
     useGetAllUsersQuery,
} from '@/app/store/apiSlice';

const TeamManagement = () => {
     const { t } = useTranslation();
     const { data: session, status } = useSession();
     const router = useRouter();

     const { data: currentUser, isLoading: loadingUser } = useGetCurrentUserQuery(session!, {
          skip: status !== 'authenticated' || !session,
     });
     const ownerId = currentUser?.id ?? '';

     // fetch all boards
     const { data: boards = [], isLoading: loadingBoards } = useGetMyBoardsQuery(ownerId, { skip: !ownerId });

     // fetch all teams owned or joined
     const { data: teamsAll = [], isLoading: loadingTeams } = useGetMyTeamsQuery(ownerId, { skip: !ownerId });

     // RTK mutations
     const [addTeam, { isLoading: isAdding }] = useAddTeamMutation();
     const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
     const [deleteTeam] = useDeleteTeamMutation();
     const [updateTeamBoards] = useUpdateTeamBoardsMutation();

     // Fetch all users using RTK Query (includes custom_name and custom_image)
     const { data: availableUsers = [] } = useGetAllUsersQuery();

     // modal state
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

     const [newTeamName, setNewTeamName] = useState('');
     const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);

     const [editedTeamName, setEditedTeamName] = useState('');
     const [editedTeamMembers, setEditedTeamMembers] = useState<string[]>([]);

     // multiple boards selection
     const [modalBoardIds, setModalBoardIds] = useState<string[]>([]);

     const handleBack = () => router.push('/dashboard');

     const openCreate = () => {
          setEditingTeamId(null);
          setNewTeamName('');
          setNewTeamMembers([]);
          setEditedTeamName('');
          setEditedTeamMembers([]);
          setModalBoardIds([]);
          setIsModalOpen(true);
     };

     const openEdit = (team: Team) => {
          setEditingTeamId(team.id);
          setEditedTeamName(team.name);
          setEditedTeamMembers(team.users.map((u) => u.user_id));
          setModalBoardIds(team.board_id?.split(',') ?? []);
          setIsModalOpen(true);
     };

     const closeModal = () => {
          setIsModalOpen(false);
          setEditingTeamId(null);
          setModalBoardIds([]);
     };

     const handleCreate = async () => {
          if (!newTeamName.trim() || modalBoardIds.length === 0) {
               alert(t('teams.provideNameAndBoard'));
               return;
          }
          const created = await addTeam({
               name: DOMPurify.sanitize(newTeamName),
               owner_id: ownerId,
               members: newTeamMembers,
          }).unwrap();

          await updateTeamBoards({
               teamId: created.id,
               boardIds: modalBoardIds,
          }).unwrap();

          closeModal();
     };

     const handleUpdate = async () => {
          if (!editingTeamId || !editedTeamName.trim() || modalBoardIds.length === 0) {
               alert(t('teams.provideNameAndBoard'));
               return;
          }
          await updateTeam({
               id: editingTeamId,
               name: DOMPurify.sanitize(editedTeamName),
               owner_id: ownerId,
               members: editedTeamMembers,
          }).unwrap();

          await updateTeamBoards({
               teamId: editingTeamId,
               boardIds: modalBoardIds,
          }).unwrap();

          closeModal();
     };

     const handleSubmit = editingTeamId ? handleUpdate : handleCreate;

     const handleDelete = async (id: string) => {
          if (confirm(t('teams.deleteConfirm'))) {
               await deleteTeam(id).unwrap();
          }
     };

     const loadingOverall = loadingUser || loadingBoards || loadingTeams;

     if (loadingOverall) {
          return <Loader text={t('teams.loading')} />;
     }

     const stats = [
          { label: t('teams.teamsLabel'), value: teamsAll.length, icon: Users, color: 'blue' },
          { label: t('teams.availableUsers'), value: availableUsers.length, icon: UserPlus, color: 'emerald' },
          { label: t('teams.boardsLabel'), value: boards.length, icon: LayoutGrid, color: 'violet' },
     ];

     const iconColorMap: Record<string, string> = {
          blue: 'bg-blue-500/10 text-blue-400',
          emerald: 'bg-emerald-500/10 text-emerald-400',
          violet: 'bg-violet-500/10 text-violet-400',
     };

     return (
          <div className="min-h-screen bg-slate-900">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    {/* Back button */}
                    <motion.button
                         onClick={handleBack}
                         className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                         whileHover={{ x: -4 }}
                         whileTap={{ scale: 0.95 }}
                    >
                         <ArrowLeft className="w-5 h-5" />
                         {t('teams.backToDashboard')}
                    </motion.button>

                    {/* Header */}
                    <motion.div
                         className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
                         initial={{ opacity: 0, y: -20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.4 }}
                    >
                         <div>
                              <h1 className="text-4xl font-bold text-white">{t('teams.manageTeams')}</h1>
                              <p className="text-slate-400 mt-1">{t('teams.manageTeamsDesc')}</p>
                         </div>
                         <motion.button
                              onClick={openCreate}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors self-start"
                              whileTap={{ scale: 0.95 }}
                         >
                              <Plus className="w-5 h-5" />
                              {t('teams.createNewTeam')}
                         </motion.button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                         className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.4, delay: 0.1 }}
                    >
                         {stats.map((stat) => (
                              <div
                                   key={stat.label}
                                   className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4"
                              >
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColorMap[stat.color]}`}>
                                        <stat.icon className="w-5 h-5" />
                                   </div>
                                   <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-slate-400 text-sm">{stat.label}</p>
                                   </div>
                              </div>
                         ))}
                    </motion.div>

                    {/* Team List */}
                    <motion.div
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.4, delay: 0.2 }}
                    >
                         <TeamList teams={teamsAll} onEditTeam={openEdit} onDeleteTeam={handleDelete} availableUsers={availableUsers} />
                         {(isAdding || isUpdating) && <p className="text-slate-400 mt-4">{t('teams.savingTeam')}</p>}
                    </motion.div>
               </div>

               {/* Modal */}
               <TeamFormModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    isCreatingTeam={isAdding || isUpdating}
                    editingTeamId={editingTeamId}
                    newTeamName={newTeamName}
                    setNewTeamName={setNewTeamName}
                    newTeamMembers={newTeamMembers}
                    setNewTeamMembers={setNewTeamMembers}
                    editedTeamName={editedTeamName}
                    setEditedTeamName={setEditedTeamName}
                    editedTeamMembers={editedTeamMembers}
                    setEditedTeamMembers={setEditedTeamMembers}
                    availableUsers={availableUsers}
                    boards={boards}
                    selectedBoardIds={modalBoardIds}
                    setSelectedBoardIds={setModalBoardIds}
               />
          </div>
     );
};

export default TeamManagement;
