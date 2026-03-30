'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Eye, EyeOff, Check, Key } from 'lucide-react';
import { useGetAppSettingsQuery, useSaveAppSettingMutation } from '@/app/store/apiSlice';

const FIELDS = [
     { key: 'slack_client_id', labelKey: 'slack.clientId' },
     { key: 'slack_client_secret', labelKey: 'slack.clientSecret' },
     { key: 'slack_signing_secret', labelKey: 'slack.signingSecret' },
] as const;

export default function SlackAppSettings() {
     const { t } = useTranslation();
     const { data: settings, isLoading } = useGetAppSettingsQuery();
     const [saveAppSetting] = useSaveAppSettingMutation();

     const [values, setValues] = useState<Record<string, string>>({
          slack_client_id: '',
          slack_client_secret: '',
          slack_signing_secret: '',
     });
     const [visible, setVisible] = useState<Record<string, boolean>>({});
     const [saving, setSaving] = useState(false);

     useEffect(() => {
          if (settings) {
               setValues({
                    slack_client_id: settings.slack_client_id ?? '',
                    slack_client_secret: settings.slack_client_secret ?? '',
                    slack_signing_secret: settings.slack_signing_secret ?? '',
               });
          }
     }, [settings]);

     const handleSave = async () => {
          setSaving(true);
          try {
               for (const field of FIELDS) {
                    await saveAppSetting({ key: field.key, value: values[field.key] }).unwrap();
               }
               toast.success(t('slack.credentialsSaved'));
          } catch {
               toast.error('Failed to save credentials');
          } finally {
               setSaving(false);
          }
     };

     const toggleVisibility = (key: string) => {
          setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
     };

     if (isLoading) return null;

     return (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 max-w-lg">
               <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-slate-700">
                         <Key className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                         <h2 className="text-base font-semibold text-white">{t('slack.appSettings')}</h2>
                         <p className="text-xs text-slate-400 mt-0.5">{t('slack.configureFirst')}</p>
                    </div>
               </div>

               <div className="space-y-4">
                    {FIELDS.map(({ key, labelKey }) => {
                         const hasValue = !!(settings && settings[key]);
                         return (
                              <div key={key}>
                                   <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                                        {t(labelKey)}
                                        {hasValue && <Check className="w-4 h-4 text-emerald-400" />}
                                   </label>
                                   <div className="relative">
                                        <input
                                             type={visible[key] ? 'text' : 'password'}
                                             value={values[key]}
                                             onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                                             className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                                             placeholder={`Enter ${t(labelKey)}`}
                                        />
                                        <button
                                             type="button"
                                             onClick={() => toggleVisibility(key)}
                                             className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                                        >
                                             {visible[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                   </div>
                              </div>
                         );
                    })}
               </div>

               <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
               >
                    {saving ? t('common.saving') : t('slack.saveCredentials')}
               </button>
          </div>
     );
}
