'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface ChatInputProps {
     onSend: (content: string) => void;
     placeholder: string;
}

export default function ChatInput({ onSend, placeholder }: ChatInputProps) {
     const [text, setText] = useState('');
     const textareaRef = useRef<HTMLTextAreaElement>(null);

     useEffect(() => {
          if (textareaRef.current) {
               textareaRef.current.style.height = 'auto';
               textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          }
     }, [text]);

     const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               handleSend();
          }
     };

     const handleSend = () => {
          if (text.trim()) {
               onSend(text);
               setText('');
          }
     };

     return (
          <div className="relative max-w-4xl mx-auto flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-600/50 transition-all shadow-2xl">
               <textarea
                    ref={textareaRef}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent border-none px-3 py-2 focus:outline-none text-slate-200 resize-none max-h-48 scrollbar-hide"
               />
               <button onClick={handleSend} disabled={!text.trim()} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer mb-0.5">
                    <FaPaperPlane size={14} />
               </button>
          </div>
     );
}
