"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { FiX, FiUsers, FiSettings } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
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
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Convert user data into select options
  const userOptions: CustomSelectOption[] = useMemo(() => {
    return availableUsers.map((user) => ({
      value: user.id!,
      label: `${user.name} (${user.email})`,
      image: user.image ?? undefined,
    }));
  }, [availableUsers]);

  // Convert board data into select options
  const boardOptions = useMemo(
    () => boards.map((b) => ({ value: b.id, label: b.title })),
    [boards]
  );

  const selectedBoardOption = useMemo(() => {
    return boardOptions.find((b) => b.value === selectedBoardId) || null;
  }, [boardOptions, selectedBoardId]);

  // Custom styles for react-select
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
      singleValue: (base: any) => ({ ...base, color: "#fff" }),
      input: (base: any) => ({ ...base, color: "#fff" }),
      menu: (base: any) => ({
        ...base,
        backgroundColor: "#1e293b",
        border: "1px solid #475569",
        borderRadius: "12px",
        overflow: "hidden",
        zIndex: 9999,
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isFocused ? "#374151" : "#1e293b",
        color: "#fff",
      }),
      placeholder: (base: any) => ({ ...base, color: "#94a3b8" }),
      dropdownIndicator: (base: any) => ({ ...base, color: "#94a3b8" }),
      clearIndicator: (base: any) => ({ ...base, color: "#94a3b8" }),
      indicatorSeparator: (base: any) => ({
        ...base,
        backgroundColor: "#475569",
      }),
    }),
    []
  );

  const handleMembersChange = (selected: string[] | null) => {
    const newValue = selected || [];
    editingTeamId
      ? setEditedTeamMembers(newValue)
      : setNewTeamMembers(newValue);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editingTeamId
      ? setEditedTeamName(e.target.value)
      : setNewTeamName(e.target.value);
  };

  const disableSubmit =
    isCreatingTeam ||
    (editingTeamId ? !editedTeamName.trim() : !newTeamName.trim());

  // Motion variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 80 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={onClose}
          />

          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <motion.div
              ref={modalRef}
              className={`relative w-full max-w-2xl mx-auto overflow-visible rounded-2xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 text-left shadow-2xl`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
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
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Board Select */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white flex items-center gap-2">
                    <FiSettings className="w-4 h-4 text-purple-400" />
                    Board
                  </label>
                  <Select
                    options={boardOptions}
                    value={selectedBoardOption}
                    onChange={(option) =>
                      setSelectedBoardId(option?.value || "")
                    }
                    placeholder="Select a board..."
                    isClearable
                    onMenuOpen={() => setIsSelectOpen(true)}
                    onMenuClose={() => setIsSelectOpen(false)}
                    styles={selectStyles}
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
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
                    onChange={handleNameChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Members */}
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
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-600 hover:border-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={disableSubmit}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamFormModal;
