'use client';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Hash, ExternalLink, Unlink, AlertCircle } from 'lucide-react';
import {
     useGetAppSettingsQuery,
     useGetSlackIntegrationQuery,
     useDisconnectSlackMutation,
} from '@/app/store/apiSlice';
import Link from 'next/link';

interface SlackSectionProps {
     boardId: string;
}

const SlackSection = ({ boardId }: SlackSectionProps) => {
     const { t } = useTranslation();
     const { data: settings } = useGetAppSettingsQuery();
     const { data: integration, isLoading } = useGetSlackIntegrationQuery(boardId);
     const [disconnect] = useDisconnectSlackMutation();

     const isConfigured = !!settings?.slack_client_id;

     const handleDisconnect = async () => {
          if (!confirm(t('slack.disconnect') + '?')) return;
          try {
               await disconnect(boardId).unwrap();
               toast.success(t('slack.disconnected'));
          } catch {
               toast.error('Error');
          }
     };

     const handleConnect = () => {
          window.location.href = '/api/slack/install?boardId=' + boardId;
     };

     // State 1: Slack App not configured
     if (!isConfigured) {
          return (
               <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                         <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                         <span className="text-xs font-medium text-slate-300">{t('slack.title')}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">{t('slack.notConfigured')}</p>
                    <Link
                         href="/settings"
                         className="inline-flex items-center gap-1.5 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                    >
                         {t('slack.configureFirst')}
                         <ExternalLink className="w-3 h-3" />
                    </Link>
               </div>
          );
     }

     // Loading
     if (isLoading) {
          return (
               <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
                    <div className="flex items-center gap-2">
                         <div className="w-3 h-3 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
                         <span className="text-xs text-slate-500">{t('slack.title')}</span>
                    </div>
               </div>
          );
     }

     // State 2: Not connected
     if (!integration) {
          return (
               <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
                    <div className="flex items-center justify-between">
                         <span className="text-xs font-medium text-slate-300">{t('slack.title')}</span>
                         <button
                              onClick={handleConnect}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-white bg-[#4A154B] hover:bg-[#611f64] rounded-md transition-colors"
                         >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.164 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.164 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.164 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521zm0-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.314A2.528 2.528 0 0 1 24 15.164a2.528 2.528 0 0 1-2.522 2.521h-6.314z" />
                              </svg>
                              {t('slack.connect')}
                         </button>
                    </div>
               </div>
          );
     }

     // State 3: Connected
     return (
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
               <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300">{t('slack.title')}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                         integration.active
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-700/50 text-slate-500'
                    }`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${integration.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                         {integration.active ? t('slack.active') : t('slack.inactive')}
                    </span>
               </div>

               <div className="space-y-1.5 mb-3">
                    {integration.channel_name && (
                         <div className="flex items-center gap-1.5 text-[11px]">
                              <Hash className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="text-slate-400">{t('slack.channel')}:</span>
                              <span className="text-slate-200 font-medium truncate">{integration.channel_name}</span>
                         </div>
                    )}
                    {integration.workspace_name && (
                         <div className="flex items-center gap-1.5 text-[11px]">
                              <svg className="w-3 h-3 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.164 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.164 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.164 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521zm0-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.314A2.528 2.528 0 0 1 24 15.164a2.528 2.528 0 0 1-2.522 2.521h-6.314z" />
                              </svg>
                              <span className="text-slate-400">{t('slack.workspace')}:</span>
                              <span className="text-slate-200 font-medium truncate">{integration.workspace_name}</span>
                         </div>
                    )}
               </div>

               <button
                    onClick={handleDisconnect}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-md transition-colors"
               >
                    <Unlink className="w-3 h-3" />
                    {t('slack.disconnect')}
               </button>
          </div>
     );
};

export default SlackSection;
