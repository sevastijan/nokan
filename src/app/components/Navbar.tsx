'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { useSession, signOut } from 'next-auth/react';
import { Home, LayoutDashboard, Calendar, FileText, UserCog, Users, Menu, LogOut, X } from 'lucide-react';
import Avatar from '../components/Avatar/Avatar';
import NotificationDropdown from './Notifications/NotificationDropdown';
import { useGetUserRoleQuery, useGetNotificationsQuery, useMarkNotificationReadMutation, useDeleteNotificationMutation, useGetMyBoardsQuery } from '@/app/store/apiSlice';
import { useDisplayUser } from '../hooks/useDisplayUser';

const roleConfig: Record<string, { label: string; classes: string }> = {
     OWNER: { label: 'Owner', classes: 'bg-amber-500/15 text-amber-300 border-amber-400/25' },
     PROJECT_MANAGER: { label: 'PM', classes: 'bg-blue-500/15 text-blue-300 border-blue-400/25' },
     CLIENT: { label: 'Client', classes: 'bg-purple-500/15 text-purple-300 border-purple-400/25' },
     MEMBER: { label: 'Member', classes: 'bg-slate-500/15 text-slate-300 border-slate-400/25' },
};

const Navbar = () => {
     const { data: session } = useSession();
     const router = useRouter();
     const pathname = usePathname();

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

     if (!session?.user) return <></>;

     const hasManagementAccess = () => userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';

     const handleMarkAllAsRead = async () => {
          const unreadNotifications = notifications.filter((n) => !n.read);
          for (const n of unreadNotifications) {
               await markNotificationRead({ id: n.id });
          }
          refetchNotifications();
     };

     const handleMarkAsRead = async (id: string) => {
          await markNotificationRead({ id });
          refetchNotifications();
     };

     const handleDelete = async (id: string) => {
          await deleteNotification({ id });
          refetchNotifications();
     };

     const role = roleConfig[userRole ?? 'MEMBER'] ?? roleConfig.MEMBER;

     const nav = [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/calendar', label: 'Calendar', icon: Calendar },
          { href: '/submissions', label: 'Submissions', icon: FileText },
          ...(hasManagementAccess()
               ? [
                      { href: '/users', label: 'Users', icon: UserCog },
                      { href: '/team-management', label: 'Teams', icon: Users },
                 ]
               : []),
     ];

     const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

     const renderSidebarContent = () => (
          <div className="flex flex-col h-full">
               {/* Logo */}
               <div className="px-5 py-5">
                    <button
                         onClick={() => {
                              router.push('/');
                              setSidebarOpen(false);
                         }}
                         className="flex items-center gap-2.5 cursor-pointer group"
                    >
                         <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:bg-blue-500 transition-colors">
                              <Home className="w-4 h-4 text-white" />
                         </div>
                         <span className="text-lg font-bold text-white tracking-tight">NOKAN</span>
                    </button>
               </div>

               {/* User profile */}
               {session.user && (
                    <div className="px-4 mb-6">
                         <div className="flex items-center gap-3 px-3 py-3">
                              <Avatar src={displayAvatar} priority={true} alt="User avatar" size={36} className="ring-2 ring-slate-700/50 ring-offset-1 ring-offset-slate-900" />
                              <div className="flex-1 min-w-0">
                                   <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                   {!roleLoading && (
                                        <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${role.classes}`}>{role.label}</span>
                                   )}
                              </div>
                         </div>
                         <div className="flex items-center gap-1.5 px-2 mt-1">
                              <button
                                   onClick={() => {
                                        router.push('/profile');
                                        setSidebarOpen(false);
                                   }}
                                   className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                        isActive('/profile')
                                             ? 'bg-blue-600/10 text-blue-300'
                                             : 'text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/70'
                                   }`}
                              >
                                   <UserCog className="w-3.5 h-3.5" />
                                   Profile
                              </button>
                              <NotificationDropdown
                                   notifications={notifications}
                                   boards={boards}
                                   onMarkRead={handleMarkAsRead}
                                   onMarkAllRead={handleMarkAllAsRead}
                                   onDelete={handleDelete}
                                   onNavigate={(boardId, taskId) => {
                                        router.push(`/board/${boardId}?task=${taskId}`);
                                        setSidebarOpen(false);
                                   }}
                              />
                         </div>
                    </div>
               )}

               {/* Divider */}
               <div className="mx-5 border-t border-slate-800" />

               {/* Navigation */}
               <nav className="flex-1 px-3 mt-4">
                    <div className="space-y-0.5">
                         {nav.map(({ href, label, icon: Icon }) => {
                              const active = isActive(href);
                              return (
                                   <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                                        <div
                                             className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                                  active ? 'bg-blue-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                             }`}
                                        >
                                             {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-blue-500" />}
                                             <Icon className={`w-[18px] h-[18px] ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                             <span>{label}</span>
                                        </div>
                                   </Link>
                              );
                         })}
                    </div>
               </nav>

               {/* Sign out */}
               {session.user && (
                    <div className="px-3 pb-4 pt-2">
                         <div className="mx-2 mb-3 border-t border-slate-800" />
                         <button
                              onClick={() => signOut({ callbackUrl: '/', redirect: true })}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                         >
                              <LogOut className="w-[18px] h-[18px]" />
                              <span>Sign Out</span>
                         </button>
                    </div>
               )}
          </div>
     );

     return (
          <>
               {/* Mobile hamburger */}
               <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed right-4 top-3 z-50 md:hidden bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2.5 shadow-lg hover:bg-slate-700/80 transition-all text-slate-300 hover:text-white cursor-pointer"
                    aria-label="Open sidebar"
               >
                    <Menu className="w-5 h-5" />
               </button>

               {/* Desktop sidebar */}
               <nav className="hidden md:flex fixed top-0 left-0 h-full w-60 bg-slate-900 border-r border-slate-800/80 flex-col z-30">
                    {renderSidebarContent()}
               </nav>

               {/* Mobile sidebar */}
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
                              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
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
                              <DialogPanel className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800/80 shadow-2xl focus:outline-none">
                                   <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="absolute right-3 top-4 z-50 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
                                        aria-label="Close sidebar"
                                   >
                                        <X className="w-5 h-5" />
                                   </button>
                                   {renderSidebarContent()}
                              </DialogPanel>
                         </TransitionChild>
                    </Dialog>
               </Transition>
          </>
     );
};

export default Navbar;
