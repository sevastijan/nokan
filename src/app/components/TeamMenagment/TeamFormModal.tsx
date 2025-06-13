// src/app/components/TeamManagement/TeamFormModal.tsx
"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { FiX, FiUsers, FiSettings } from "react-icons/fi";
import Select from "react-select";
import CustomSelect from "./CustomSelect";
import {
  TeamFormModalProps,
  CustomSelectOption,
} from "@/app/types/globalTypes";

const TeamFormModal = ({
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
  selectedBoardId,
  setSelectedBoardId,
}: TeamFormModalProps) => {
  // 1. Hooki zawsze wywoływane w tej samej kolejności:
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // 2. Zamknięcie modal przy ESC:
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // 3. Przygotowanie opcji do selectów:
  // Typ CustomSelectOption powinien być zdefiniowany jako:
  // interface CustomSelectOption { value: string; label: string; image?: string; }
  const userOptions: CustomSelectOption[] = useMemo(
    () =>
      availableUsers
        .filter((u) => u.id) // upewnijmy się, że istnieje id
        .map((user) => ({
          value: user.id!,
          label: `${user.name} (${user.email})`,
          image: user.image ?? undefined,
        })),
    [availableUsers]
  );

  const boardOptions = useMemo(
    () =>
      boards.map((board) => ({
        value: board.id,
        label: board.title,
      })),
    [boards]
  );

  // 4. Wybrana opcja board:
  const selectedBoardOption = useMemo(() => {
    return boardOptions.find((b) => b.value === selectedBoardId) || null;
  }, [boardOptions, selectedBoardId]);

  // 5. Style dla React-Select:
  const selectStyles = useMemo(
    () => ({
      control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "#1e293b",
        borderColor: state.isFocused ? "#8b5cf6" : "#475569",
        borderRadius: "12px",
        minHeight: "48px",
        boxShadow: state.isFocused ? "0 0 0 1px #8b5cf6" : "none",
        "&:hover": {
          borderColor: "#8b5cf6",
        },
      }),
      singleValue: (base: any) => ({
        ...base,
        color: "#ffffff",
      }),
      input: (base: any) => ({
        ...base,
        color: "#ffffff",
      }),
      menu: (base: any) => ({
        ...base,
        backgroundColor: "#1e293b",
        border: "1px solid #475569",
        borderRadius: "12px",
        overflow: "hidden",
        zIndex: 9999,
      }),
      menuPortal: (base: any) => ({
        ...base,
        zIndex: 9999,
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isFocused ? "#374151" : "#1e293b",
        color: "#ffffff",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#374151",
        },
      }),
      placeholder: (base: any) => ({
        ...base,
        color: "#94a3b8",
      }),
      dropdownIndicator: (base: any) => ({
        ...base,
        color: "#94a3b8",
      }),
      clearIndicator: (base: any) => ({
        ...base,
        color: "#94a3b8",
      }),
      indicatorSeparator: (base: any) => ({
        ...base,
        backgroundColor: "#475569",
      }),
    }),
    []
  );

  // 6. Handler zmiany wyboru użytkowników w CustomSelect:
  const handleMembersChange = (selectedValues: string[] | null) => {
    // selectedValues to array of user IDs lub null
    if (!selectedValues) {
      if (editingTeamId) {
        setEditedTeamMembers([]);
      } else {
        setNewTeamMembers([]);
      }
    } else {
      if (editingTeamId) {
        setEditedTeamMembers(selectedValues);
      } else {
        setNewTeamMembers(selectedValues);
      }
    }
  };

  // 7. Jeśli modal nie jest otwarty, zwróć null (hooki już zostały wywołane)
  if (!isOpen) {
    return null;
  }

  // 8. JSX modala:
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={`relative transform overflow-visible rounded-2xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl ${
            isSelectOpen ? "min-h-[600px]" : ""
          }`}
          style={{
            maxHeight: isSelectOpen ? "calc(100vh - 2rem)" : "auto",
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <FiUsers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {editingTeamId ? "Edit Team" : "Create New Team"}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {editingTeamId
                      ? "Update team details and members"
                      : "Set up a new team for collaboration"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Board Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white flex items-center gap-2">
                <FiSettings className="w-4 h-4 text-purple-400" />
                Board
              </label>
              <Select
                options={boardOptions}
                value={selectedBoardOption}
                onChange={(option) =>
                  setSelectedBoardId(option ? option.value : "")
                }
                placeholder="Select a board..."
                isClearable
                onMenuOpen={() => setIsSelectOpen(true)}
                onMenuClose={() => setIsSelectOpen(false)}
                styles={selectStyles}
                menuPortalTarget={document.body}
              />
            </div>

            {/* Team Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-blue-400" />
                Team Name
              </label>
              <input
                type="text"
                placeholder="Enter team name..."
                value={editingTeamId ? editedTeamName : newTeamName}
                onChange={(e) => {
                  if (editingTeamId) {
                    setEditedTeamName(e.target.value);
                  } else {
                    setNewTeamName(e.target.value);
                  }
                }}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-emerald-400" />
                Team Members
              </label>
              <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-1">
                <CustomSelect
                  isMulti
                  options={userOptions}
                  value={editingTeamId ? editedTeamMembers : newTeamMembers}
                  onChange={handleMembersChange}
                  onDropdownToggle={setIsSelectOpen}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-800/50 px-6 py-4 border-t border-slate-700/50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-200 border border-slate-600 hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={
                isCreatingTeam ||
                (editingTeamId
                  ? editedTeamName.trim() === ""
                  : newTeamName.trim() === "")
              }
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreatingTeam ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editingTeamId ? "Updating..." : "Creating..."}
                </>
              ) : editingTeamId ? (
                "Update Team"
              ) : (
                <>
                  <FiUsers className="w-4 h-4" />
                  Create Team
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamFormModal;
