import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Search, UserPlus, UserMinus, Users, UsersRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TemplateSelector from "@/app/components/Board/TemplateSelector";
import CreateTemplateModal from "@/app/components/Board/CreateTemplateModal";
import { BoardTemplate, User, Team } from "@/app/types/globalTypes";
import { useGetAllUsersQuery, useGetMyTeamsQuery } from "@/app/store/apiSlice";

type MemberTab = "users" | "teams";

const BoardModal = ({
  isOpen,
  mode,
  initialTitle = "",
  onClose,
  onSave,
  onDelete,
  selectedTemplate,
  onTemplateSelect,
  templateRefreshTrigger,
  currentUserId,
}: {
  isOpen: boolean;
  mode: "create" | "edit" | "delete";
  initialTitle?: string;
  boardId?: string;
  onClose: () => void;
  onSave: (
    title: string,
    templateId?: string | null,
    memberIds?: string[]
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
  selectedTemplate?: BoardTemplate | null;
  onTemplateSelect?: (tpl: BoardTemplate | null) => void;
  templateRefreshTrigger?: number;
  currentUserId?: string;
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const templateSelectorRef = useRef<{ refreshTemplates: () => void }>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberTab, setMemberTab] = useState<MemberTab>("users");

  const { data: allUsers = [] } = useGetAllUsersQuery(undefined, {
    skip: mode !== "create",
  });

  const { data: myTeams = [] } = useGetMyTeamsQuery(currentUserId ?? "", {
    skip: mode !== "create" || !currentUserId,
  });

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (mode === "create" && templateSelectorRef.current) {
      templateSelectorRef.current.refreshTemplates();
    }
  }, [templateRefreshTrigger, mode]);

  // Pre-populate with creator when opening in create mode
  useEffect(() => {
    if (mode === "create" && currentUserId) {
      setSelectedMemberIds([currentUserId]);
      setSelectedTeamIds([]);
      setMemberSearch("");
      setMemberTab("users");
    }
  }, [mode, currentUserId, isOpen]);

  // Collect all user IDs from selected teams
  const teamMemberIds = useMemo(() => {
    const ids = new Set<string>();
    for (const team of myTeams) {
      if (selectedTeamIds.includes(team.id)) {
        for (const member of team.users) {
          ids.add(member.user_id);
        }
      }
    }
    return ids;
  }, [myTeams, selectedTeamIds]);

  // Merge: manually selected + team-sourced, always including creator
  const allSelectedMemberIds = useMemo(() => {
    const merged = new Set(selectedMemberIds);
    teamMemberIds.forEach((id) => merged.add(id));
    if (currentUserId) merged.add(currentUserId);
    return Array.from(merged);
  }, [selectedMemberIds, teamMemberIds, currentUserId]);

  const filteredUsers = useMemo(() => {
    if (!memberSearch.trim()) return allUsers;
    const term = memberSearch.toLowerCase();
    return allUsers.filter(
      (u: User) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }, [allUsers, memberSearch]);

  const filteredTeams = useMemo(() => {
    if (!memberSearch.trim()) return myTeams;
    const term = memberSearch.toLowerCase();
    return myTeams.filter((t: Team) => t.name.toLowerCase().includes(term));
  }, [myTeams, memberSearch]);

  const toggleMember = (userId: string) => {
    if (userId === currentUserId) return;
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSaveClick = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      alert("Board title is required");
      return;
    }
    try {
      if (mode === "create") {
        await onSave(
          trimmed,
          selectedTemplate?.id ?? null,
          allSelectedMemberIds
        );
      } else if (mode === "edit") {
        await onSave(trimmed);
      }
    } catch (err) {
      console.error("BoardModal onSave error:", err);
    }
  };

  const handleDeleteClick = async () => {
    if (onDelete) {
      try {
        await onDelete();
      } catch (err) {
        console.error("BoardModal onDelete error:", err);
      }
    }
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getUserAvatar = (user: User) => {
    const img = user.custom_image || user.image;
    if (img) {
      return (
        <img
          src={img}
          alt={user.name || ""}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    const initials = (user.name || user.email || "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return (
      <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-xs font-medium text-blue-300">
        {initials}
      </div>
    );
  };

  const totalSelected = allSelectedMemberIds.length;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-slate-900/95 border border-slate-700/50 text-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">
                  {mode === "create"
                    ? t('boardModal.createNew')
                    : mode === "edit"
                    ? t('boardModal.edit')
                    : t('boardModal.delete')}
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4">
                {(mode === "create" || mode === "edit") && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300">
                      {t('boardModal.boardTitle')}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-500 transition-colors"
                      placeholder={t('boardModal.enterTitle')}
                    />
                  </div>
                )}

                {mode === "create" && onTemplateSelect && (
                  <TemplateSelector
                    ref={templateSelectorRef}
                    selectedTemplate={selectedTemplate || undefined}
                    onTemplateSelect={onTemplateSelect}
                    onCreateTemplate={() => setShowCreateTemplateModal(true)}
                    disabled={false}
                    refreshTrigger={templateRefreshTrigger || 0}
                  />
                )}

                {/* Member & Team picker - only in create mode */}
                {mode === "create" && currentUserId && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300">
                      {t('boardModal.members')}
                    </label>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-2 bg-slate-800/60 rounded-lg p-1">
                      <button
                        onClick={() => setMemberTab("users")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          memberTab === "users"
                            ? "bg-blue-600/20 text-blue-400"
                            : "text-slate-400 hover:text-slate-300"
                        }`}
                      >
                        <Users size={14} />
                        {t('boardModal.usersTab')}
                      </button>
                      <button
                        onClick={() => setMemberTab("teams")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          memberTab === "teams"
                            ? "bg-blue-600/20 text-blue-400"
                            : "text-slate-400 hover:text-slate-300"
                        }`}
                      >
                        <UsersRound size={14} />
                        {t('boardModal.teamsTab')}
                        {selectedTeamIds.length > 0 && (
                          <span className="ml-1 text-xs bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded-full">
                            {selectedTeamIds.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-2">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-500 transition-colors"
                        placeholder={
                          memberTab === "users"
                            ? t('boardModal.searchUsers')
                            : t('boardModal.searchTeams')
                        }
                      />
                    </div>

                    {/* Users tab */}
                    {memberTab === "users" && (
                      <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-slate-700/50 bg-slate-900/30 p-1">
                        {filteredUsers.length === 0 && (
                          <p className="text-slate-500 text-sm text-center py-3">
                            {t('boardModal.noUsersFound')}
                          </p>
                        )}
                        {filteredUsers
                          .slice()
                          .sort((a: User, b: User) => {
                            if (a.id === currentUserId) return -1;
                            if (b.id === currentUserId) return 1;
                            return 0;
                          })
                          .map((user: User) => {
                            const isCreator = user.id === currentUserId;
                            const isSelected =
                              allSelectedMemberIds.includes(user.id);
                            const isFromTeam =
                              !selectedMemberIds.includes(user.id) &&
                              teamMemberIds.has(user.id);
                            return (
                              <div
                                key={user.id}
                                onClick={() => toggleMember(user.id)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                  isCreator
                                    ? "bg-blue-600/10 cursor-default"
                                    : isSelected
                                    ? "bg-blue-600/15 hover:bg-blue-600/20 cursor-pointer"
                                    : "hover:bg-slate-800/60 cursor-pointer"
                                }`}
                              >
                                {getUserAvatar(user)}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">
                                    {user.custom_name || user.name || t('common.unknown')}
                                    {isCreator && (
                                      <span className="ml-2 text-xs text-blue-400 font-normal">
                                        {t('boardModal.creator')}
                                      </span>
                                    )}
                                    {isFromTeam && !isCreator && (
                                      <span className="ml-2 text-xs text-emerald-400 font-normal">
                                        {t('boardModal.viaTeam')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-400 truncate">
                                    {user.email}
                                  </div>
                                </div>
                                {isCreator ? (
                                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center">
                                    <UserPlus
                                      size={14}
                                      className="text-blue-400"
                                    />
                                  </div>
                                ) : isSelected ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMember(user.id);
                                    }}
                                    className="w-7 h-7 rounded-full bg-red-600/20 flex items-center justify-center hover:bg-red-600/30 transition-colors"
                                  >
                                    <UserMinus
                                      size={14}
                                      className="text-red-400"
                                    />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMember(user.id);
                                    }}
                                    className="w-7 h-7 rounded-full bg-slate-700/50 flex items-center justify-center hover:bg-blue-600/20 transition-colors"
                                  >
                                    <UserPlus
                                      size={14}
                                      className="text-slate-400"
                                    />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Teams tab */}
                    {memberTab === "teams" && (
                      <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-slate-700/50 bg-slate-900/30 p-1">
                        {filteredTeams.length === 0 && (
                          <p className="text-slate-500 text-sm text-center py-3">
                            {myTeams.length === 0
                              ? t('boardModal.noTeamsAvailable')
                              : t('boardModal.noTeamsFound')}
                          </p>
                        )}
                        {filteredTeams.map((team: Team) => {
                          const isSelected = selectedTeamIds.includes(team.id);
                          const memberCount = team.users.length;
                          const previewUsers = team.users.slice(0, 4);
                          const extraCount = memberCount - previewUsers.length;
                          return (
                            <div
                              key={team.id}
                              onClick={() => toggleTeam(team.id)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600/15 hover:bg-blue-600/20"
                                  : "hover:bg-slate-800/60"
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-blue-600/25"
                                    : "bg-slate-700/60"
                                }`}
                              >
                                <UsersRound
                                  size={16}
                                  className={
                                    isSelected
                                      ? "text-blue-400"
                                      : "text-slate-400"
                                  }
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  {team.name}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {/* Avatar stack */}
                                  <div className="flex -space-x-1.5">
                                    {previewUsers.map((tm) => {
                                      const u = tm.user;
                                      const img = u.custom_image || u.image;
                                      return img ? (
                                        <img
                                          key={tm.id}
                                          src={img}
                                          alt=""
                                          className="w-4 h-4 rounded-full border border-slate-800 object-cover"
                                        />
                                      ) : (
                                        <div
                                          key={tm.id}
                                          className="w-4 h-4 rounded-full border border-slate-800 bg-slate-600 flex items-center justify-center text-[7px] text-slate-300"
                                        >
                                          {(u.name || u.email || "?")[0]
                                            .toUpperCase()}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <span className="text-xs text-slate-500 ml-1">
                                    {memberCount} {t('boardModal.member', { count: memberCount })}
                                    {extraCount > 0 && ` (+${extraCount})`}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-slate-600"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary */}
                    {totalSelected > 0 && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        {totalSelected} {t('boardModal.member', { count: totalSelected })} {t('boardModal.selected')}
                        {selectedTeamIds.length > 0 && (
                          <span className="text-slate-600">
                            {" "}
                            ({selectedTeamIds.length} {t('boardModal.teamsTab').toLowerCase()})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {mode === "delete" && (
                  <p className="text-red-400">
                    {t('boardModal.confirmDelete')}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 border border-slate-700/50 transition-colors"
                >
                  {t('boardModal.cancel')}
                </button>
                {mode === "delete" && onDelete ? (
                  <button
                    onClick={handleDeleteClick}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t('common.delete')}
                  </button>
                ) : (
                  <button
                    onClick={handleSaveClick}
                    disabled={!title.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {mode === "create" ? t('boardModal.create') : t('boardModal.save')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        onTemplateCreated={(newTpl) => {
          templateSelectorRef.current?.refreshTemplates();
          onTemplateSelect?.(newTpl);
          setShowCreateTemplateModal(false);
        }}
      />
    </>
  );
};

export default BoardModal;
