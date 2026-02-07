/**
 * Format a date string to relative time (e.g., "2m", "1h", "3d").
 */
export function formatDistanceToNow(dateStr: string): string {
	const now = Date.now();
	const date = new Date(dateStr).getTime();
	const diff = now - date;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return 'teraz';
	if (minutes < 60) return `${minutes}m`;
	if (hours < 24) return `${hours}h`;
	if (days < 7) return `${days}d`;

	return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

/**
 * Format timestamp for message display (e.g., "14:30" or "wczoraj 14:30").
 */
export function formatMessageTime(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const time = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

	const isToday = date.toDateString() === now.toDateString();
	if (isToday) return time;

	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	if (date.toDateString() === yesterday.toDateString()) return `wczoraj ${time}`;

	return `${date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} ${time}`;
}

/**
 * Format a date for date separator in message list.
 */
export function formatDateSeparator(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();

	if (date.toDateString() === now.toDateString()) return 'Dzisiaj';

	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	if (date.toDateString() === yesterday.toDateString()) return 'Wczoraj';

	return date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Get display name from user object.
 */
export function getUserDisplayName(user?: { name?: string | null; custom_name?: string | null } | null): string {
	return user?.custom_name || user?.name || 'User';
}

/**
 * Get display avatar from user object.
 */
export function getUserDisplayAvatar(user?: { image?: string | null; custom_image?: string | null } | null): string {
	return user?.custom_image || user?.image || '';
}

/**
 * Format file size to human readable string.
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
