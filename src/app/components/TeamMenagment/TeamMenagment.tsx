"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import {
  getTeams,
  addTeam,
  updateTeam,
  deleteTeam,
  getAllBoardsForUser,
} from "../../lib/api";
import { User } from "../SingleTaskView/types";
import { supabase } from "../../lib/supabase";
import DOMPurify from "dompurify";
import TeamList from "./TeamList";
import TeamFormModal from "./TeamFormModal";
import { Team, Board } from "./types";

const TeamManagement = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editedTeamName, setEditedTeamName] = useState("");
  const [editedTeamMembers, setEditedTeamMembers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");

  useEffect(() => {
    loadTeams();
    if (status === "authenticated") {
      loadUsers();
      loadBoards();
    }
  }, [status, session]);

  const loadTeams = async () => {
    try {
      const teamsData = await getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error("Error loading teams:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: users, error } = await supabase.from("users").select("*");
      if (error) throw error;
      setAvailableUsers(users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadBoards = async () => {
    try {
      const userEmail = session?.user?.email;
      if (!userEmail) {
        setBoards([]);
        return;
      }

      const boardsData = await getAllBoardsForUser(userEmail);
      setBoards(boardsData || []);
    } catch (error) {
      console.error("Error loading boards:", error);
      setBoards([]);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setIsCreatingTeam(true);
    try {
      const sanitizedTeamName = DOMPurify.sanitize(newTeamName);
      await addTeam(sanitizedTeamName, newTeamMembers, selectedBoardId);
      setNewTeamName("");
      setNewTeamMembers([]);
      setSelectedBoardId("");
      loadTeams();
    } catch (error) {
      console.error("Error creating team:", error);
    } finally {
      setIsCreatingTeam(false);
      setIsModalOpen(false);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditedTeamName(team.name);
    setEditedTeamMembers(team.users.map((user) => user.user_id));
    setSelectedBoardId(team.board_id || "");
    setIsModalOpen(true);
  };

  const handleUpdateTeam = async () => {
    if (!editingTeamId) return;
    try {
      const sanitizedTeamName = DOMPurify.sanitize(editedTeamName);
      await updateTeam(
        editingTeamId,
        sanitizedTeamName,
        editedTeamMembers,
        selectedBoardId
      );
      setEditingTeamId(null);
      setSelectedBoardId("");
      loadTeams();
    } catch (error) {
      console.error("Error updating team:", error);
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteTeam(teamId);
      loadTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeamId(null);
    setSelectedBoardId("");
  };

  const handleSubmit = async () => {
    if (editingTeamId) {
      await handleUpdateTeam();
    } else {
      await handleCreateTeam();
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0A0C1B] p-5 relative">
      <button
        onClick={handleBackToDashboard}
        className="flex cursor-pointer items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
      >
        <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Dashboard</span>
      </button>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Team Management</h2>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors"
        >
          Create New Team
        </button>
      </div>
      <div>
        <TeamList
          teams={teams}
          onEditTeam={handleEditTeam}
          onDeleteTeam={handleDeleteTeam}
          availableUsers={availableUsers}
        />
      </div>
      <TeamFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isCreatingTeam={isCreatingTeam}
        editingTeamId={editingTeamId}
        editedTeamName={editedTeamName}
        setEditedTeamName={setEditedTeamName}
        editedTeamMembers={editedTeamMembers}
        setEditedTeamMembers={setEditedTeamMembers}
        newTeamName={newTeamName}
        setNewTeamName={setNewTeamName}
        newTeamMembers={newTeamMembers}
        setNewTeamMembers={setNewTeamMembers}
        availableUsers={availableUsers}
        boards={boards}
        selectedBoardId={selectedBoardId}
        setSelectedBoardId={setSelectedBoardId}
      />
    </div>
  );
};

export default TeamManagement;
