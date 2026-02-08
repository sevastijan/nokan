'use client';

interface OnlineIndicatorProps {
	isOnline: boolean;
	size?: 'sm' | 'md';
	className?: string;
}

const OnlineIndicator = ({ isOnline, size = 'sm', className = '' }: OnlineIndicatorProps) => {
	const sizeClasses = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

	return (
		<span
			className={`${sizeClasses} rounded-full border-2 border-slate-900 ${
				isOnline ? 'bg-green-500' : 'bg-slate-600'
			} ${className}`}
		/>
	);
};

export default OnlineIndicator;
