'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Avatar from '../components/Avatar/Avatar';
import Loader from '@/app/components/Loader';
import { useGetUserRoleQuery, useGetMyBoardsQuery, useGetNotificationPreferencesQuery, useUpdateNotificationPreferencesMutation, useUpdateUserMutation } from '@/app/store/apiSlice';
import Link from 'next/link';
import { ChevronRight, Bell, Mail, Pencil, Camera, Check, X, LayoutDashboard, ClipboardList, Users, Layers, Settings2, Smartphone, MessageCircle, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { useDisplayUser } from '../hooks/useDisplayUser';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSubtaskPreference } from '../hooks/useSubtaskPreference';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { PUSH_OPTED_OUT_KEY } from '../hooks/useAutoPushSubscription';

/* ── Toggle Switch ─────────────────────────────────────────────── */

interface ToggleSwitchProps {
     enabled: boolean;
     onChange: (enabled: boolean) => void;
     label: string;
     description: string;
}

const ToggleSwitch = ({ enabled, onChange, label, description }: ToggleSwitchProps) => (
     <div className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0 gap-4">
          <div className="flex-1 min-w-0">
               <div className="text-white font-medium text-sm sm:text-base">{label}</div>
               <div className="text-slate-400 text-xs sm:text-sm">{description}</div>
          </div>
          <button
               onClick={() => onChange(!enabled)}
               className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                    enabled ? 'bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-slate-600 hover:bg-slate-500'
               }`}
          >
               <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
     </div>
);

/* ── Role config ───────────────────────────────────────────────── */

const roleColors: Record<string, string> = {
     OWNER: 'bg-yellow-600/20 text-yellow-300 border-yellow-400/30',
     PROJECT_MANAGER: 'bg-blue-600/20 text-blue-300 border-blue-400/30',
     CLIENT: 'bg-emerald-600/20 text-emerald-300 border-emerald-400/30',
     MEMBER: 'bg-slate-600/20 text-slate-300 border-slate-400/30',
};

/* ── Page ──────────────────────────────────────────────────────── */

const ProfilePage = () => {
     const { t } = useTranslation();
     const { displayAvatar, displayName, email, currentUser, session } = useDisplayUser();
     const { loading: userLoading, refetchUser } = useCurrentUser();

     const fileInputRef = useRef<HTMLInputElement>(null);

     // Subtask preference
     const [showSubtasks, setShowSubtasks] = useSubtaskPreference(currentUser?.id);

     // User role
     const { data: userRole } = useGetUserRoleQuery(email, {
          skip: !email,
     });

     // Boards
     const { data: boards = [], isLoading: boardsLoading } = useGetMyBoardsQuery(currentUser?.id ?? '', {
          skip: !currentUser?.id,
     });

     // Notification preferences
     const { data: preferences, isLoading: prefsLoading } = useGetNotificationPreferencesQuery(currentUser?.id ?? '', {
          skip: !currentUser?.id,
     });

     const [updatePreferences] = useUpdateNotificationPreferencesMutation();
     const [updateUser] = useUpdateUserMutation();

     // Edit mode state
     const [isEditingName, setIsEditingName] = useState(false);
     const [editedName, setEditedName] = useState('');
     const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

     // Push subscription
     const { isSupported: pushSupported, isSubscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushSubscription();

     const [localPrefs, setLocalPrefs] = useState({
          email_task_assigned: true,
          email_task_unassigned: true,
          email_status_changed: true,
          email_priority_changed: true,
          email_new_comment: true,
          email_due_date_changed: true,
          email_collaborator_added: true,
          email_collaborator_removed: true,
          email_mention: true,
          email_new_submission: true,
          push_enabled: true,
          push_chat_enabled: true,
     });

     useEffect(() => {
          if (preferences) {
               setLocalPrefs({
                    email_task_assigned: preferences.email_task_assigned,
                    email_task_unassigned: preferences.email_task_unassigned ?? true,
                    email_status_changed: preferences.email_status_changed,
                    email_priority_changed: preferences.email_priority_changed ?? true,
                    email_new_comment: preferences.email_new_comment,
                    email_due_date_changed: preferences.email_due_date_changed,
                    email_collaborator_added: preferences.email_collaborator_added ?? true,
                    email_collaborator_removed: preferences.email_collaborator_removed ?? true,
                    email_mention: preferences.email_mention ?? true,
                    email_new_submission: preferences.email_new_submission ?? true,
                    push_enabled: preferences.push_enabled ?? true,
                    push_chat_enabled: preferences.push_chat_enabled ?? true,
               });
          }
     }, [preferences]);

     useEffect(() => {
          setEditedName(displayName);
     }, [displayName]);

     const handleToggle = async (key: keyof typeof localPrefs, value: boolean) => {
          if (!currentUser?.id) return;

          const prevPrefs = { ...localPrefs };
          const newPrefs = { ...localPrefs, [key]: value };
          setLocalPrefs(newPrefs);

          try {
               await updatePreferences({
                    userId: currentUser.id,
                    preferences: { [key]: value },
               }).unwrap();
               toast.success(t('profile.preferencesSaved'));
          } catch {
               setLocalPrefs(prevPrefs);
               toast.error(t('profile.preferencesSaveFailed'));
          }
     };

     const handlePushMasterToggle = async (enable: boolean) => {
          if (enable) {
               const ok = await pushSubscribe();
               if (!ok) {
                    toast.error(t('profile.pushEnableFailed'));
                    return;
               }
               localStorage.removeItem(PUSH_OPTED_OUT_KEY);
               toast.success(t('profile.pushEnabled'));
          } else {
               const ok = await pushUnsubscribe();
               if (!ok) {
                    toast.error(t('profile.pushDisableFailed'));
                    return;
               }
               localStorage.setItem(PUSH_OPTED_OUT_KEY, 'true');
               toast.success(t('profile.pushDisabled'));
          }
     };

     const handleNameSave = async () => {
          if (!currentUser?.id || !editedName.trim()) return;

          try {
               await updateUser({
                    userId: currentUser.id,
                    updates: { custom_name: editedName.trim() },
               }).unwrap();
               toast.success(t('profile.nameUpdated'));
               setIsEditingName(false);
               refetchUser();
          } catch {
               toast.error(t('profile.nameUpdateFailed'));
          }
     };

     // Kompresja obrazu przed uploadem
     const compressImage = (file: File): Promise<File> => {
          return new Promise((resolve, reject) => {
               const img = new Image();
               const reader = new FileReader();

               reader.onload = (e) => {
                    img.src = e.target?.result as string;
               };

               img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d')!;
                    const maxWidth = 400;
                    const scale = Math.min(maxWidth / img.width, 1);

                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(
                         (blob) => {
                              if (blob) {
                                   const compressedFile = new File([blob], file.name, { type: file.type });
                                   resolve(compressedFile);
                              } else {
                                   reject(new Error(t('profile.compressionFailed')));
                              }
                         },
                         file.type,
                         0.8,
                    );
               };

               reader.onerror = reject;
               reader.readAsDataURL(file);
          });
     };

     const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file || !currentUser?.id) return;

          if (file.size > 5 * 1024 * 1024) {
               toast.error(t('profile.fileTooLarge'));
               return;
          }

          if (!file.type.startsWith('image/')) {
               toast.error(t('profile.mustBeImage'));
               return;
          }

          setIsUploadingAvatar(true);

          try {
               const compressedFile = await compressImage(file);

               const formData = new FormData();
               formData.append('file', compressedFile);

               const res = await fetch('/api/upload-avatar', {
                    method: 'POST',
                    body: formData,
               });

               const data = await res.json();

               if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Upload failed');
               }

               await updateUser({
                    userId: currentUser.id,
                    updates: { custom_image: data.publicUrl },
               }).unwrap();

               toast.success(t('profile.avatarUpdated'));
               refetchUser();
          } catch (err: unknown) {
               console.error('Avatar upload error:', err);

               let errorMessage = t('profile.avatarUploadFailed');

               if (err instanceof Error) {
                    errorMessage += `: ${err.message}`;
               } else if (typeof err === 'string') {
                    errorMessage += `: ${err}`;
               }

               toast.error(errorMessage);
          } finally {
               setIsUploadingAvatar(false);
          }
     };

     // Role badge
     const getRoleBadge = () => {
          const color = roleColors[userRole ?? ''] ?? roleColors.MEMBER;
          const roleKey = (userRole ?? 'MEMBER') as string;
          return <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${color}`}>{t(`roles.${roleKey}`)}</span>;
     };

     /* ── Loading state ──────────────────────────────────────── */

     if (userLoading) {
          return <Loader text={t('profile.loadingProfile')} />;
     }

     if (!session?.user) {
          return (
               <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                    <div className="text-slate-400">{t('auth.signInRequired')}</div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-slate-900">
               {/* Radial gradient overlay — matches dashboard / calendar */}
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-transparent to-transparent pointer-events-none" />

               <div className="relative">
                    <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-12">
                         <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-5xl mx-auto">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                   {/* ── Left Column ──────────────────────────── */}
                                   <div className="lg:col-span-1 space-y-6">
                                        {/* Profile Card */}
                                        <div className="bg-gradient-to-br from-slate-800/60 via-slate-800/60 to-slate-800/40 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
                                             <div className="h-16 sm:h-20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 relative overflow-hidden">
                                                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80" />
                                             </div>

                                             <div className="px-4 sm:px-6 pb-6 -mt-10 sm:-mt-12 flex flex-col items-center text-center">
                                                  <div className="relative group mb-3">
                                                       <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300" />
                                                       <div className="relative">
                                                            <Avatar src={displayAvatar} alt="Avatar" size={80} className="ring-4 ring-slate-900" key={displayAvatar} />
                                                            <button
                                                                 onClick={() => fileInputRef.current?.click()}
                                                                 disabled={isUploadingAvatar}
                                                                 className="absolute inset-0 bg-black/70 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center disabled:cursor-not-allowed backdrop-blur-sm"
                                                            >
                                                                 {isUploadingAvatar ? (
                                                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                 ) : (
                                                                      <div className="flex flex-col items-center gap-0.5">
                                                                           <Camera className="w-5 h-5 text-white drop-shadow-lg" />
                                                                           <span className="text-[10px] text-white font-medium">{t('profile.change')}</span>
                                                                      </div>
                                                                 )}
                                                            </button>
                                                       </div>
                                                       <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                                  </div>

                                                  <div className="w-full space-y-2">
                                                       {/* Name edit */}
                                                       {isEditingName ? (
                                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                                 <input
                                                                      type="text"
                                                                      value={editedName}
                                                                      onChange={(e) => setEditedName(e.target.value)}
                                                                      onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                                                                      className="flex-1 px-3 py-1.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                                      placeholder={t('profile.yourName')}
                                                                      autoFocus
                                                                 />
                                                                 <button
                                                                      onClick={handleNameSave}
                                                                      className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                                                 >
                                                                      <Check className="w-3.5 h-3.5 text-white" />
                                                                 </button>
                                                                 <button
                                                                      onClick={() => {
                                                                           setIsEditingName(false);
                                                                           setEditedName(displayName);
                                                                      }}
                                                                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all transform hover:scale-105 active:scale-95"
                                                                 >
                                                                      <X className="w-3.5 h-3.5 text-white" />
                                                                 </button>
                                                            </div>
                                                       ) : (
                                                            <div className="group/name cursor-pointer" onClick={() => setIsEditingName(true)}>
                                                                 <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all">
                                                                      <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate">
                                                                           {displayName}
                                                                      </h2>
                                                                      <div className="p-1 rounded-md bg-slate-800/50 group-hover/name:bg-slate-800 transition-all">
                                                                           <Pencil className="w-3 h-3 text-slate-400 group-hover/name:text-blue-400 transition-colors" />
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       )}

                                                       <div className="flex items-center justify-center gap-2 text-slate-400 text-xs sm:text-sm">
                                                            <Mail className="w-3 h-3" />
                                                            <span className="truncate">{session?.user?.email}</span>
                                                       </div>

                                                       <div className="flex justify-center pt-1">{getRoleBadge()}</div>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Boards Card */}
                                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-xl p-6">
                                             <div className="flex items-center justify-between mb-4">
                                                  <div className="flex items-center gap-2">
                                                       <LayoutDashboard className="w-4 h-4 text-blue-400" />
                                                       <h2 className="text-lg font-semibold text-slate-200">{t('profile.myProjects')}</h2>
                                                  </div>
                                                  {boards.length > 0 && <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">{boards.length}</span>}
                                             </div>

                                             {boardsLoading ? (
                                                  <div className="flex items-center gap-2 py-4">
                                                       <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                       <span className="text-slate-400 text-sm">{t('profile.loadingProjects')}</span>
                                                  </div>
                                             ) : boards.length === 0 ? (
                                                  <div className="flex flex-col items-center py-6 text-center">
                                                       <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center mb-3">
                                                            <Layers className="w-6 h-6 text-slate-500" />
                                                       </div>
                                                       <p className="text-slate-500 text-sm">{t('profile.noProjects')}</p>
                                                       <p className="text-slate-600 text-xs mt-1">{t('profile.createFirstOnDashboard')}</p>
                                                  </div>
                                             ) : (
                                                  <ul className="space-y-2">
                                                       {boards.map((b: { id: string; title: string; description?: string; _count?: { tasks?: number; teamMembers?: number } }) => (
                                                            <li key={b.id}>
                                                                 <Link
                                                                      href={`/board/${b.id}`}
                                                                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-700/30 border border-transparent hover:border-slate-600/50 hover:bg-slate-700/50 transition-all text-slate-100 group"
                                                                 >
                                                                      <span className="flex-1 truncate text-sm font-medium">{b.title}</span>
                                                                      <div className="flex items-center gap-2.5 text-xs text-slate-400">
                                                                           <span className="flex items-center gap-1">
                                                                                <ClipboardList className="w-3 h-3 text-slate-500" />
                                                                                {b._count?.tasks ?? 0}
                                                                           </span>
                                                                           <span className="flex items-center gap-1">
                                                                                <Users className="w-3 h-3 text-slate-500" />
                                                                                {b._count?.teamMembers ?? 0}
                                                                           </span>
                                                                      </div>
                                                                      <ChevronRight className="text-slate-500 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                                                                 </Link>
                                                            </li>
                                                       ))}
                                                  </ul>
                                             )}
                                        </div>
                                   </div>

                                   {/* ── Right Column — Settings ── */}
                                   <div className="lg:col-span-2 space-y-6">
                                        {/* Board Settings */}
                                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-xl p-6 sm:p-8">
                                             <div className="flex items-center gap-3 mb-6">
                                                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                                       <Settings2 className="w-5 h-5 text-white" />
                                                  </div>
                                                  <div className="min-w-0">
                                                       <h1 className="text-xl font-bold text-white">{t('profile.boardSettings')}</h1>
                                                       <p className="text-slate-400 text-sm">{t('profile.boardSettingsDesc')}</p>
                                                  </div>
                                             </div>

                                             <ToggleSwitch
                                                  enabled={showSubtasks}
                                                  onChange={(value) => {
                                                       setShowSubtasks(value);
                                                       toast.success(value ? t('profile.subtasksVisible') : t('profile.subtasksHidden'));
                                                  }}
                                                  label={t('profile.showSubtasks')}
                                                  description={t('profile.showSubtasksDesc')}
                                             />
                                        </div>

                                        {/* Push Notification Settings */}
                                        {pushSupported && (
                                             <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-xl p-6 sm:p-8">
                                                  <div className="flex items-center gap-3 mb-6">
                                                       <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <Smartphone className="w-5 h-5 text-white" />
                                                       </div>
                                                       <div className="min-w-0">
                                                            <h1 className="text-xl font-bold text-white">{t('profile.pushNotifications')}</h1>
                                                            <p className="text-slate-400 text-sm">{t('profile.pushNotificationsDesc')}</p>
                                                       </div>
                                                  </div>

                                                  {/* Master toggle */}
                                                  <div className="flex items-center justify-between py-3 border-b border-slate-700/30 gap-4">
                                                       <div className="flex-1 min-w-0">
                                                            <div className="text-white font-medium text-sm sm:text-base flex items-center gap-2">
                                                                 <BellRing className="w-4 h-4 text-emerald-400" />
                                                                 {t('profile.enablePush')}
                                                            </div>
                                                            <div className="text-slate-400 text-xs sm:text-sm">
                                                                 {pushSubscribed
                                                                      ? t('profile.pushActive')
                                                                      : t('profile.clickToActivate')}
                                                            </div>
                                                       </div>
                                                       <button
                                                            onClick={() => handlePushMasterToggle(!pushSubscribed)}
                                                            disabled={pushLoading}
                                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                 pushSubscribed ? 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-600 hover:bg-slate-500'
                                                            }`}
                                                       >
                                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${pushSubscribed ? 'translate-x-6' : 'translate-x-1'}`} />
                                                       </button>
                                                  </div>

                                                  {/* Sub-toggles (only when subscribed) */}
                                                  {pushSubscribed && (
                                                       <div className="mt-1">
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.push_enabled}
                                                                 onChange={(v) => handleToggle('push_enabled', v)}
                                                                 label={t('profile.taskNotifications')}
                                                                 description={t('profile.taskNotificationsDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.push_chat_enabled}
                                                                 onChange={(v) => handleToggle('push_chat_enabled', v)}
                                                                 label={t('profile.messageNotifications')}
                                                                 description={t('profile.messageNotificationsDesc')}
                                                            />
                                                       </div>
                                                  )}

                                                  <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-700/30">
                                                       <p className="text-slate-400 text-xs sm:text-sm">
                                                            {t('profile.pushInfo')}
                                                       </p>
                                                  </div>
                                             </div>
                                        )}

                                        {/* Notification Settings */}
                                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-xl p-6 sm:p-8">
                                             {/* Header */}
                                             <div className="flex items-center gap-3 mb-6">
                                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                                       <Bell className="w-5 h-5 text-white" />
                                                  </div>
                                                  <div className="min-w-0">
                                                       <h1 className="text-xl font-bold text-white">{t('profile.emailSettings')}</h1>
                                                       <p className="text-slate-400 text-sm">{t('profile.emailSettingsDesc')}</p>
                                                  </div>
                                             </div>

                                             {/* Email Notifications Section */}
                                             <div>
                                                  <div className="flex items-center gap-2 mb-4">
                                                       <Mail className="w-4 h-4 text-blue-400" />
                                                       <h2 className="text-lg font-semibold text-slate-200">{t('profile.emailNotifications')}</h2>
                                                  </div>

                                                  {prefsLoading ? (
                                                       <div className="flex items-center gap-2 py-4">
                                                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                            <span className="text-slate-400 text-sm">{t('profile.loadingPreferences')}</span>
                                                       </div>
                                                  ) : (
                                                       <div className="space-y-1">
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_task_assigned}
                                                                 onChange={(v) => handleToggle('email_task_assigned', v)}
                                                                 label={t('profile.emailTaskAssigned')}
                                                                 description={t('profile.emailTaskAssignedDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_task_unassigned}
                                                                 onChange={(v) => handleToggle('email_task_unassigned', v)}
                                                                 label={t('profile.emailTaskUnassigned')}
                                                                 description={t('profile.emailTaskUnassignedDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_status_changed}
                                                                 onChange={(v) => handleToggle('email_status_changed', v)}
                                                                 label={t('profile.emailStatusChanged')}
                                                                 description={t('profile.emailStatusChangedDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_priority_changed}
                                                                 onChange={(v) => handleToggle('email_priority_changed', v)}
                                                                 label={t('profile.emailPriorityChanged')}
                                                                 description={t('profile.emailPriorityChangedDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_new_comment}
                                                                 onChange={(v) => handleToggle('email_new_comment', v)}
                                                                 label={t('profile.emailNewComment')}
                                                                 description={t('profile.emailNewCommentDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_due_date_changed}
                                                                 onChange={(v) => handleToggle('email_due_date_changed', v)}
                                                                 label={t('profile.emailDueDateChanged')}
                                                                 description={t('profile.emailDueDateChangedDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_collaborator_added}
                                                                 onChange={(v) => handleToggle('email_collaborator_added', v)}
                                                                 label={t('profile.emailCollaboratorAdded')}
                                                                 description={t('profile.emailCollaboratorAddedDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_collaborator_removed}
                                                                 onChange={(v) => handleToggle('email_collaborator_removed', v)}
                                                                 label={t('profile.emailCollaboratorRemoved')}
                                                                 description={t('profile.emailCollaboratorRemovedDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_mention}
                                                                 onChange={(v) => handleToggle('email_mention', v)}
                                                                 label={t('profile.emailMentions')}
                                                                 description={t('profile.emailMentionsDesc')}
                                                            />
                                                            <ToggleSwitch
                                                                 enabled={localPrefs.email_new_submission}
                                                                 onChange={(v) => handleToggle('email_new_submission', v)}
                                                                 label={t('profile.emailNewSubmission')}
                                                                 description={t('profile.emailNewSubmissionDesc')}
                                                            />
                                                       </div>
                                                  )}
                                             </div>

                                             {/* Info */}
                                             <div className="mt-6 p-4 bg-slate-700/30 rounded-xl border border-slate-700/30">
                                                  <p className="text-slate-400 text-xs sm:text-sm">
                                                       {t('profile.emailInfo')}
                                                  </p>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         </motion.div>
                    </section>
               </div>
          </div>
     );
};

export default ProfilePage;
