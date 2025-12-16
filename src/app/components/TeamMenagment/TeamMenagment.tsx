'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlus, FiUsers } from 'react-icons/fi';
import DOMPurify from 'dompurify';
import TeamList from './TeamList';
import TeamFormModal from './TeamFormModal';
import { Team } from '@/app/types/globalTypes';

import { useGetMyBoardsQuery, useGetMyTeamsQuery, useAddTeamMutation, useUpdateTeamMutation, useDeleteTeamMutation, useUpdateTeamBoardsMutation, useGetAllUsersQuery } from '@/app/store/apiSlice';

const TeamManagement = () => {
     const { data: session } = useSession();
     const router = useRouter();

     const userId = (session?.user as { id?: string } | undefined)?.id ?? '';

     const { data: boards = [], isLoading: loadingBoards } = useGetMyBoardsQuery(userId, {
          skip: !userId,
     });

     const { data: teamsAll = [], isLoading: loadingTeams } = useGetMyTeamsQuery(userId, {
          skip: !userId,
     });

     const [addTeam, { isLoading: isAdding }] = useAddTeamMutation();
     const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
     const [deleteTeam] = useDeleteTeamMutation();
     const [updateTeamBoards] = useUpdateTeamBoardsMutation();

     const { data: availableUsers = [] } = useGetAllUsersQuery();

     const [isModalOpen, setIsModalOpen] = useState(false);
     const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

     const [newTeamName, setNewTeamName] = useState('');
     const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);

     const [editedTeamName, setEditedTeamName] = useState('');
     const [editedTeamMembers, setEditedTeamMembers] = useState<string[]>([]);

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
               alert('Provide name and select at least one board.');
               return;
          }
          const created = await addTeam({
               name: DOMPurify.sanitize(newTeamName),
               owner_id: userId,
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
               alert('Provide name and select at least one board.');
               return;
          }
          await updateTeam({
               id: editingTeamId,
               name: DOMPurify.sanitize(editedTeamName),
               owner_id: userId,
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
          if (confirm('Delete this team?')) {
               await deleteTeam(id).unwrap();
          }
     };

     const loadingOverall = loadingBoards || loadingTeams || isAdding || isUpdating;

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
               <div className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
                    <div className="mx-auto px-4 py-4 flex items-center justify-between">
                         <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-white">
                              <FiArrowLeft />
                              Back to Dashboard
                         </button>
                         <button onClick={openCreate} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                              <FiPlus /> Create New Team
                         </button>
                    </div>
               </div>

               <div className="mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl text-white flex justify-between items-center">
                         <div>
                              <p className="text-2xl font-bold">{teamsAll.length}</p>
                              <p className="text-blue-200">Teams</p>
                         </div>
                         <FiUsers className="text-4xl" />
                    </div>
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-2xl text-white flex justify-between items-center">
                         <div>
                              <p className="text-2xl font-bold">{availableUsers.length}</p>
                              <p className="text-purple-200">Available Users</p>
                         </div>
                         <FiUsers className="text-4xl" />
                    </div>
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-2xl text-white flex justify-between items-center">
                         <div>
                              <p className="text-2xl font-bold">{boards.length}</p>
                              <p className="text-emerald-200">Boards</p>
                         </div>
                         <FiUsers className="text-4xl" />
                    </div>
               </div>

               <div className="mx-auto px-4 py-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
                    <TeamList teams={teamsAll} onEditTeam={openEdit} onDeleteTeam={handleDelete} availableUsers={availableUsers} />
                    {loadingOverall && <p className="text-white mt-4">Loading…</p>}
               </div>

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
