'use client';

import { FileIcon, Download } from 'lucide-react';
import { ChatAttachment } from '@/app/store/endpoints/chatEndpoints';
import { formatFileSize } from '../utils';

interface AttachmentPreviewProps {
	attachments: ChatAttachment[];
}

const AttachmentPreview = ({ attachments }: AttachmentPreviewProps) => {
	if (attachments.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-2 mt-2">
			{attachments.map((att) => {
				const isImage = att.mime_type.startsWith('image/');

				if (isImage) {
					return (
						<a
							key={att.id}
							href={`/api/chat/upload?filePath=${encodeURIComponent(att.file_path)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="block rounded-lg overflow-hidden border border-slate-700/50 hover:border-brand-500/50 transition max-w-[240px]"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={`/api/chat/upload?filePath=${encodeURIComponent(att.file_path)}`}
								alt={att.file_name}
								className="max-h-40 object-cover"
							/>
						</a>
					);
				}

				return (
					<a
						key={att.id}
						href={`/api/chat/upload?filePath=${encodeURIComponent(att.file_path)}&action=download`}
						className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition"
					>
						<FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
						<div className="min-w-0">
							<p className="text-xs text-white truncate max-w-[160px]">{att.file_name}</p>
							<p className="text-[10px] text-slate-500">{formatFileSize(att.file_size)}</p>
						</div>
						<Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
					</a>
				);
			})}
		</div>
	);
};

export default AttachmentPreview;
