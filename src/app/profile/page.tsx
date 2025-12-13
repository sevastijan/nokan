'use client';

import { Fragment, useEffect, useState, useRef } from 'react';
import { Transition } from '@headlessui/react';
import Avatar from '../components/Avatar/Avatar';
import { useGetUserRoleQuery, useGetMyBoardsQuery, useGetNotificationPreferencesQuery, useUpdateNotificationPreferencesMutation, useUpdateUserMutation } from '@/app/store/apiSlice';
import Link from 'next/link';
import { FaTachometerAlt, FaChevronRight, FaBell, FaEnvelope, FaEdit, FaCamera, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'sonner';
import { useDisplayUser } from '../hooks/useDisplayUser';
import { useCurrentUser } from '../hooks/useCurrentUser';

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
          <button onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-slate-600'}`}>
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
     </div>
);

const ProfilePage = () => {
     const { displayName, email, currentUser, session } = useDisplayUser();
     const { refetchUser } = useCurrentUser();

     const fileInputRef = useRef<HTMLInputElement>(null);

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

     const [localPrefs, setLocalPrefs] = useState({
          email_task_assigned: true,
          email_task_unassigned: true,
          email_status_changed: true,
          email_priority_changed: true,
          email_new_comment: true,
          email_due_date_changed: true,
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
               });
          }
     }, [preferences]);

     useEffect(() => {
          setEditedName(displayName);
     }, [displayName]);

     const handleToggle = async (key: keyof typeof localPrefs, value: boolean) => {
          if (!currentUser?.id) return;

          const newPrefs = { ...localPrefs, [key]: value };
          setLocalPrefs(newPrefs);

          try {
               await updatePreferences({
                    userId: currentUser.id,
                    preferences: { [key]: value },
               }).unwrap();
               toast.success('Preferencje zapisane');
          } catch {
               setLocalPrefs(localPrefs);
               toast.error('Nie udało się zapisać preferencji');
          }
     };

     const handleNameSave = async () => {
          if (!currentUser?.id || !editedName.trim()) return;

          try {
               await updateUser({
                    userId: currentUser.id,
                    updates: { custom_name: editedName.trim() },
               }).unwrap();
               toast.success('Nazwa zaktualizowana');
               setIsEditingName(false);
               refetchUser();
          } catch {
               toast.error('Nie udało się zaktualizować nazwy');
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
                                   reject(new Error('Kompresja nie powiodła się'));
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
               toast.error('Plik jest za duży. Maksymalny rozmiar to 5MB');
               return;
          }

          if (!file.type.startsWith('image/')) {
               toast.error('Plik musi być obrazem');
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

               toast.success('Avatar zaktualizowany');
               refetchUser();
          } catch (err: unknown) {
               console.error('Błąd podczas uploadu avatara:', err);

               let errorMessage = 'Nie udało się zaktualizować avatara';

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

     // Helper function to get display avatar
     const getDisplayAvatar = () => {
          return currentUser?.custom_image || currentUser?.image || session?.user?.image || '';
     };

     // Helper function to get display name
     const getDisplayName = () => {
          return currentUser?.custom_name || currentUser?.name || session?.user?.name || 'User';
     };

     // Role badge
     const getRoleBadge = () => {
          let badgeColor = '',
               roleText = '';
          switch (userRole) {
               case 'OWNER':
                    badgeColor = 'bg-yellow-600/20 text-yellow-300 border-yellow-400/30';
                    roleText = 'Owner';
                    break;
               case 'PROJECT_MANAGER':
                    badgeColor = 'bg-blue-600/20 text-blue-300 border-blue-400/30';
                    roleText = 'Project Manager';
                    break;
               default:
                    badgeColor = 'bg-slate-600/20 text-slate-300 border-slate-400/30';
                    roleText = 'Member';
          }
          return <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${badgeColor}`}>{roleText}</span>;
     };

     if (!session?.user) {
          return (
               <div className="max-w-5xl mx-auto pt-8 px-4">
                    <div className="text-slate-400">Zaloguj się, aby zobaczyć profil.</div>
               </div>
          );
     }

     return (
          <div className="max-w-5xl mx-auto pt-8 px-4 pb-8">
               <Transition
                    appear
                    show={true}
                    as={Fragment}
                    enter="transition-all duration-300"
                    enterFrom="opacity-0 translate-y-4"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition-all duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
               >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <div className="lg:col-span-1 space-y-6">
                              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
                                   <div className="h-16 sm:h-20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>
                                   </div>

                                   <div className="px-4 sm:px-6 pb-6 -mt-10 sm:-mt-12 flex flex-col items-center text-center">
                                        <div className="relative group mb-3">
                                             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
                                             <div className="relative">
                                                  <Avatar src={getDisplayAvatar()} alt="Avatar" size={80} className="ring-4 ring-slate-900" key={getDisplayAvatar()} />
                                                  <button
                                                       onClick={() => fileInputRef.current?.click()}
                                                       disabled={isUploadingAvatar}
                                                       className="absolute inset-0 bg-black/70 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center disabled:cursor-not-allowed backdrop-blur-sm"
                                                  >
                                                       {isUploadingAvatar ? (
                                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                       ) : (
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                 <FaCamera className="w-5 h-5 text-white drop-shadow-lg" />
                                                                 <span className="text-[10px] text-white font-medium">Zmień</span>
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
                                                            placeholder="Twoja nazwa..."
                                                            autoFocus
                                                       />
                                                       <button
                                                            onClick={handleNameSave}
                                                            className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                                       >
                                                            <FaSave className="w-3.5 h-3.5 text-white" />
                                                       </button>
                                                       <button
                                                            onClick={() => {
                                                                 setIsEditingName(false);
                                                                 setEditedName(getDisplayName());
                                                            }}
                                                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all transform hover:scale-105 active:scale-95"
                                                       >
                                                            <FaTimes className="w-3.5 h-3.5 text-white" />
                                                       </button>
                                                  </div>
                                             ) : (
                                                  <div className="group/name cursor-pointer" onClick={() => setIsEditingName(true)}>
                                                       <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all">
                                                            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate">{getDisplayName()}</h2>
                                                            <div className="p-1 rounded-md bg-slate-800/50 group-hover/name:bg-slate-800 transition-all">
                                                                 <FaEdit className="w-3 h-3 text-slate-400 group-hover/name:text-blue-400 transition-colors" />
                                                            </div>
                                                       </div>
                                                  </div>
                                             )}

                                             <div className="flex items-center justify-center gap-2 text-slate-400 text-xs sm:text-sm">
                                                  <FaEnvelope className="w-3 h-3" />
                                                  <span className="truncate">{session?.user?.email}</span>
                                             </div>

                                             <div className="flex justify-center pt-1">{getRoleBadge()}</div>
                                        </div>
                                   </div>
                              </div>

                              {/* Boards Card */}
                              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl p-6">
                                   <div className="flex items-center gap-2 mb-4">
                                        <FaTachometerAlt className="w-4 h-4 text-blue-400" />
                                        <h2 className="text-lg font-semibold text-slate-200">My Boards</h2>
                                   </div>

                                   {boardsLoading ? (
                                        <div className="text-slate-400 text-sm">Loading...</div>
                                   ) : boards.length === 0 ? (
                                        <div className="text-slate-500 text-sm">No boards yet.</div>
                                   ) : (
                                        <ul className="space-y-2">
                                             {boards.map((b: { id: string; title: string; description?: string }) => (
                                                  <li key={b.id}>
                                                       <Link
                                                            href={`/board/${b.id}`}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 transition text-slate-100 group"
                                                       >
                                                            <span className="flex-1 truncate text-sm">{b.title}</span>
                                                            <FaChevronRight className="text-slate-400 w-3 h-3 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                                                       </Link>
                                                       {b.description && <div className="ml-3 mt-1 text-xs text-slate-400 truncate">{b.description}</div>}
                                                  </li>
                                             ))}
                                        </ul>
                                   )}
                              </div>
                         </div>

                         {/* Right Column - Notification Settings */}
                         <div className="lg:col-span-2">
                              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl p-6 sm:p-8">
                                   {/* Header */}
                                   <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                             <FaBell className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                             <h1 className="text-xl font-bold text-white">Ustawienia powiadomień</h1>
                                             <p className="text-slate-400 text-sm">Zarządzaj powiadomieniami email</p>
                                        </div>
                                   </div>

                                   {/* Email Notifications Section */}
                                   <div>
                                        <div className="flex items-center gap-2 mb-4">
                                             <FaEnvelope className="w-4 h-4 text-blue-400" />
                                             <h2 className="text-lg font-semibold text-slate-200">Powiadomienia email</h2>
                                        </div>

                                        {prefsLoading ? (
                                             <div className="text-slate-400 text-sm py-4">Ładowanie...</div>
                                        ) : (
                                             <div className="space-y-1">
                                                  <ToggleSwitch
                                                       enabled={localPrefs.email_task_assigned}
                                                       onChange={(v) => handleToggle('email_task_assigned', v)}
                                                       label="Przypisanie do zadania"
                                                       description="Otrzymuj email gdy zostaniesz przypisany do zadania"
                                                  />
                                                  <ToggleSwitch
                                                       enabled={localPrefs.email_task_unassigned}
                                                       onChange={(v) => handleToggle('email_task_unassigned', v)}
                                                       label="Usunięcie z zadania"
                                                       description="Otrzymuj email gdy zostaniesz usunięty z zadania"
                                                  />
                                                  <ToggleSwitch
                                                       enabled={localPrefs.email_status_changed}
                                                       onChange={(v) => handleToggle('email_status_changed', v)}
                                                       label="Zmiana statusu"
                                                       description="Otrzymuj email gdy zmieni się status Twojego zadania"
                                                  />
                                                  <ToggleSwitch
                                                       enabled={localPrefs.email_priority_changed}
                                                       onChange={(v) => handleToggle('email_priority_changed', v)}
                                                       label="Zmiana priorytetu"
                                                       description="Otrzymuj email gdy zmieni się priorytet Twojego zadania"
                                                  />
                                                  <ToggleSwitch
                                                       enabled={localPrefs.email_new_comment}
                                                       onChange={(v) => handleToggle('email_new_comment', v)}
                                                       label="Nowe komentarze"
                                                       description="Otrzymuj email gdy ktoś skomentuje Twoje zadanie"
                                                  />
                                                  <ToggleSwitch
                                                       enabled={localPrefs.email_due_date_changed}
                                                       onChange={(v) => handleToggle('email_due_date_changed', v)}
                                                       label="Zmiana terminu"
                                                       description="Otrzymuj email gdy zmieni się termin Twojego zadania"
                                                  />
                                             </div>
                                        )}
                                   </div>

                                   {/* Info */}
                                   <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                                        <p className="text-slate-400 text-xs sm:text-sm">
                                             Powiadomienia email są wysyłane natychmiast po wystąpieniu zdarzenia. Niezależnie od tych ustawień, zawsze będziesz otrzymywać powiadomienia w aplikacji.
                                        </p>
                                   </div>
                              </div>
                         </div>
                    </div>
               </Transition>
          </div>
     );
};

export default ProfilePage;
