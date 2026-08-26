import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name: rawName, email: rawEmail, password, confirmPassword } = body;

		if (!rawName || !rawEmail || !password || !confirmPassword) {
			return NextResponse.json({ error: 'All fields are required', code: 'validation' }, { status: 400 });
		}

		// Emails are stored lowercase so the same address can never register twice
		const name = String(rawName).trim();
		const email = String(rawEmail).trim().toLowerCase();

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Invalid email address', code: 'invalid_email' }, { status: 400 });
		}

		if (password.length < 8) {
			return NextResponse.json({ error: 'Password must be at least 8 characters', code: 'validation' }, { status: 400 });
		}

		if (password !== confirmPassword) {
			return NextResponse.json({ error: 'Passwords do not match', code: 'validation' }, { status: 400 });
		}

		const supabase = getSupabaseAdmin();

		const { data: existingUser } = await supabase
			.from('users')
			.select('id, password_hash, google_id, github_id')
			.eq('email', email)
			.maybeSingle();

		if (existingUser) {
			// An OAuth-only account exists for this address - tell the user which door to use
			// instead of the generic "email taken", which would look like a dead end.
			if (!existingUser.password_hash && (existingUser.google_id || existingUser.github_id)) {
				return NextResponse.json({ error: 'Account uses social sign-in', code: 'oauth_account' }, { status: 409 });
			}

			return NextResponse.json({ error: 'Email already exists', code: 'duplicate_email' }, { status: 409 });
		}

		const passwordHash = await bcrypt.hash(password, 12);

		const { error: insertError } = await supabase.from('users').insert({
			name,
			email,
			password_hash: passwordHash,
			google_id: null,
			image: '',
		});

		if (insertError) {
			console.error('Registration insert error:', insertError.message);
			return NextResponse.json({ error: 'Failed to create account', code: 'server' }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Registration error:', error);
		return NextResponse.json({ error: 'Internal server error', code: 'server' }, { status: 500 });
	}
}
