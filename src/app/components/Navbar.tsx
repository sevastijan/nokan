'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, Transition, TransitionChild, DialogPanel, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
     FaHome,
     FaTachometerAlt,
     FaCalendarAlt,
     FaSignOutAlt,
     FaUsers,
     FaBars,
     FaChevronRight,
     FaBell,
     FaCheck,
     FaTrash,
     FaExternalLinkAlt,
     FaUserCog,
     FaFileAlt,
     FaCheckDouble,
} from 'react-icons/fa';
import Avatar from '../components/Avatar/Avatar';
import Button from '../components/Button/Button';
import { useGetUserRoleQuery, useGetNotificationsQuery, useMarkNotificationReadMutation, useDeleteNotificationMutation, useGetMyBoardsQuery } from '@/app/store/apiSlice';
import { useDisplayUser } from '../hooks/useDisplayUser';

interface Notification {
     id: string | number;
     title?: string;
     message?: string;
     board_id?: string;
     task_id?: string;
     read?: boolean;
     created_at?: string;
}

const Navbar = () => {
     const { data: session } = useSession();
     const router = useRouter();

     const { displayAvatar, displayName, currentUser } = useDisplayUser();
     const userEmail = session?.user?.email ?? '';

     const { data: userRole, isLoading: roleLoading } = useGetUserRoleQuery(userEmail, {
          skip: !userEmail,
     });

     const { data: notifications = [], refetch: refetchNotifications } = useGetNotificationsQuery(currentUser?.id ?? '', {
          skip: !currentUser?.id,
     });

     const [markNotificationRead] = useMarkNotificationReadMutation();
     const [deleteNotification] = useDeleteNotificationMutation();

     const { data: boards } = useGetMyBoardsQuery(currentUser?.id ?? '', {
          skip: !currentUser?.id,
     });

     const [sidebarOpen, setSidebarOpen] = useState(false);
     const [showRead, setShowRead] = useState(false);

     if (!session?.user) return <></>;

     const hasManagementAccess = () => userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';

     const filteredNotifications = showRead ? notifications : notifications.filter((n) => !n.read);
     const unreadCount = notifications.filter((n) => !n.read).length;

     const getBoardName = (boardId: string) => boards?.find((b: { id: string }) => b.id === boardId)?.title || 'Unknown board';

     const getRoleBadge = () => {
          if (roleLoading) return <span className="text-xs text-slate-500">Loading...</span>;

          switch (userRole) {
               case 'OWNER':
                    return <span className="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-600/20 text-yellow-300 border border-yellow-400/30">Owner</span>;
               case 'PROJECT_MANAGER':
                    return <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-400/30">Project Manager</span>;
               case 'CLIENT':
                    return <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-400/30">Client</span>;
               case 'MEMBER':
               default:
                    return <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-600/20 text-slate-300 border border-slate-400/30">Member</span>;
          }
     };

     const handleMarkAllAsRead = async () => {
          const unreadNotifications = notifications.filter((n) => !n.read);
          for (const n of unreadNotifications) {
               if (n.id) await markNotificationRead({ id: String(n.id) });
          }
          refetchNotifications();
     };

     const handleMarkAsRead = async (id: string | number) => {
          await markNotificationRead({ id: String(id) });
          refetchNotifications();
     };

     const handleDelete = async (id: string | number) => {
          await deleteNotification({ id: String(id) });
          refetchNotifications();
     };

     const nav = [
          { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
          { href: '/calendar', label: 'Calendar', icon: <FaCalendarAlt /> },
          { href: '/submissions', label: 'Submissions', icon: <FaFileAlt /> },
          ...(hasManagementAccess()
               ? [
                      { href: '/users', label: 'Users', icon: <FaUserCog /> },
                      { href: '/team-management', label: 'Manage Teams', icon: <FaUsers /> },
                 ]
               : []),
     ];

     const SidebarContent = () => (
          <div className="flex flex-col h-full">
               <div className="p-4 border-b border-slate-700/50">
                    <button
                         onClick={() => {
                              router.push('/');
                              setSidebarOpen(false);
                         }}
                         className="flex items-center gap-2 text-xl font-bold cursor-pointer text-slate-200 hover:text-white transition-colors"
                    >
                         <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                              <FaHome className="w-4 h-4 text-slate-300" />
                         </div>
                         NOKAN
                    </button>
               </div>

               {session.user && (
                    <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 shadow-xl mt-5 mx-4">
                         <div className="flex items-center gap-4">
                              <Avatar src={displayAvatar} alt="User avatar" size={52} className="ring-2 ring-slate-600/50 ring-offset-2 ring-offset-slate-800" />
                              <div className="flex-1 min-w-0">
                                   <h3 className="text-white font-bold text-lg truncate">{displayName}</h3>
                                   <div className="mt-2">{getRoleBadge()}</div>
                              </div>
                         </div>

                         <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-700/30">
                              <Menu as="div" className="relative">
                                   <MenuButton className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all cursor-pointer">
                                        <FaBell className="w-4 h-4" />
                                        {unreadCount > 0 && (
                                             <span className="absolute -top-1 -right-1 bg-rose-500/90 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                                                  {unreadCount}
                                             </span>
                                        )}
                                   </MenuButton>

                                   <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                   >
                                        <MenuItems className="absolute left-0 z-30 mt-3 w-96 max-w-xs bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
                                             <div className="flex items-center justify-between p-3 border-b border-slate-700">
                                                  <span className="font-semibold text-white text-base">Notifications</span>
                                                  <div className="flex items-center gap-2">
                                                       {unreadCount > 0 && (
                                                            <button
                                                                 onClick={handleMarkAllAsRead}
                                                                 className="text-xs text-green-400 hover:text-green-300 hover:underline flex items-center gap-1 cursor-pointer"
                                                                 title="Mark all as read"
                                                            >
                                                                 <FaCheckDouble className="w-3 h-3" />
                                                                 Mark all
                                                            </button>
                                                       )}
                                                       <button onClick={() => setShowRead(!showRead)} className="text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer">
                                                            {showRead ? 'Hide read' : 'Show all'}
                                                       </button>
                                                  </div>
                                             </div>

                                             <div className="max-h-96 overflow-y-auto">
                                                  {filteredNotifications.length === 0 && (
                                                       <div className="px-4 py-5 text-slate-400 text-center text-sm">{showRead ? 'No notifications' : 'No unread notifications'}</div>
                                                  )}

                                                  <AnimatePresence mode="popLayout">
                                                       {filteredNotifications.map((n: Notification) => (
                                                            <MenuItem key={String(n.id)} as="div">
                                                                 <motion.div
                                                                      layout
                                                                      initial={{ opacity: 0, x: -20 }}
                                                                      animate={{ opacity: 1, x: 0 }}
                                                                      exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                                                                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                                      className={`group px-4 py-3 ${
                                                                           n.read ? 'opacity-70' : 'bg-slate-800/60'
                                                                      } data-[focus]:bg-slate-800/80 text-white flex flex-col gap-1 cursor-pointer transition-all`}
                                                                      onClick={() => {
                                                                           if (n.board_id && n.task_id) {
                                                                                router.push(`/board/${n.board_id}?task=${n.task_id}`);
                                                                                setSidebarOpen(false);
                                                                           }
                                                                      }}
                                                                 >
                                                                      <div className="flex items-center gap-2">
                                                                           <span className="font-semibold">{n.title || 'Notification'}</span>
                                                                           {n.board_id && (
                                                                                <span className="ml-2 bg-slate-700/40 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-600/40">
                                                                                     {getBoardName(n.board_id)}
                                                                                </span>
                                                                           )}
                                                                           {n.task_id && <FaExternalLinkAlt className="ml-2 w-3 h-3 text-blue-400" />}
                                                                      </div>
                                                                      <span className="text-xs text-slate-400 break-words">{n.message}</span>
                                                                      <span className="text-[10px] text-slate-500 mt-0.5">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>

                                                                      <div className="flex items-center gap-2 mt-2">
                                                                           {!n.read && (
                                                                                <motion.button
                                                                                     whileTap={{ scale: 0.9 }}
                                                                                     title="Mark as read"
                                                                                     onClick={(e) => {
                                                                                          e.stopPropagation();
                                                                                          if (n.id) handleMarkAsRead(n.id);
                                                                                     }}
                                                                                     className="text-green-400 hover:bg-green-700/20 rounded p-1.5 transition-colors cursor-pointer"
                                                                                >
                                                                                     <FaCheck className="w-4 h-4" />
                                                                                </motion.button>
                                                                           )}
                                                                           <motion.button
                                                                                whileTap={{ scale: 0.9 }}
                                                                                title="Delete"
                                                                                onClick={(e) => {
                                                                                     e.stopPropagation();
                                                                                     if (n.id) handleDelete(n.id);
                                                                                }}
                                                                                className="text-red-400 hover:bg-red-700/20 rounded p-1.5 transition-colors cursor-pointer"
                                                                           >
                                                                                <FaTrash className="w-4 h-4" />
                                                                           </motion.button>
                                                                      </div>
                                                                 </motion.div>
                                                            </MenuItem>
                                                       ))}
                                                  </AnimatePresence>
                                             </div>
                                        </MenuItems>
                                   </Transition>
                              </Menu>

                              <button
                                   onClick={() => router.push('/profile')}
                                   className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all cursor-pointer"
                              >
                                   View Profile
                              </button>
                         </div>
                    </div>
               )}

               <div className="flex-1 mt-8">
                    <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-6 mb-2">NAVIGATION</h4>
                    <div className="space-y-1 px-2">
                         {nav.map(({ href, label, icon }) => (
                              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                                   <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group cursor-pointer">
                                        <span className="text-lg">{icon}</span>
                                        <span className="font-medium text-sm truncate">{label}</span>
                                        <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                   </div>
                              </Link>
                         ))}
                    </div>
               </div>

               {session.user && (
                    <div className="p-4 border-t border-slate-700/50">
                         <Button variant="danger" size="sm" fullWidth onClick={() => signOut({ callbackUrl: '/', redirect: true })} icon={<FaSignOutAlt />}>
                              Sign Out
                         </Button>
                    </div>
               )}
          </div>
     );

     return (
          <>
               <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed right-4 top-3 z-50 md:hidden bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 shadow-lg hover:bg-slate-700/80 transition-all text-slate-300 hover:text-white cursor-pointer"
                    aria-label="Open sidebar"
               >
                    <FaBars className="w-5 h-5" />
               </button>

               <nav className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-700 flex-col z-30 shadow-lg">
                    <SidebarContent />
               </nav>

               <Transition show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
                         <TransitionChild
                              as={Fragment}
                              enter="ease-out duration-300"
                              enterFrom="opacity-0"
                              enterTo="opacity-100"
                              leave="ease-in duration-200"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                         >
                              <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />
                         </TransitionChild>

                         <TransitionChild
                              as={Fragment}
                              enter="transform transition ease-in-out duration-300"
                              enterFrom="-translate-x-full"
                              enterTo="translate-x-0"
                              leave="transform transition ease-in-out duration-300"
                              leaveFrom="translate-x-0"
                              leaveTo="-translate-x-full"
                         >
                              <DialogPanel className="fixed inset-0 w-full h-full bg-slate-900/95 border-r border-slate-700/50 shadow-2xl focus:outline-none rounded-none p-0">
                                   <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="absolute right-4 top-4 z-50 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
                                   >
                                        Close
                                   </button>
                                   <SidebarContent />
                              </DialogPanel>
                         </TransitionChild>
                    </Dialog>
               </Transition>
          </>
     );
};

export default Navbar;
