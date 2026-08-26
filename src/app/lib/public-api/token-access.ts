import type { SupabaseClient } from '@supabase/supabase-js';

/** Global roles allowed to manage any board's API tokens. */
const MANAGEMENT_ROLES = ['OWNER', 'PROJECT_MANAGER'];

export type TokenAccessResult =
	| { ok: true; userId: string }
	| { ok: false; status: 401 | 403 | 404; error: string };

/**
 * Decides whether the signed-in user may manage a board's API tokens.
 *
 * The rule mirrors member management: the board creator always qualifies, and
 * so does anyone holding a global management role. Gating on the global role
 * alone locked creators with the default MEMBER role out of their own boards.
 */
export async function resolveTokenAccess(
	supabase: SupabaseClient,
	boardId: string,
	sessionEmail: string
): Promise<TokenAccessResult> {
	const { data: user } = await supabase
		.from('users')
		.select('id, role')
		.eq('email', sessionEmail)
		.maybeSingle();

	if (!user) {
		return { ok: false, status: 404, error: 'User not found' };
	}

	const { data: board } = await supabase
		.from('boards')
		.select('id, user_id')
		.eq('id', boardId)
		.maybeSingle();

	if (!board) {
		return { ok: false, status: 404, error: 'Board not found' };
	}

	const isBoardOwner = board.user_id === user.id;
	const hasManagementRole = MANAGEMENT_ROLES.includes(user.role);

	if (!isBoardOwner && !hasManagementRole) {
		return { ok: false, status: 403, error: 'Access denied' };
	}

	return { ok: true, userId: user.id };
}
