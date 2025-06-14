// src/app/components/Task.tsx
"use client";

import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  MouseEvent,
  RefObject,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMoreVertical, FiFlag, FiCalendar, FiUserPlus } from "react-icons/fi";
import Avatar from "./Avatar/Avatar";
import { Task as TaskType, User } from "@/app/types/globalTypes";
import {
  getPriorityStyleConfig,
  truncateText,
  useUserAvatar,
} from "@/app/utils/helpers";
import { useOutsideClick } from "@/app/hooks/useOutsideClick";

interface TaskProps {
  task: TaskType;
  columnId: string;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskDetail: (taskId: string) => void;
  priorities?: Array<{ id: string; label: string; color: string }>;
  taskIndex: number;
}

const Task = ({
  task,
  columnId,
  onRemoveTask,
  onOpenTaskDetail,
  priorities = [],
}: TaskProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Refs for menu trigger & menu container & menu items
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const viewEditRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  // Priority style: get config if priority exists
  const prio =
    task.priority &&
    (() => {
      const cfg = getPriorityStyleConfig(task.priority);
      const found = priorities.find((p) => p.id === task.priority);
      const label = found?.label || task.priority;
      const dotColor = found?.color || cfg.dotColor;
      return { label, cfg, dotColor };
    })();

  // Assignee avatar
  const assignee = (task.assignee as User) || null;
  const avatarUrl = useUserAvatar(assignee);

  // Menu items
  const menuItems: Array<{
    label: string;
    ref: RefObject<HTMLButtonElement | null>;
    action: () => void;
  }> = [
    {
      label: "View / Edit",
      ref: viewEditRef,
      action: () => {
        onOpenTaskDetail(task.id);
        closeMenu();
      },
    },
    {
      label: "Delete",
      ref: deleteRef,
      action: () => {
        closeMenu();
        setTimeout(() => onRemoveTask(columnId, task.id), 100);
      },
    },
  ];

  const openMenu = () => {
    setMenuOpen(true);
    setFocusedIndex(0);
  };
  const closeMenu = () => {
    setMenuOpen(false);
    setFocusedIndex(0);
    triggerRef.current?.focus();
  };

  // Trigger click/key handlers
  const onTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    menuOpen ? closeMenu() : openMenu();
  };
  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (["Enter", " ", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  };

  // Menu keyboard navigation
  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((idx) => (idx + 1) % menuItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((idx) => (idx - 1 >= 0 ? idx - 1 : menuItems.length - 1));
    } else if (["Escape", "Tab"].includes(e.key)) {
      e.preventDefault();
      closeMenu();
    } else if (["Enter", " "].includes(e.key)) {
      e.preventDefault();
      menuItems[focusedIndex].ref.current?.focus();
      menuItems[focusedIndex].action();
    }
  };

  // Focus first item when opening menu
  useEffect(() => {
    if (menuOpen) {
      setTimeout(() => {
        menuItems[0].ref.current?.focus();
      }, 0);
    }
  }, [menuOpen]);

  // Focus changed item
  useEffect(() => {
    if (menuOpen) {
      menuItems[focusedIndex].ref.current?.focus();
    }
  }, [focusedIndex, menuOpen]);

  //@ts-expect-error
  // Close on outside click/touch
  useOutsideClick([menuRef, triggerRef], () => {
    if (menuOpen) closeMenu();
  });

  // Card click opens detail if menu closed
  const onCardClick = () => {
    if (!menuOpen) {
      onOpenTaskDetail(task.id);
    }
  };

  // Left border accent: 4px wide. If priority exists, color by priority.dotColor; else transparent.
  const leftBorderStyle = prio
    ? { borderLeftColor: prio.dotColor }
    : { borderLeftColor: "transparent" };

  // Title / description presence checks
  const hasTitle = Boolean(task.title && task.title.trim());
  const titleDisplay = hasTitle ? (
    <span className="text-white">{task.title}</span>
  ) : (
    <span className="text-white/50 italic">Untitled</span>
  );
  const hasDesc = Boolean(task.description && task.description.trim());

  // Metadata presence: priority badge or due date
  const showMeta = Boolean(prio || task.due_date);

  // If entirely empty (no title, no desc, no metadata), render minimal placeholder
  const isEmptyCard = !hasTitle && !hasDesc && !showMeta;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.1, ease: "easeOut" } }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      onClick={onCardClick}
      className={`
        relative cursor-pointer group transition-shadow duration-200 ease-in-out
        bg-white/5 backdrop-blur-md border border-white/25 rounded-lg overflow-hidden hover:shadow-lg
        ${isEmptyCard ? "min-h-[60px]" : "min-h-[88px]"}
      `}
      style={{
        borderLeftWidth: "4px",
        borderLeftStyle: "solid",
        ...leftBorderStyle,
      }}
    >
      {/* Trigger (three dots) */}
      <button
        ref={triggerRef}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        className="
          absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100
          bg-transparent hover:bg-white/20 focus:bg-white/20 transition-colors z-10
        "
        aria-haspopup="true"
        aria-expanded={menuOpen}
      >
        <FiMoreVertical size={18} className="text-white/80" />
      </button>

      {/* Main content */}
      {isEmptyCard ? (
        // Center “Untitled” vertically if no content
        <div className="h-full flex items-center justify-center px-4">
          <h4 className="text-white/50 italic truncate">Untitled</h4>
        </div>
      ) : (
        <div className="p-4 flex flex-col">
          {/* Title */}
          <h4 className="text-white font-semibold text-base leading-snug truncate">
            {titleDisplay}
          </h4>

          {/* Description or spacer */}
          {hasDesc ? (
            <p className="text-white/75 text-sm mt-1 truncate">
              {truncateText(task.description!, 20)}
            </p>
          ) : (
            <div className="mt-1 h-[4px]" />
          )}

          {/* Metadata row */}
          <div className="mt-3 flex items-center justify-between">
            {/* Left: priority badge and/or due date */}
            <div className="flex items-center gap-2">
              {prio && (
                <span
                  className={`
                    inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium
                    ${prio.cfg.bgColor} ${prio.cfg.textColor} ${prio.cfg.borderColor}
                  `}
                >
                  <FiFlag size={12} style={{ color: prio.dotColor }} />
                  {prio.label}
                </span>
              )}
              {task.due_date && (
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <FiCalendar size={12} />
                  {new Date(task.due_date).toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              )}
            </div>

            {/* Right: avatar or “assign” placeholder */}
            {assignee && avatarUrl ? (
              <Avatar
                src={avatarUrl}
                alt={assignee.name}
                size={32}
                className="border-2 border-white/20 cursor-pointer"
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTaskDetail(task.id);
                }}
                className="
                  w-8 h-8 flex items-center justify-center rounded-full border-2 border-white/20
                  text-white/50 hover:text-white hover:border-white transition-colors
                "
                aria-label="Assign user"
              >
                <FiUserPlus size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Context menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay to catch outside clicks */}
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <motion.div
              ref={menuRef}
              role="menu"
              tabIndex={-1}
              onKeyDown={onMenuKeyDown}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="
                absolute top-3 right-3 z-50
                bg-white text-gray-800 border border-gray-200 rounded-md shadow-lg overflow-hidden focus:outline-none min-w-[140px]
              "
            >
              {menuItems.map((item, idx) => (
                <button
                  key={`${item.label}-${idx}`} // Unique key using label and index
                  ref={item.ref}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                  }}
                  className="
                    w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm cursor-pointer
                  "
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Task;
