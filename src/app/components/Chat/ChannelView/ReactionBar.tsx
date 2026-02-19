'use client';

import { ChatReaction } from '@/app/store/endpoints/chatEndpoints';

interface ReactionBarProps {
	reactions: ChatReaction[];
	currentUserId: string;
	onToggle: (emoji: string) => void;
}

const ReactionBar = ({ reactions, currentUserId, onToggle }: ReactionBarProps) => {
	// Group reactions by emoji
	const grouped = reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>(
		(acc, r) => {
			if (!acc[r.emoji]) {
				acc[r.emoji] = { count: 0, hasOwn: false };
			}
			acc[r.emoji].count++;
			if (r.user_id === currentUserId) acc[r.emoji].hasOwn = true;
			return acc;
		},
		{}
	);

	return (
		<div className="flex flex-wrap gap-1 mt-1">
			{Object.entries(grouped).map(([emoji, { count, hasOwn }]) => (
				<button
					key={emoji}
					onClick={() => onToggle(emoji)}
					className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs transition cursor-pointer ${
						hasOwn
							? 'bg-purple-600/15 border border-purple-500/30 text-purple-300'
							: 'bg-slate-800/50 border border-slate-700/30 text-slate-400 hover:bg-slate-800'
					}`}
				>
					<span>{emoji}</span>
					<span className="font-medium">{count}</span>
				</button>
			))}
		</div>
	);
};

export default ReactionBar;
