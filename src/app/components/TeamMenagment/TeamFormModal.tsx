import React, { useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";
import CustomSelect from "./CustomSelect";
import { TeamFormModalProps } from "./types";
import Select from "react-select";
import { getAllBoardsForUser } from "../../lib/api";

const TeamFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isCreatingTeam,
  editingTeamId,
  editedTeamName,
  setEditedTeamName,
  editedTeamMembers,
  setEditedTeamMembers,
  newTeamName,
  setNewTeamName,
  newTeamMembers,
  setNewTeamMembers,
  availableUsers,
  boards,
  selectedBoardId,
  setSelectedBoardId,
}: TeamFormModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const userOptions = availableUsers.map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
    image: user.image,
  }));

  const boardOptions = boards.map((board) => ({
    value: board.id,
    label: board.title,
  }));

  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-30 bg-[#334155]/70 flex items-center justify-center">
      <div
        ref={modalRef}
        className="flex flex-col gap-6 w-full max-w-lg mx-2 rounded-2xl shadow-xl bg-[#334155] relative px-4 pt-5 pb-4 sm:p-6 sm:pb-4"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-white focus:outline-none"
          aria-label="Close"
          type="button"
        >
          <FiX size={24} />
        </button>
        <h3 className="text-lg leading-6 font-medium text-white">
          {editingTeamId ? "Edit Team" : "Create New Team"}
        </h3>
        <div>
          <span className="block text-gray-200 text-sm font-bold mb-2">
            Board:
          </span>
          <Select
            options={boardOptions}
            value={
              boardOptions.find((b) => b.value === selectedBoardId) || null
            }
            onChange={(option) =>
              setSelectedBoardId(option ? option.value : "")
            }
            placeholder="Select board..."
            isClearable
            styles={{
              control: (base, state) => ({
                ...base,
                backgroundColor: "#1E293B",
                color: "white",
                borderColor: "#334155",
                boxShadow: state.isFocused
                  ? "0 0 0 1px #6366F1"
                  : base.boxShadow,
              }),
              singleValue: (base) => ({
                ...base,
                color: "white",
              }),
              input: (base) => ({
                ...base,
                color: "white",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#1E293B",
                color: "white",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? "#334155" : "#1E293B",
                color: "white",
                cursor: "pointer",
              }),
              placeholder: (base) => ({
                ...base,
                color: "#94a3b8",
              }),
              dropdownIndicator: (base) => ({
                ...base,
                color: "#94a3b8",
              }),
              indicatorSeparator: (base) => ({
                ...base,
                backgroundColor: "#334155",
              }),
            }}
          />
          <span className="block text-gray-200 text-sm font-bold mb-2">
            Team Name:
          </span>
          <input
            type="text"
            id="teamName"
            placeholder="Team name"
            value={editingTeamId ? editedTeamName : newTeamName}
            onChange={(e) => {
              if (editingTeamId) {
                setEditedTeamName(e.target.value);
              } else {
                setNewTeamName(e.target.value);
              }
            }}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            style={{ backgroundColor: "#1E293B", color: "white" }}
          />
          <span className="block text-gray-200 text-sm font-bold mb-2 mt-4">
            Team Members:
          </span>
          <CustomSelect
            isMulti
            options={userOptions}
            value={editingTeamId ? editedTeamMembers : newTeamMembers}
            onChange={editingTeamId ? setEditedTeamMembers : setNewTeamMembers}
          />
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            className="w-full inline-flex cursor-pointer justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500  sm:w-auto sm:text-sm"
            onClick={onSubmit}
            disabled={isCreatingTeam}
            style={{ backgroundColor: "#4F46E5" }}
          >
            {isCreatingTeam
              ? "Creating..."
              : editingTeamId
              ? "Update Team"
              : "Create Team"}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex cursor-pointer justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 text-base font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0  sm:w-auto sm:text-sm text-white"
            onClick={onClose}
            style={{ backgroundColor: "#334155" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamFormModal;
