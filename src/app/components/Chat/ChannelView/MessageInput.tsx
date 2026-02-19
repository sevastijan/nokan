'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FileUploadPreview from './FileUploadPreview';

interface MessageInputProps {
	onSend: (content: string, files?: File[]) => void;
	channelId: string;
	currentUserId: string;
	placeholder?: string;
	onTyping?: () => void;
}

const MessageInput = ({ onSend, placeholder, onTyping }: MessageInputProps) => {
	const { t } = useTranslation();
	const resolvedPlaceholder = placeholder ?? t('chat.writeMessage');
	const [content, setContent] = useState('');
	const [stagedFiles, setStagedFiles] = useState<File[]>([]);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const adjustHeight = () => {
		const el = textareaRef.current;
		if (el) {
			el.style.height = 'auto';
			el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
		}
	};

	const handleSend = useCallback(() => {
		const trimmed = content.trim();
		if (!trimmed && stagedFiles.length === 0) return;

		onSend(trimmed, stagedFiles.length > 0 ? stagedFiles : undefined);
		setContent('');
		setStagedFiles([]);

		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
		}
	}, [content, stagedFiles, onSend]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024);
		setStagedFiles((prev) => [...prev, ...validFiles]);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const removeFile = (index: number) => {
		setStagedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const hasContent = content.trim().length > 0 || stagedFiles.length > 0;

	return (
		<div className="shrink-0 bg-slate-900/50 border-t border-slate-800/60">
			{stagedFiles.length > 0 && (
				<div className="px-5 pt-3">
					<FileUploadPreview files={stagedFiles} onRemove={removeFile} />
				</div>
			)}

			<div className="flex items-end gap-1.5 px-4 py-3">
				<button
					onClick={() => fileInputRef.current?.click()}
					className="mb-0.5 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition cursor-pointer shrink-0"
					title={t('chat.attachFile')}
				>
					<Paperclip className="w-[18px] h-[18px]" />
				</button>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					className="hidden"
					onChange={handleFileSelect}
				/>

				<div className="flex-1 relative">
					<textarea
						ref={textareaRef}
						value={content}
						onChange={(e) => { setContent(e.target.value); adjustHeight(); onTyping?.(); }}
						onKeyDown={handleKeyDown}
						placeholder={resolvedPlaceholder}
						rows={1}
						className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500/40 focus:bg-slate-800/80 transition-colors"
					/>
				</div>

				<button
					onClick={handleSend}
					disabled={!hasContent}
					className={`mb-0.5 p-2 rounded-lg shrink-0 transition-all cursor-pointer ${
						hasContent
							? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
							: 'text-slate-600 cursor-not-allowed'
					}`}
					title={t('chat.send')}
				>
					<Send className="w-[18px] h-[18px]" />
				</button>
			</div>
		</div>
	);
};

export default MessageInput;
