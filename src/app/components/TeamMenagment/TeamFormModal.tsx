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
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const userOptions: CustomSelectOption[] = useMemo(
    () =>
      availableUsers.map((u) => ({
        value: u.id!,
        label: `${u.name} (${u.email})`,
        image: u.image ?? undefined,
      })),
    [availableUsers]
  );

  const boardOptions = useMemo(
    () => boards.map((b) => ({ value: b.id, label: b.title })),
    [boards]
  );

  const selectedBoardOptions = useMemo(
    () => boardOptions.filter((opt) => selectedBoardIds.includes(opt.value)),
    [boardOptions, selectedBoardIds]
  );

  const selectStyles = useMemo(
    () => ({
      control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "#1e293b",
        borderColor: state.isFocused ? "#8b5cf6" : "#475569",
        borderRadius: "12px",
        minHeight: "48px",
        boxShadow: state.isFocused ? "0 0 0 1px #8b5cf6" : "none",
        "&:hover": { borderColor: "#8b5cf6" },
      }),
      placeholder: (base: any) => ({ ...base, color: "#94a3b8" }),
      singleValue: (base: any) => ({ ...base, color: "#fff" }),
      input: (base: any) => ({ ...base, color: "#fff" }),

      // **this is the gradient + border on each selected chip**
      multiValue: (base: any) => ({
        ...base,
        background:
          "linear-gradient(to right, rgba(139,92,246,0.2), rgba(59,130,246,0.2))",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: "12px",
      }),
      multiValueLabel: (base: any) => ({
        ...base,
        color: "#fff",
        fontWeight: 500,
      }),
      multiValueRemove: (base: any) => ({
        ...base,
        color: "#fff",
        ":hover": {
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "#fff",
        },
      }),

      menu: (base: any) => ({
        ...base,
        backgroundColor: "#1e293b",
        borderRadius: "12px",
        overflow: "hidden",
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isFocused ? "#374151" : "#1e293b",
        color: "#fff",
        cursor: "pointer",
      }),
      dropdownIndicator: (base: any) => ({ ...base, color: "#94a3b8" }),
      clearIndicator: (base: any) => ({ ...base, color: "#94a3b8" }),
      indicatorSeparator: (base: any) => ({
        ...base,
        backgroundColor: "#475569",
      }),

      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    }),
    []
  );

  const handleMembersChange = (vals: string[] | null) => {
    const arr = vals || [];
    editingTeamId ? setEditedTeamMembers(arr) : setNewTeamMembers(arr);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editingTeamId
      ? setEditedTeamName(e.target.value)
      : setNewTeamName(e.target.value);
  };

  const disableSubmit =
    isCreatingTeam ||
    (editingTeamId ? !editedTeamName.trim() : !newTeamName.trim());

  const backdropV = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const modalV = {
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
            variants={backdropV}
            onClick={onClose}
          />

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
                {/* Boards */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <FiSettings className="w-4 h-4 text-purple-400" />
                    Boards
                  </label>
                  <Select
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    options={boardOptions}
                    value={selectedBoardOptions}
                    onChange={(opts) =>
                      setSelectedBoardIds(
                        Array.isArray(opts) ? opts.map((o) => o.value) : []
                      )
                    }
                    placeholder="Select boards..."
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
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <FiUsers className="w-4 h-4 text-blue-400" />
                    Team Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter team name..."
                    value={editingTeamId ? editedTeamName : newTeamName}
                    onChange={handleNameChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                {/* Members */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <FiUsers className="w-4 h-4 text-emerald-400" />
                    Team Members
                  </label>
                  <CustomSelect
                    isMulti
                    options={userOptions}
                    value={editingTeamId ? editedTeamMembers : newTeamMembers}
                    onChange={handleMembersChange}
                    onDropdownToggle={setIsSelectOpen}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-800/50 px-6 py-4 border-t border-slate-700/50 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={disableSubmit}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50"
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
}
