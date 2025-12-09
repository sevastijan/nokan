'use client';

import { Fragment, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Transition } from '@headlessui/react';
import { FaBell, FaEnvelope } from 'react-icons/fa';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useGetNotificationPreferencesQuery, useUpdateNotificationPreferencesMutation } from '@/app/store/apiSlice';
import { toast } from 'react-toastify';

interface ToggleSwitchProps {
     enabled: boolean;
     onChange: (enabled: boolean) => void;
     label: string;
     description: string;
}

const ToggleSwitch = ({ enabled, onChange, label, description }: ToggleSwitchProps) => (
     <div className="flex items-center justify-between py-4 border-b border-slate-700/30 last:border-0">
          <div className="flex-1">
               <div className="text-white font-medium">{label}</div>
               <div className="text-slate-400 text-sm">{description}</div>
          </div>
          <button
               onClick={() => onChange(!enabled)}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-blue-600' : 'bg-slate-600'
               }`}
          >
               <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                         enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
               />
          </button>
     </div>
);

const SettingsPage = () => {
     const { data: session } = useSession();
     const { currentUser } = useCurrentUser();

     const { data: preferences, isLoading } = useGetNotificationPreferencesQuery(currentUser?.id ?? '', {
          skip: !currentUser?.id,
     });

     const [updatePreferences, { isLoading: isUpdating }] = useUpdateNotificationPreferencesMutation();

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
               // Revert on error
               setLocalPrefs(localPrefs);
               toast.error('Nie udało się zapisać preferencji');
          }
     };

     if (!session?.user) {
          return (
               <div className="max-w-2xl mx-auto pt-8 px-4">
                    <div className="text-slate-400">Zaloguj się, aby zobaczyć ustawienia.</div>
               </div>
          );
     }

     return (
          <div className="max-w-2xl mx-auto pt-8 px-4">
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
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl p-8 flex flex-col gap-6">
                         {/* Header */}
                         <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                   <FaBell className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                   <h1 className="text-xl font-bold text-white">Ustawienia powiadomień</h1>
                                   <p className="text-slate-400 text-sm">Zarządzaj powiadomieniami email</p>
                              </div>
                         </div>

                         {/* Email Notifications Section */}
                         <div className="mt-4">
                              <div className="flex items-center gap-2 mb-4">
                                   <FaEnvelope className="w-4 h-4 text-blue-400" />
                                   <h2 className="text-lg font-semibold text-slate-200">Powiadomienia email</h2>
                              </div>

                              {isLoading ? (
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
                         <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                              <p className="text-slate-400 text-sm">
                                   Powiadomienia email są wysyłane natychmiast po wystąpieniu zdarzenia.
                                   Niezależnie od tych ustawień, zawsze będziesz otrzymywać powiadomienia w aplikacji.
                              </p>
                         </div>
                    </div>
               </Transition>
          </div>
     );
};

export default SettingsPage;
