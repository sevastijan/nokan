'use client';

import { useState, Fragment, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { useSession, signOut } from 'next-auth/react';
import { Home, LayoutDashboard, Calendar, FileText, UserCog, Users, Menu, LogOut, X, Plus, Hash, MessageCircle, Star, GripVertical, Briefcase, ChevronDown, GitBranch, Building2, Settings } from 'lucide-react';
import Avatar from '../components/Avatar/Avatar';
import NotificationDropdown from './Notifications/NotificationDropdown';
import { useGetUserRoleQuery, useGetNotificationsQuery, useMarkNotificationReadMutation, useDeleteNotificationMutation, useGetMyBoardsQuery, useGetUserChannelsQuery, useGetFavoriteBoardsQuery, useReorderFavoriteBoardsMutation, useGetBoardAvatarsQuery } from '@/app/store/apiSlice';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDisplayUser } from '../hooks/useDisplayUser';
import { useChat } from '@/app/context/ChatContext';
import { getUserDisplayName, getUserDisplayAvatar } from './Chat/utils';
import OnlineIndicator from './Chat/OnlineIndicator';
import CreateChannelModal from './Chat/ChannelList/CreateChannelModal';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

function getBoardInitials(title: string): string {
     const words = title.trim().split(/\s+/);
     if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
     return title.slice(0, 2).toUpperCase();
}

const SortableBoardItem = ({ board, active, avatarUrl, onNavigate }: { board: { id: string; title: string }; active: boolean; avatarUrl?: string | null; onNavigate: () => void }) => {
     const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: board.id });
     const router = useRouter();
     const style = {
          transform: CSS.Translate.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
          zIndex: isDragging ? 10 : undefined,
     };

     return (
          <div
               ref={setNodeRef}
               style={style}
               className="group/fav"
               onClick={() => {
                    if (!isDragging) {
                         router.push(`/board/${board.id}`);
                         onNavigate();
                    }
               }}
          >
               <div
                    className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                         active ? 'bg-brand-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
               >
                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand-500" />}
                    {/* Avatar */}
                    {avatarUrl ? (
                         <img src={avatarUrl} alt="" className="w-5 h-5 rounded shrink-0 object-cover" />
                    ) : (
                         <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-semibold text-slate-400">{getBoardInitials(board.title)}</span>
                         </div>
                    )}
                    <span className="truncate flex-1">{board.title}</span>
                    {/* Drag handle - right side */}
                    <div
                         ref={setActivatorNodeRef}
                         className="shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover/fav:opacity-100 transition-opacity touch-none"
                         {...attributes}
                         {...listeners}
                         onClick={(e) => e.stopPropagation()}
                    >
                         <GripVertical className="w-3 h-3 text-slate-600" />
                    </div>
               </div>
          </div>
     );
};

