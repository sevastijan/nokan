'use client';

import { useState, Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, BellOff, AtSign, Inbox } from 'lucide-react';

export interface Notification {
     id: string;
     user_id: string;
     type: string;
     message: string;
     board_id?: string;
     task_id?: string;
     read: boolean;
     created_at: string;
}

interface NotificationDropdownProps {
     notifications: Notification[];
     boards: { id: string; title: string }[] | undefined;
     onMarkRead: (id: string) => Promise<void>;
     onMarkAllRead: () => Promise<void>;
     onDelete: (id: string) => Promise<void>;
     onNavigate: (boardId: string, taskId: string) => void;
}

const NotificationDropdown = ({ notifications, boards, onMarkRead, onMarkAllRead, onDelete, onNavigate }: NotificationDropdownProps) => {
     const { t } = useTranslation();
     const [showRead, setShowRead] = useState(false);

     const notificationTypeLabels: Record<string, { label: string; icon?: React.ReactNode }> = useMemo(
          () => ({
               mention: { label: t('notifications.mention'), icon: <AtSign className="w-3.5 h-3.5 text-brand-400 inline mr-1" /> },
               task_assigned: { label: t('notifications.taskAssigned') },
               task_unassigned: { label: t('notifications.taskUnassigned') },
               status_changed: { label: t('notifications.statusChanged') },
               priority_changed: { label: t('notifications.priorityChanged') },
               new_comment: { label: t('notifications.newComment') },
               due_date_changed: { label: t('notifications.dueDateChanged') },
               collaborator_added: { label: t('notifications.collaboratorAdded') },
               collaborator_removed: { label: t('notifications.collaboratorRemoved') },
               new_submission: { label: t('notifications.newSubmission'), icon: <Inbox className="w-3.5 h-3.5 text-brand-400 inline mr-1" /> },
          }),
          [t],
     );

     const filteredNotifications = showRead ? notifications : notifications.filter((n) => !n.read);
     const unreadCount = notifications.filter((n) => !n.read).length;

     const getBoardName = (boardId: string) => boards?.find((b) => b.id === boardId)?.title || 'Unknown board';

     return (
          <Menu as="div" className="relative">
               <MenuButton className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all cursor-pointer">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                         <span className="absolute -top-1 -right-1 bg-rose-500/90 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                              {unreadCount}
                         </span>
                    )}
               </MenuButton>

               <Transition
                    as={Fragment}
                    enter="transition ease-out duration-150"
                    enterFrom="opacity-0 scale-95 translate-y-1"
                    enterTo="opacity-100 scale-100 translate-y-0"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100 scale-100 translate-y-0"
                    leaveTo="opacity-0 scale-95 translate-y-1"
               >
                    <MenuItems className="absolute left-0 z-30 mt-3 w-96 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
                         {/* Header */}
                         <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
                              <span className="font-semibold text-white text-sm">{t('notifications.title')}</span>
                              <div className="flex items-center gap-2">
                                   {unreadCount > 0 && (
                                        <button
                                             onClick={onMarkAllRead}
                                             className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                                             title={t('notifications.markAll')}
                                        >
                                             <CheckCheck className="w-3.5 h-3.5" />
                                             <span>{t('notifications.markAll')}</span>
                                        </button>
                                   )}
                                   <span className="w-px h-3.5 bg-slate-700" />
                                   <button
                                        onClick={() => setShowRead(!showRead)}
                                        className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors"
                                   >
                                        {showRead ? t('notifications.hideRead') : t('notifications.showAll')}
                                   </button>
                              </div>
                         </div>

                         {/* Notification list */}
                         <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                              {filteredNotifications.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center py-10 px-4 text-slate-500">
                                        <BellOff className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-sm">{showRead ? t('notifications.noNotifications') : t('notifications.noUnread')}</span>
                                   </div>
                              ) : (
                                   <AnimatePresence mode="popLayout">
                                        {filteredNotifications.map((n: Notification, i: number) => (
                                             <MenuItem key={String(n.id)} as="div">
                                                  <motion.div
                                                       layout
                                                       initial={{ opacity: 0, y: 8 }}
                                                       animate={{ opacity: 1, y: 0 }}
                                                       exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                                                       transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.04 }}
                                                       className={`group flex gap-3 px-4 py-3 ${
                                                            n.read ? 'opacity-60' : 'bg-slate-800/40'
                                                       } data-[focus]:bg-slate-800/60 hover:bg-slate-800/60 cursor-pointer transition-colors`}
                                                       onClick={() => {
                                                            if (n.board_id && n.task_id) {
                                                                 onNavigate(n.board_id, n.task_id);
                                                            }
                                                       }}
                                                  >
                                                       {/* Unread indicator */}
                                                       <div className="flex-shrink-0 pt-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand-500'}`} />
                                                       </div>

                                                       {/* Content */}
                                                       <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                 <span className="font-medium text-sm text-white truncate">
                                                                      {notificationTypeLabels[n.type]?.icon}
                                                                      {notificationTypeLabels[n.type]?.label || n.type || t('notifications.title')}
                                                                 </span>
                                                                 {n.board_id && (
                                                                      <span className="flex-shrink-0 bg-slate-700/30 px-1.5 py-0.5 rounded text-[11px] text-slate-400 border border-slate-600/30">
                                                                           {getBoardName(n.board_id)}
                                                                      </span>
                                                                 )}
                                                                 {n.task_id && <ExternalLink className="flex-shrink-0 w-3 h-3 text-brand-400/70" />}
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-0.5 break-words line-clamp-2">{n.message}</p>
                                                            <span className="text-[10px] text-slate-500 mt-1 block">
                                                                 {new Date(n.created_at).toLocaleString()}
                                                            </span>
                                                       </div>

                                                       {/* Actions */}
                                                       <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!n.read && (
                                                                 <button
                                                                      title={t('notifications.markAsRead')}
                                                                      onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           if (n.id) onMarkRead(n.id);
                                                                      }}
                                                                      className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                                                 >
                                                                      <Check className="w-3.5 h-3.5" />
                                                                 </button>
                                                            )}
                                                            <button
                                                                 title={t('common.delete')}
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      if (n.id) onDelete(n.id);
                                                                 }}
                                                                 className="p-1 rounded-md text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                            >
                                                                 <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                       </div>
                                                  </motion.div>
                                             </MenuItem>
                                        ))}
                                   </AnimatePresence>
                              )}
                         </div>
                    </MenuItems>
               </Transition>
          </Menu>
     );
};

export default NotificationDropdown;
