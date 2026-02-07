'use client';

import { useRef, useEffect } from 'react';

const COMMON_EMOJIS = [
	'👍', '❤️', '😂', '😮', '😢', '🔥',
	'🎉', '👏', '🙏', '💯', '✅', '❌',
	'👀', '🚀', '💪', '😊', '🤔', '👎',
];

interface EmojiPickerProps {
	onSelect: (emoji: string) => void;
	onClose: () => void;
}

const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [onClose]);

	return (
		<div
			ref={ref}
			className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700/50 rounded-xl p-2 shadow-xl z-20 w-[200px]"
		>
			<div className="grid grid-cols-6 gap-0.5">
				{COMMON_EMOJIS.map((emoji) => (
					<button
						key={emoji}
						onClick={() => onSelect(emoji)}
						className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition text-base cursor-pointer"
					>
						{emoji}
					</button>
				))}
			</div>
		</div>
	);
};

export default EmojiPicker;
