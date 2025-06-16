// ===========================
// 📁 src/app/components/TeamManagement/TeamManagement.tsx
// ===========================

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiUsers } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import DOMPurify from "dompurify";
import TeamList from "./TeamList";
import TeamFormModal from "./TeamFormModal";
import BoardSelect from "@/app/components/Calendar/BoardSelect";
import { User, Team, Board } from "@/app/types/globalTypes";
import {
  useGetCurrentUserQuery,
  useGetTeamsQuery,
  useAddTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetMyBoardsQuery,
} from "@/app/store/apiSlice";

const TeamManagement = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: currentUser, isLoading: loadingCurrentUser } =
    useGetCurrentUserQuery(session!, {
      skip: status !== "authenticated" || !session,
    });
  const ownerId = currentUser?.id || "";

  const { data: boardsWithCounts = [], isLoading: loadingBoards } =
    useGetMyBoardsQuery(ownerId, { skip: !ownerId });

  const boards: Board[] = useMemo(() => {
    return boardsWithCounts.map((b) => ({
      id: b.id,
      title: b.title,
      owner_id: currentUser?.id || "",
      ownerName: b.ownerName || "",
      ownerEmail: b.ownerEmail || "",
      columns: [],
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));
  }, [boardsWithCounts, currentUser]);

  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  const { data: teamsAll = [], isLoading: loadingTeams } = useGetTeamsQuery(
    ownerId,
    { skip: !ownerId }
  );

  const teamsForBoard: Team[] = useMemo(() => {
    if (!selectedBoardId) return teamsAll;
    return teamsAll.filter((team) => team.board_id === selectedBoardId);
  }, [teamsAll, selectedBoardId]);

  const [addTeam, { isLoading: isAddingTeam }] = useAddTeamMutation();
  const [updateTeam, { isLoading: isUpdatingTeam }] = useUpdateTeamMutation();
  const [deleteTeamMutation, { isLoading: isDeletingTeam }] =
    useDeleteTeamMutation();

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const loadUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, name, email, image");
      if (error) throw error;
      setAvailableUsers(users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && currentUser) {
      loadUsers();
    }
  }, [status, currentUser]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [editedTeamName, setEditedTeamName] = useState("");
  const [editedTeamMembers, setEditedTeamMembers] = useState<string[]>([]);
  const [modalBoardId, setModalBoardId] = useState<string>("");

  const handleBackToDashboard = () => router.push("/dashboard");

  const handleOpenModalForCreate = () => {
    setEditingTeamId(null);
    setNewTeamName("");
    setNewTeamMembers([]);
    setEditedTeamName("");
    setEditedTeamMembers([]);
    setModalBoardId("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeamId(null);
    setNewTeamName("");
    setNewTeamMembers([]);
    setEditedTeamName("");
    setEditedTeamMembers([]);
    setModalBoardId("");
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !modalBoardId) {
      alert("Please provide team name and select a board.");
      return;
    }
    try {
      const name = DOMPurify.sanitize(newTeamName);
      await addTeam({
        name,
        owner_id: ownerId,
        board_id: modalBoardId,
        members: newTeamMembers,
      }).unwrap();
      handleCloseModal();
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team.");
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditedTeamName(team.name);
    setEditedTeamMembers(team.users.map((u) => u.user_id));
    setModalBoardId(team.board_id ?? "");
    setIsModalOpen(true);
  };

  const handleUpdateTeam = async () => {
    if (!editingTeamId || !editedTeamName.trim() || !modalBoardId) return;
    try {
      const name = DOMPurify.sanitize(editedTeamName);
      await updateTeam({
        id: editingTeamId,
        name,
        owner_id: ownerId,
        board_id: modalBoardId,
        members: editedTeamMembers,
      }).unwrap();
      handleCloseModal();
    } catch (error) {
      console.error("Error updating team:", error);
      alert("Failed to update team.");
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    try {
      await deleteTeamMutation(id).unwrap();
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Failed to delete team.");
    }
  };

  const handleSubmit = async () => {
    editingTeamId ? await handleUpdateTeam() : await handleCreateTeam();
  };

  const isOverallLoading =
    loadingCurrentUser ||
    loadingBoards ||
    loadingTeams ||
    isAddingTeam ||
    isUpdatingTeam ||
    isDeletingTeam;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <AnimatePresence>
            <motion.div
              key="board-select"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full md:w-64"
            >
              <BoardSelect
                boards={boards}
                value={selectedBoardId}
                onChange={setSelectedBoardId}
              />
            </motion.div>
          </AnimatePresence>

          <button
            onClick={handleOpenModalForCreate}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2 w-fit"
          >
            <FiPlus className="w-5 h-5" />
            Create New Team
          </button>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{teamsForBoard.length}</p>
                <p className="text-blue-200 text-sm mt-1">
                  Teams {selectedBoardId ? "in Board" : "Total"}
                </p>
              </div>
              <div className="bg-blue-500/30 p-3 rounded-xl">
                <FiUsers className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{availableUsers.length}</p>
                <p className="text-purple-200 text-sm mt-1">Available Users</p>
              </div>
              <div className="bg-purple-500/30 p-3 rounded-xl">
                <FiUsers className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{boards.length}</p>
                <p className="text-emerald-200 text-sm mt-1">Active Boards</p>
              </div>
              <div className="bg-emerald-500/30 p-3 rounded-xl">
                <FiUsers className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <TeamList
            teams={teamsForBoard}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
            availableUsers={availableUsers}
          />
          {isOverallLoading && (
            <div className="mt-4 text-white">Loading...</div>
          )}
        </div>
      </div>

      <TeamFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isCreatingTeam={isAddingTeam || isUpdatingTeam}
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
        selectedBoardId={modalBoardId}
        setSelectedBoardId={setModalBoardId}
      />
    </div>
  );
};

export default TeamManagement;
