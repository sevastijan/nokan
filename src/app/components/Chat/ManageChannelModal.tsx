'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTrash, FaArchive, FaUserPlus, FaTimes, FaUserMinus } from 'react-icons/fa';
import { ChatChannel, UserProfile } from '@/app/store/endpoints/chatEndpoints';

interface Props {
     isOpen: boolean;
     onClose: () => void;
     channel: ChatChannel;
     allUsers: UserProfile[];
     currentMembers: UserProfile[];
     canManage: boolean;
     onUpdate: (updates: Partial<ChatChannel>) => void;
     onDelete: () => void;
     onAddMember: (uId: string) => void;
     onRemoveMember: (uId: string) => void;
     currentUserId?: string;
}

export default function ManageChannelModal({ isOpen, onClose, channel, allUsers, currentMembers, canManage, onUpdate, onDelete, onAddMember, onRemoveMember, currentUserId }: Props) {
     const [newName, setNewName] = useState(channel.name);

     const getFriendlyName = useCallback(() => {
          if (!channel.is_direct) return channel.name;
          const otherUserId = channel.name.replace('dm-', '').replace(String(currentUserId), '').replace('-', '');
          const found = allUsers.find((u) => String(u.id) === otherUserId || (u.google_id && String(u.google_id) === otherUserId));

          return found ? found.custom_name || found.name || 'User' : `User (${otherUserId.substring(0, 5)})`;
     }, [channel.is_direct, channel.name, currentUserId, allUsers]);

     useEffect(() => {
          setNewName(channel.is_direct ? getFriendlyName() : channel.name);
     }, [channel, getFriendlyName]);

     const availableUsers = useMemo(() => {
          return allUsers.filter((u) => {
               return !currentMembers.some((m) => m.id === u.id || (m.google_id && u.google_id && m.google_id === u.google_id));
          });
     }, [allUsers, currentMembers]);

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
               <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                         <h2 className="text-xl font-bold text-white">Channel Settings</h2>
                         <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                              <FaTimes />
                         </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-slate-800">
                         <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Channel Name</label>
                              <div className="flex gap-2">
                                   <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        disabled={channel.is_direct || !canManage}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                                   />
                                   {!channel.is_direct && canManage && (
                                        <button onClick={() => onUpdate({ name: newName })} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
                                             Save
                                        </button>
                                   )}
                              </div>
                         </div>

                         {canManage && !channel.is_direct && (
                              <>
                                   <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Add New Members</label>
                                        <div className="max-h-32 overflow-y-auto space-y-1 pr-2 scrollbar-hide">
                                             {availableUsers.map((u) => (
                                                  <div key={u.id} className="flex justify-between items-center p-2 hover:bg-slate-800/50 rounded-lg group">
                                                       {/* Renderowanie z priorytetem custom_name */}
                                                       <span className="text-xs text-slate-300">{u.custom_name || u.name}</span>
                                                       <button onClick={() => onAddMember(u.id)} className="text-blue-500 hover:text-blue-400 p-1 transition">
                                                            <FaUserPlus size={14} />
                                                       </button>
                                                  </div>
                                             ))}
                                        </div>
                                   </div>

                                   <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Members</label>
                                        <div className="max-h-32 overflow-y-auto space-y-1 pr-2 scrollbar-hide">
                                             {currentMembers.map((u) => (
                                                  <div key={u.id} className="flex justify-between items-center p-2 bg-slate-800/30 rounded-lg group">
                                                       <span className="text-xs text-slate-300">
                                                            {/* Renderowanie z priorytetem custom_name */}
                                                            {u.custom_name || u.name} {u.id === currentUserId && <span className="text-[10px] text-slate-500 ml-1">(You)</span>}
                                                       </span>
                                                       {u.id !== currentUserId && (
                                                            <button onClick={() => onRemoveMember(u.id)} className="text-red-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition">
                                                                 <FaUserMinus size={14} />
                                                            </button>
                                                       )}
                                                  </div>
                                             ))}
                                        </div>
                                   </div>
                              </>
                         )}

                         <div className="pt-4 border-t border-slate-800 flex gap-2">
                              <button
                                   onClick={() => {
                                        onUpdate({ is_archived: true });
                                        onClose();
                                   }}
                                   className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-yellow-900/20 hover:text-yellow-500 p-3 rounded-xl text-xs font-bold transition text-slate-400"
                              >
                                   <FaArchive size={12} /> Archive
                              </button>
                              <button
                                   onClick={onDelete}
                                   className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/20 hover:text-red-500 p-3 rounded-xl text-xs font-bold transition text-slate-400"
                              >
                                   <FaTrash size={12} /> Delete
                              </button>
                         </div>
                    </div>
               </div>
          </div>
     );
}
