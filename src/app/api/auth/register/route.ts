import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, email, password, confirmPassword } = body;

		if (!name || !email || !password || !confirmPassword) {
			return NextResponse.json({ error: 'All fields are required', code: 'validation' }, { status: 400 });
		}

		if (password.length < 8) {
			return NextResponse.json({ error: 'Password must be at least 8 characters', code: 'validation' }, { status: 400 });
		}

		if (password !== confirmPassword) {
			return NextResponse.json({ error: 'Passwords do not match', code: 'validation' }, { status: 400 });
		}

		const supabase = getSupabaseAdmin();

		const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();

		if (existingUser) {
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
