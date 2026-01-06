'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { FaHashtag, FaTimes } from 'react-icons/fa';

interface Props {
     isOpen: boolean;
     onClose: () => void;
     onCreate: (name: string) => void;
}

export default function CreateChannelModal({ isOpen, onClose, onCreate }: Props) {
     const [name, setName] = useState('');

     const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (name.trim()) {
               onCreate(name.trim());
               setName('');
               onClose();
          }
     };

     return (
          <Transition show={isOpen} as={Fragment}>
               <Dialog as="div" className="relative z-100" onClose={onClose}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200">
                         <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                         <div className="flex min-h-full items-center justify-center p-4">
                              <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200">
                                   <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl transition-all">
                                        <div className="flex items-center justify-between mb-6">
                                             <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                                                  <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500">
                                                       <FaHashtag size={18} />
                                                  </div>
                                                  Create Channel
                                             </DialogTitle>
                                             <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                                                  <FaTimes size={20} />
                                             </button>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                             <div>
                                                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Channel Name</label>
                                                  <input
                                                       autoFocus
                                                       type="text"
                                                       value={name}
                                                       onChange={(e) => setName(e.target.value)}
                                                       placeholder="e.g. design-team"
                                                       className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                                                  />
                                                  <p className="mt-2 text-[11px] text-slate-500">Names must be lowercase and without spaces.</p>
                                             </div>

                                             <div className="flex gap-3 mt-8">
                                                  <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition">
                                                       Cancel
                                                  </button>
                                                  <button
                                                       type="submit"
                                                       disabled={!name.trim()}
                                                       className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-900/20"
                                                  >
                                                       Create Channel
                                                  </button>
                                             </div>
                                        </form>
                                   </DialogPanel>
                              </TransitionChild>
                         </div>
                    </div>
               </Dialog>
          </Transition>
     );
}
