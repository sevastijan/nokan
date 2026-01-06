'use client';

import { useState } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { Fragment } from 'react';
import { FaSearch, FaTimes, FaUser } from 'react-icons/fa';
import { useSearchUsersQuery } from '@/app/store/apiSlice';

interface Props {
     isOpen: boolean;
     onClose: () => void;
     onSelectUser: (id: string, name: string) => void;
}

export default function SearchUserModal({ isOpen, onClose, onSelectUser }: Props) {
     const [searchTerm, setSearchTerm] = useState('');

     const { data: users = [], isLoading } = useSearchUsersQuery(searchTerm, {
          skip: searchTerm.length < 2,
     });

     return (
          <Transition show={isOpen} as={Fragment}>
               <Dialog as="div" className="relative z-110" onClose={onClose}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200">
                         <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                         <div className="flex min-h-full items-center justify-center p-4">
                              <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200">
                                   <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl transition-all">
                                        <div className="flex items-center justify-between mb-6">
                                             <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">New Message</DialogTitle>
                                             <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                                                  <FaTimes size={20} />
                                             </button>
                                        </div>

                                        <div className="relative mb-4">
                                             <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                             <input
                                                  autoFocus
                                                  type="text"
                                                  value={searchTerm}
                                                  onChange={(e) => setSearchTerm(e.target.value)}
                                                  placeholder="Search by name or email..."
                                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                                             />
                                        </div>

                                        <div className="max-h-60 overflow-y-auto space-y-1">
                                             {isLoading && <p className="text-center text-slate-500 py-4 text-xs">Searching...</p>}
                                             {users.length > 0
                                                  ? users.map((user) => (
                                                         <button
                                                              key={user.id}
                                                              onClick={() => onSelectUser(user.id, user.name)}
                                                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors text-left group"
                                                         >
                                                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                                                                   {user.image ? <img src={user.image} alt={user.name} /> : <FaUser className="text-slate-600" />}
                                                              </div>
                                                              <div>
                                                                   <p className="text-sm font-semibold text-slate-200 group-hover:text-white">{user.name}</p>
                                                                   <p className="text-xs text-slate-500">{user.email}</p>
                                                              </div>
                                                         </button>
                                                    ))
                                                  : searchTerm.length >= 2 && !isLoading && <p className="text-center text-slate-500 py-4 text-xs">No users found.</p>}
                                        </div>
                                   </DialogPanel>
                              </TransitionChild>
                         </div>
                    </div>
               </Dialog>
          </Transition>
     );
}