const Navbar = () => {
     const { t } = useTranslation();
     const { data: session } = useSession();
     const router = useRouter();
     const pathname = usePathname();

     const { displayAvatar, displayName, currentUser } = useDisplayUser();
     const userEmail = session?.user?.email ?? '';
     const { selectChannel, openMiniChat, onlineUserIds } = useChat();

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

     const { data: favBoardsFromApi = [] } = useGetFavoriteBoardsQuery(currentUser?.id ?? '', {
          skip: !currentUser?.id,
     });
     const [reorderFavorites] = useReorderFavoriteBoardsMutation();
     const isDraggingRef = useRef(false);
     const favIds = useMemo(() => favBoardsFromApi.map((b) => b.id).join(','), [favBoardsFromApi]);
     const [localFavBoards, setLocalFavBoards] = useState(favBoardsFromApi);
     const localFavIdsRef = useRef('');

     if (favIds !== localFavIdsRef.current && !isDraggingRef.current) {
          localFavIdsRef.current = favIds;
          setLocalFavBoards(favBoardsFromApi);
     }

     const favoriteBoards = localFavBoards;
     const stableFavBoardIds = useMemo(() => localFavBoards.map((b) => b.id), [localFavBoards]);
     const avatarQueryArg = useMemo(() => stableFavBoardIds, [stableFavBoardIds.join(',')]);
     const { data: sidebarBoardAvatars = {} } = useGetBoardAvatarsQuery(avatarQueryArg, { skip: stableFavBoardIds.length === 0 });

     const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

     const handleFavoriteDragEnd = useCallback((event: DragEndEvent) => {
          isDraggingRef.current = false;
          const { active, over } = event;
          if (!over || active.id === over.id || !currentUser?.id) return;
          const oldIndex = localFavBoards.findIndex((b) => b.id === active.id);
          const newIndex = localFavBoards.findIndex((b) => b.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return;
          const newOrder = arrayMove(localFavBoards, oldIndex, newIndex);
          setLocalFavBoards(newOrder);
          reorderFavorites({ userId: currentUser.id, boardIds: newOrder.map((b) => b.id) });
     }, [localFavBoards, currentUser?.id, reorderFavorites]);

     const handleFavoriteDragStart = useCallback(() => {
          isDraggingRef.current = true;
     }, []);

     const { data: channels = [] } = useGetUserChannelsQuery(currentUser?.id ?? '', {
          skip: !currentUser?.id,
          pollingInterval: 10000,
     });

     const groupChannels = channels.filter((ch) => ch.type === 'group');
     const dmChannels = channels.filter((ch) => ch.type === 'dm');

     const [sidebarOpen, setSidebarOpen] = useState(false);
     const [crmExpanded, setCrmExpanded] = useState(false);
     const [createModalMode, setCreateModalMode] = useState<'dm' | 'group' | null>(null);

     useEffect(() => {
          if (!sidebarOpen) return;
          const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
          const html = document.documentElement;
          html.style.paddingRight = `${scrollbarWidth}px`;
          return () => {
               html.style.paddingRight = '';
          };
     }, [sidebarOpen]);

     useEffect(() => {
          if (pathname.startsWith('/crm')) setCrmExpanded(true);
     }, [pathname]);

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

     const handleGroupChannelClick = (e: React.MouseEvent, channelId: string) => {
          e.stopPropagation();
          e.preventDefault();
          selectChannel(channelId);
          router.push(`/chat?channel=${channelId}`);
          setSidebarOpen(false);
     };

     const handleDmClick = (e: React.MouseEvent, channelId: string) => {
          e.stopPropagation();
          e.preventDefault();
          openMiniChat(channelId);
          setSidebarOpen(false);
     };

     const roleConfig: Record<string, { label: string; classes: string }> = {
          OWNER: { label: t('roles.OWNER'), classes: 'bg-amber-500/15 text-amber-300 border-amber-400/25' },
          PROJECT_MANAGER: { label: t('roles.PROJECT_MANAGER'), classes: 'bg-brand-500/15 text-brand-300 border-brand-400/25' },
          CLIENT: { label: t('roles.CLIENT'), classes: 'bg-brand-500/15 text-brand-300 border-brand-400/25' },
          MEMBER: { label: t('roles.MEMBER'), classes: 'bg-slate-500/15 text-slate-300 border-slate-400/25' },
     };

     const role = roleConfig[userRole ?? 'MEMBER'] ?? roleConfig.MEMBER;

     const nav = [
          { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
          { href: '/calendar', label: t('nav.calendar'), icon: Calendar },
          { href: '/submissions', label: t('nav.submissions'), icon: FileText },
          ...(hasManagementAccess()
               ? [
                      { href: '/users', label: t('nav.users'), icon: UserCog },
                      { href: '/team-management', label: t('nav.teams'), icon: Users },
                 ]
               : []),
     ];

     const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

     const renderSidebarContent = () => (
          <div className="flex flex-col h-full">
               {/* ─── Top: Logo + Notifications ─── */}
               <div className="px-4 py-4 flex items-center justify-between shrink-0">
                    <button
                         onClick={() => {
                              router.push('/');
                              setSidebarOpen(false);
                         }}
                         className="cursor-pointer"
                    >
                         <img src="/logo.svg" alt="Nokan" className="w-7 h-7" />
                    </button>
                    <div className="hidden md:block">
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

               {/* ─── Navigation links ─── */}
               <nav className="px-3 shrink-0">
                    <div className="space-y-0.5">
                         {nav.map(({ href, label, icon: Icon }) => {
                              const active = isActive(href);
                              return (
                                   <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                                        <div
                                             className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                                  active ? 'bg-brand-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                             }`}
                                        >
                                             {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand-500" />}
                                             <Icon className={`w-[18px] h-[18px] ${active ? 'text-brand-400' : 'text-slate-500'}`} />
                                             <span>{label}</span>
                                        </div>
                                   </Link>
                              );
                         })}
                    </div>
               </nav>

               {/* ─── CRM (OWNER only) ─── */}
               {userRole === 'OWNER' && (
                    <div className="px-3 mt-1 shrink-0">
                         <button
                              onClick={() => setCrmExpanded(!crmExpanded)}
                              className={`w-full relative flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                   pathname.startsWith('/crm') ? 'bg-brand-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                              }`}
                         >
                              <div className="flex items-center gap-3">
                                   {pathname.startsWith('/crm') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand-500" />}
                                   <Briefcase className={`w-[18px] h-[18px] ${pathname.startsWith('/crm') ? 'text-brand-400' : 'text-slate-500'}`} />
                                   <span>CRM</span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${crmExpanded ? 'rotate-180' : ''}`} />
                         </button>
                         {crmExpanded && (
                              <div className="mt-0.5 ml-4 space-y-0.5">
                                   {[
                                        { href: '/crm/dashboard', label: t('crm.dashboard'), icon: LayoutDashboard },
                                        { href: '/crm/pipeline', label: 'Pipeline', icon: GitBranch },
                                        { href: '/crm/companies', label: t('crm.companies'), icon: Building2 },
                                   ].map(({ href, label, icon: Icon }) => {
                                        const active = isActive(href);
                                        return (
                                             <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                                                  <div
                                                       className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                                            active ? 'bg-brand-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                       }`}
                                                  >
                                                       <Icon className={`w-4 h-4 ${active ? 'text-brand-400' : 'text-slate-500'}`} />
                                                       <span>{label}</span>
                                                  </div>
                                             </Link>
                                        );
                                   })}
                              </div>
                         )}
                    </div>
               )}

               {/* ─── Settings (OWNER only) ─── */}
               {userRole === 'OWNER' && (
                    <div className="px-3 mt-1 shrink-0">
                         <Link href="/settings" onClick={() => setSidebarOpen(false)}>
                              <div className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                   isActive('/settings') ? 'bg-brand-600/10 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                              }`}>
                                   {isActive('/settings') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand-500" />}
                                   <Settings className={`w-[18px] h-[18px] ${isActive('/settings') ? 'text-brand-400' : 'text-slate-500'}`} />
                                   <span>{t('nav.settings')}</span>
                              </div>
                         </Link>
                    </div>
               )}

               {/* ─── Pinned Boards ─── */}
               {favoriteBoards.length > 0 && (
                    <>
                         <div className="mx-5 mt-3 border-t border-slate-800 shrink-0" />
                         <div className="px-3 mt-2 shrink-0">
                              <div className="flex items-center px-3 py-1.5">
                                   <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Projekty</span>
                              </div>
                              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragStart={handleFavoriteDragStart} onDragEnd={handleFavoriteDragEnd}>
                                   <SortableContext items={favoriteBoards.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-0.5">
                                             {favoriteBoards.map((board) => (
                                                  <SortableBoardItem
                                                       key={board.id}
                                                       board={board}
                                                       active={pathname === `/board/${board.id}`}
                                                       avatarUrl={sidebarBoardAvatars[board.id] || null}
                                                       onNavigate={() => setSidebarOpen(false)}
                                                  />
                                             ))}
                                        </div>
                                   </SortableContext>
                              </DndContext>
                         </div>
                    </>
               )}

               {/* ─── Divider ─── */}
               <div className="mx-5 mt-3 border-t border-slate-800 shrink-0" />

               {/* ─── Chat channels (scrollable, fills remaining space) ─── */}
               <div className="flex-1 overflow-y-auto min-h-0 mt-2 px-3">
                    {/* Channels (groups) */}
                    <div className="mb-2">
                         <div className="flex items-center justify-between px-3 py-1.5">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('nav.channels')}</span>
                              <button
                                   onClick={() => setCreateModalMode('group')}
                                   className="p-0.5 rounded text-slate-600 hover:text-slate-300 transition cursor-pointer"
                                   title={t('nav.newChannel')}
                              >
                                   <Plus className="w-3.5 h-3.5" />
                              </button>
                         </div>
                         {groupChannels.length === 0 ? (
                              <p className="px-3 text-[11px] text-slate-600">{t('nav.noChannels')}</p>
                         ) : (
                              <div className="space-y-0.5">
                                   {groupChannels.map((ch) => {
                                        const isUnread = (ch.unread_count || 0) > 0;
                                        return (
                                             <button
                                                  key={ch.id}
                                                  onClick={(e) => handleGroupChannelClick(e, ch.id)}
                                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition cursor-pointer group"
                                             >
                                                  <Hash className={`w-4 h-4 shrink-0 ${isUnread ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
                                                  <span className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                                       {ch.name || t('common.noName')}
                                                  </span>
                                                  {isUnread && (
                                                       <span className="ml-auto w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                                  )}
                                             </button>
                                        );
                                   })}
                              </div>
                         )}
                    </div>

                    {/* Messages (DMs) */}
                    <div className="mb-2">
                         <div className="flex items-center justify-between px-3 py-1.5">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('nav.messages')}</span>
                              <button
                                   onClick={() => setCreateModalMode('dm')}
                                   className="p-0.5 rounded text-slate-600 hover:text-slate-300 transition cursor-pointer"
                                   title={t('nav.newMessage')}
                              >
                                   <Plus className="w-3.5 h-3.5" />
                              </button>
                         </div>
                         {dmChannels.length === 0 ? (
                              <p className="px-3 text-[11px] text-slate-600">{t('nav.noMessages')}</p>
                         ) : (
                              <div className="space-y-0.5">
                                   {dmChannels.map((ch) => {
                                        const other = ch.members?.find((m) => m.user_id !== currentUser?.id);
                                        const name = getUserDisplayName(other?.user);
                                        const avatar = getUserDisplayAvatar(other?.user);
                                        const isUnread = (ch.unread_count || 0) > 0;
                                        const isOnline = other?.user_id ? onlineUserIds.includes(other.user_id) : false;

                                        return (
                                             <button
                                                  key={ch.id}
                                                  onClick={(e) => handleDmClick(e, ch.id)}
                                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition cursor-pointer group"
                                             >
                                                  <div className="relative shrink-0">
                                                       <Avatar src={avatar} alt={name} size={20} />
                                                       <OnlineIndicator isOnline={isOnline} className="absolute -bottom-0.5 -right-0.5" />
                                                  </div>
                                                  <span className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                                       {name}
                                                  </span>
                                                  {isUnread && (
                                                       <span className="ml-auto w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                                  )}
                                             </button>
                                        );
                                   })}
                              </div>
                         )}
                    </div>
               </div>

               {/* ─── Bottom: Profile + Settings ─── */}
               {session.user && (
                    <div className="px-3 pb-4 pt-2 shrink-0 mt-auto">
                         <div className="mx-2 mb-3 border-t border-slate-800" />

                         {/* User profile row */}
                         <button
                              onClick={() => {
                                   router.push('/profile');
                                   setSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                                   isActive('/profile') ? 'bg-brand-600/10' : 'hover:bg-slate-800/50'
                              }`}
                         >
                              <Avatar src={displayAvatar} priority={true} alt="User avatar" size={28} />
                              <div className="flex-1 min-w-0 text-left">
                                   <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
                              </div>
                              {!roleLoading && (
                                   <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${role.classes}`}>{role.label}</span>
                              )}
                         </button>

                         {/* Language + Logout */}
                         <div className="flex items-center justify-between px-3 mt-2">
                              <LanguageSwitcher />
                              <button
                                   onClick={() => signOut({ callbackUrl: '/', redirect: true })}
                                   className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                                   title={t('nav.signOut')}
                              >
                                   <LogOut className="w-4 h-4" />
                              </button>
                         </div>
                    </div>
               )}
          </div>
     );

     return (
          <>
               {/* Mobile top bar */}
               <div className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between px-4 py-2.5 bg-[#0b1120] border-b border-slate-800/50">
                    <button
                         onClick={() => { router.push('/'); setSidebarOpen(false); }}
                         className="cursor-pointer"
                    >
                         <img src="/logo.svg" alt="Nokan" className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-1">
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
                         <button
                              onClick={() => setSidebarOpen(true)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                              aria-label={t('nav.openSidebar')}
                         >
                              <Menu className="w-5 h-5" />
                         </button>
                    </div>
               </div>

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
                                        aria-label={t('nav.closeSidebar')}
                                   >
                                        <X className="w-5 h-5" />
                                   </button>
                                   {renderSidebarContent()}
                              </DialogPanel>
                         </TransitionChild>
                    </Dialog>
               </Transition>

               {createModalMode && (
                    <CreateChannelModal initialMode={createModalMode} onClose={() => setCreateModalMode(null)} />
               )}

          </>
     );
};

export default Navbar;
