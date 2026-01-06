'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
     useGetChatChannelsQuery,
     useGetChatMessagesQuery,
     useSendChatMessageMutation,
     useCreateChatChannelMutation,
     useGetUserRoleQuery,
     useAddChatMemberMutation,
     useRemoveChatMemberMutation,
     useGetChatMembersQuery,
     useGetAllUsersQuery,
     useUpdateChatChannelMutation,
     useDeleteChatChannelMutation,
} from '@/app/store/apiSlice';
import { useDisplayUser } from '@/app/hooks/useDisplayUser';
import { getSupabase } from '@/app/lib/supabase';
import { FaPlus, FaPaperPlane, FaHashtag, FaEllipsisV } from 'react-icons/fa';
import { apiSlice } from '@/app/store/apiSlice';
import { useAppDispatch } from '@/app/store/hooks';
import CreateChannelModal from './CreateChannelModal';
import SearchUserModal from './SearchUserModal';
import ManageChannelModal from './ManageChannelModal';
import { ChatChannel, UserProfile } from '@/app/store/endpoints/chatEndpoints';

export default function SidebarChat() {
     const { data: session } = useSession();
     const dispatch = useAppDispatch();
     const { displayName, displayAvatar } = useDisplayUser();

     const user = (session?.user as { id?: string; email?: string; name?: string; image?: string }) || {};
     const userIdFromSession = user.id || '';
     const userEmail = user.email || '';

     const { data: userRole } = useGetUserRoleQuery(userEmail, { skip: !userEmail });
     const { data: channels = [] } = useGetChatChannelsQuery(userIdFromSession, { skip: !userIdFromSession });
     const { data: allUsers = [] } = useGetAllUsersQuery(undefined, { skip: !userIdFromSession }) as { data: UserProfile[] };

     const currentUserFromDb = useMemo(() => {
          return allUsers.find((u) => u.id === userIdFromSession || u.google_id === userIdFromSession);
     }, [allUsers, userIdFromSession]);

     const dbUserId = currentUserFromDb?.id || userIdFromSession;
     // ------------------------------------------

     const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
     const [newMessage, setNewMessage] = useState('');
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
     const [isManageModalOpen, setIsManageModalOpen] = useState(false);
     const [channelToManage, setChannelToManage] = useState<ChatChannel | null>(null);
     const scrollRef = useRef<HTMLDivElement>(null);

     const { data: messages = [] } = useGetChatMessagesQuery(selectedChannelId ?? '', { skip: !selectedChannelId });
     const { data: currentMembers = [] } = useGetChatMembersQuery(channelToManage?.id ?? '', {
          skip: !channelToManage,
     });

     const [sendMessage] = useSendChatMessageMutation();
     const [createChannel] = useCreateChatChannelMutation();
     const [addMember] = useAddChatMemberMutation();
     const [removeMember] = useRemoveChatMemberMutation();
     const [updateChannel] = useUpdateChatChannelMutation();
     const [deleteChannel] = useDeleteChatChannelMutation();

     useEffect(() => {
          if (!selectedChannelId) return;
          const supabase = getSupabase();
          const channel = supabase
               .channel(`sb_chat_${selectedChannelId}`)
               .on(
                    'postgres_changes',
                    {
                         event: 'INSERT',
                         schema: 'public',
                         table: 'chat_messages',
                         filter: `channel_id=eq.${selectedChannelId}`,
                    },
                    () => dispatch(apiSlice.util.invalidateTags([{ type: 'ChatMessages', id: selectedChannelId }])),
               )
               .subscribe();
          return () => {
               supabase.removeChannel(channel);
          };
     }, [selectedChannelId, dispatch]);

     useEffect(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }, [messages]);

     const getDisplayChannelName = useMemo(
          () => (channel: ChatChannel) => {
               if (!channel.is_direct) return channel.name;
               const otherUserId = channel.name.replace('dm-', '').replace(String(dbUserId), '').replace('-', '');
               const found = allUsers.find((u) => String(u.id) === otherUserId || (u.google_id && String(u.google_id) === otherUserId));
               return found ? found.custom_name || found.name || 'User' : `User (${otherUserId.substring(0, 5)})`;
          },
          [allUsers, dbUserId],
     );

     const handleCreateDM = async (targetUserId: string) => {
          if (!dbUserId) return;
          const existing = channels.find((c) => c.is_direct && c.name.includes(String(dbUserId)) && c.name.includes(String(targetUserId)));

          if (existing) {
               if (existing.is_archived) {
                    await updateChannel({ channelId: existing.id, updates: { is_archived: false } }).unwrap();
               }
               setSelectedChannelId(existing.id);
               setIsSearchModalOpen(false);
               return;
          }

          try {
               const newChannel = await createChannel({
                    name: `dm-${dbUserId}-${targetUserId}`,
                    created_by: dbUserId,
                    is_direct: true,
                    is_private: true,
               }).unwrap();
               await addMember({ channel_id: newChannel.id, user_id: targetUserId }).unwrap();
               await addMember({ channel_id: newChannel.id, user_id: dbUserId }).unwrap();

               setSelectedChannelId(newChannel.id);
               setIsSearchModalOpen(false);
          } catch (error) {
               console.error('Failed to create DM:', error);
          }
     };

     const canManage = userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';

     return (
          <div className="flex flex-col flex-1 mt-6 border-t border-slate-800 bg-slate-950/20 overflow-hidden text-slate-300">
               <div className="p-4 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Channels</span>
                    {canManage && (
                         <button onClick={() => setIsModalOpen(true)} className="hover:text-white transition">
                              <FaPlus size={12} />
                         </button>
                    )}
               </div>

               <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
                    {channels
                         .filter((c) => !c.is_direct && !c.is_archived)
                         .map((channel) => (
                              <div key={channel.id} className="group relative">
                                   <button
                                        onClick={() => setSelectedChannelId(channel.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                                             selectedChannelId === channel.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800/50 text-slate-400'
                                        }`}
                                   >
                                        <FaHashtag size={12} className={selectedChannelId === channel.id ? 'opacity-100' : 'opacity-40'} />
                                        <span className="text-xs font-medium truncate">{channel.name}</span>
                                   </button>
                                   {canManage && (
                                        <button
                                             onClick={() => {
                                                  setChannelToManage(channel);
                                                  setIsManageModalOpen(true);
                                             }}
                                             className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-lg transition"
                                        >
                                             <FaEllipsisV size={10} />
                                        </button>
                                   )}
                              </div>
                         ))}

                    <div className="p-4 flex justify-between items-center mt-4">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Direct Messages</span>
                         <button onClick={() => setIsSearchModalOpen(true)} className="hover:text-white transition">
                              <FaPlus size={12} />
                         </button>
                    </div>

                    {channels
                         .filter((c) => c.is_direct && !c.is_archived)
                         .map((channel) => (
                              <div key={channel.id} className="group relative">
                                   <button
                                        onClick={() => setSelectedChannelId(channel.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                                             selectedChannelId === channel.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800/50 text-slate-400'
                                        }`}
                                   >
                                        <div className={`w-2 h-2 rounded-full ${selectedChannelId === channel.id ? 'bg-white' : 'bg-green-500'} shadow-[0_0_5px_rgba(34,197,94,0.5)]`} />
                                        <span className="text-xs font-medium truncate">{getDisplayChannelName(channel)}</span>
                                   </button>
                                   <button
                                        onClick={() => {
                                             setChannelToManage(channel);
                                             setIsManageModalOpen(true);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-lg transition"
                                   >
                                        <FaEllipsisV size={10} />
                                   </button>
                              </div>
                         ))}
               </div>

               {selectedChannelId && (
                    <div className="h-96 border-t border-slate-800 bg-slate-900/40 flex flex-col">
                         <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                              {messages.map((msg) => (
                                   <div key={msg.id} className="flex flex-col">
                                        <span className="font-bold text-[11px] text-slate-400 mb-1">{msg.user_name}</span>
                                        <p className="text-slate-200 text-xs bg-slate-950/50 p-2 rounded-lg border border-slate-800/50 w-fit max-w-[90%]">{msg.content}</p>
                                   </div>
                              ))}
                              <div ref={scrollRef} />
                         </div>
                         <form
                              onSubmit={(e) => {
                                   e.preventDefault();
                                   if (newMessage.trim()) {
                                        sendMessage({
                                             channel_id: selectedChannelId,
                                             user_id: dbUserId,
                                             content: newMessage,
                                             user_name: displayName || 'User',
                                             user_avatar: displayAvatar || '',
                                        });
                                        setNewMessage('');
                                   }
                              }}
                              className="p-3 bg-slate-950"
                         >
                              <div className="relative">
                                   <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Message..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 pr-10 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                                   />
                                   <button type="submit" className="absolute right-3 top-2 text-blue-500 hover:text-blue-400 transition-colors">
                                        <FaPaperPlane size={14} />
                                   </button>
                              </div>
                         </form>
                    </div>
               )}

               <CreateChannelModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={async (name) => {
                         try {
                              const newChannel = await createChannel({
                                   name: name.toLowerCase().replace(/\s+/g, '-'),
                                   created_by: dbUserId,
                                   is_direct: false,
                                   is_private: false,
                              }).unwrap();

                              // Dodajemy siebie przy użyciu UUID (dbUserId)
                              await addMember({ channel_id: newChannel.id, user_id: dbUserId }).unwrap();

                              setSelectedChannelId(newChannel.id);
                              setIsModalOpen(false);
                         } catch (error) {
                              console.error('Błąd podczas tworzenia kanału:', error);
                         }
                    }}
               />

               <SearchUserModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} onSelectUser={handleCreateDM} />

               {channelToManage && (
                    <ManageChannelModal
                         isOpen={isManageModalOpen}
                         onClose={() => {
                              setIsManageModalOpen(false);
                              setChannelToManage(null);
                         }}
                         channel={channelToManage}
                         allUsers={allUsers}
                         currentMembers={currentMembers}
                         canManage={canManage}
                         currentUserId={dbUserId}
                         onUpdate={(updates: Partial<ChatChannel>) => {
                              updateChannel({ channelId: channelToManage.id, updates });
                         }}
                         onDelete={() => {
                              if (confirm('Delete?')) {
                                   deleteChannel(channelToManage.id);
                                   setSelectedChannelId(null);
                                   setIsManageModalOpen(false);
                              }
                         }}
                         onAddMember={(uId: string) => {
                              addMember({ channel_id: channelToManage.id, user_id: uId });
                         }}
                         onRemoveMember={(uId: string) => {
                              removeMember({ channel_id: channelToManage.id, user_id: uId });
                         }}
                    />
               )}
          </div>
     );
}
