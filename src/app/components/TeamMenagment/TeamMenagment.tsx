"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiUsers } from "react-icons/fi";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
              </button>
              <div className="w-px h-6 bg-slate-600"></div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <FiUsers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Team Management
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Manage your teams and collaborators
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
            >
              <FiPlus className="w-5 h-5" />
              Create New Team
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{teams.length}</p>
                <p className="text-blue-200 text-sm mt-1">Total Teams</p>
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
          <TeamList
            teams={teams}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
            availableUsers={availableUsers}
          />
        </div>
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
