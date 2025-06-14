"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiUsers } from "react-icons/fi";
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

  // Get current user (RTK Query)
  const { data: currentUser, isLoading: loadingCurrentUser } =
    useGetCurrentUserQuery(session!, {
      skip: status !== "authenticated" || !session,
    });
  const ownerId = currentUser?.id || "";

  // Selected board state for the BoardSelect
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  // Get all boards for user
  const { data: boardsWithCounts = [], isLoading: loadingBoards } =
    useGetMyBoardsQuery(ownerId, {
      skip: !ownerId,
    });

  // Prepare boards for select
  const boards: Board[] = useMemo(() => {
    if (!boardsWithCounts) return [];
    return boardsWithCounts.map((b) => ({
      id: b.id,
      title: b.title,
      owner_id: b.owner_id,
      ownerName: b.ownerName,
      ownerEmail: b.ownerEmail,
      columns: [],
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));
  }, [boardsWithCounts]);

  // Fetch all teams for this user
  const {
    data: teamsAll = [],
    isLoading: loadingTeams,
    refetch: refetchTeams,
  } = useGetTeamsQuery(ownerId, {
    skip: !ownerId,
  });

  // Filter teams by selected board
  const teamsForBoard: Team[] = useMemo(() => {
    if (!selectedBoardId) return [];
    return (teamsAll || []).filter((team) => team.board_id === selectedBoardId);
  }, [teamsAll, selectedBoardId]);

  // Team mutations
  const [addTeam, { isLoading: isAddingTeam }] = useAddTeamMutation();
  const [updateTeam, { isLoading: isUpdatingTeam }] = useUpdateTeamMutation();
  const [deleteTeamMutation, { isLoading: isDeletingTeam }] =
    useDeleteTeamMutation();

  // Load all users from Supabase for team assignment
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

  // Modal/form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [editedTeamName, setEditedTeamName] = useState("");
  const [editedTeamMembers, setEditedTeamMembers] = useState<string[]>([]);

  const handleBackToDashboard = () => router.push("/dashboard");

  // Modal open/close helpers
  const handleOpenModalForCreate = () => {
    setEditingTeamId(null);
    setNewTeamName("");
    setNewTeamMembers([]);
    setEditedTeamName("");
    setEditedTeamMembers([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeamId(null);
    setNewTeamName("");
    setNewTeamMembers([]);
    setEditedTeamName("");
    setEditedTeamMembers([]);
  };

  // Create new team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      alert("Enter a team name.");
      return;
    }
    if (!selectedBoardId) {
      alert("Select a board for the team.");
      return;
    }
    try {
      const sanitizedTeamName = DOMPurify.sanitize(newTeamName);
      await addTeam({
        name: sanitizedTeamName,
        owner_id: ownerId,
        board_id: selectedBoardId,
        members: newTeamMembers,
      }).unwrap();
      handleCloseModal();
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Could not create the team.");
    }
  };

  // Start editing team
  const handleEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditedTeamName(team.name);
    const memberIds = team.users.map((tm) => tm.user_id);
    setEditedTeamMembers(memberIds);
    setIsModalOpen(true);
  };

  // Save team edits
  const handleUpdateTeam = async () => {
    if (!editingTeamId) return;
    if (!editedTeamName.trim()) {
      alert("Enter a team name.");
      return;
    }
    if (!selectedBoardId) {
      alert("Select a board.");
      return;
    }
    try {
      const sanitizedTeamName = DOMPurify.sanitize(editedTeamName);
      await updateTeam({
        id: editingTeamId,
        name: sanitizedTeamName,
        owner_id: ownerId,
        board_id: selectedBoardId,
        members: editedTeamMembers,
      }).unwrap();
      handleCloseModal();
    } catch (error) {
      console.error("Error updating team:", error);
      alert("Could not update the team.");
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteTeamMutation(teamId).unwrap();
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Could not delete the team.");
    }
  };

  // Handle submit for form
  const handleSubmit = async () => {
    if (editingTeamId) {
      await handleUpdateTeam();
    } else {
      await handleCreateTeam();
    }
  };

  // Merge all loading states
  const isOverallLoading =
    loadingCurrentUser ||
    loadingBoards ||
    loadingTeams ||
    isAddingTeam ||
    isUpdatingTeam ||
    isDeletingTeam;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          {/* Custom Board Select */}
          <BoardSelect
            boards={boards}
            value={selectedBoardId}
            onChange={setSelectedBoardId}
            className="w-full md:w-64"
          />

          <button
            onClick={handleOpenModalForCreate}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2 w-fit"
            disabled={!selectedBoardId}
          >
            <FiPlus className="w-5 h-5" />
            Create New Team
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {teamsForBoard ? teamsForBoard.length : 0}
                </p>
                <p className="text-blue-200 text-sm mt-1">Teams in Board</p>
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

        {/* Teams List */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          {selectedBoardId ? (
            <TeamList
              teams={teamsForBoard || []}
              onEditTeam={handleEditTeam}
              onDeleteTeam={handleDeleteTeam}
              availableUsers={availableUsers}
            />
          ) : (
            <div className="text-white">
              Select a board from the menu above to view teams.
            </div>
          )}
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
        selectedBoardId={selectedBoardId}
        setSelectedBoardId={setSelectedBoardId}
      />
    </div>
  );
};

export default TeamManagement;
