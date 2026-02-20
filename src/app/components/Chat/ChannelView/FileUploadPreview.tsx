'use client';

import { X, FileIcon, ImageIcon } from 'lucide-react';
import { formatFileSize } from '../utils';

interface FileUploadPreviewProps {
	files: File[];
	onRemove: (index: number) => void;
}

const FileUploadPreview = ({ files, onRemove }: FileUploadPreviewProps) => {
	return (
		<div className="flex flex-wrap gap-2 mb-2">
			{files.map((file, idx) => {
				const isImage = file.type.startsWith('image/');

				return (
					<div
						key={`${file.name}-${idx}`}
						className="relative flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg max-w-[200px]"
					>
						{isImage ? (
							<ImageIcon className="w-4 h-4 text-brand-400 shrink-0" />
						) : (
							<FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
						)}
						<div className="min-w-0">
							<p className="text-xs text-white truncate">{file.name}</p>
							<p className="text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
						</div>
						<button
							onClick={() => onRemove(idx)}
							className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
						>
							<X className="w-3 h-3" />
						</button>
					</div>
				);
			})}
		</div>
	);
};

export default FileUploadPreview;
