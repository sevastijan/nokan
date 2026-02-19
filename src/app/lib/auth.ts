import type { NextAuthOptions, Session, Account } from 'next-auth';
import type { User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getSupabaseAdmin } from '@/app/lib/supabase';

export const authOptions: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		GoogleProvider({
			clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
		...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
			? [
					GitHubProvider({
						clientId: process.env.GITHUB_CLIENT_ID,
						clientSecret: process.env.GITHUB_CLIENT_SECRET,
					}),
				]
			: []),
		CredentialsProvider({
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;

				const bcrypt = (await import('bcryptjs')).default;
				const supabase = getSupabaseAdmin();
				const { data: user, error } = await supabase
					.from('users')
					.select('id, email, name, image, password_hash')
					.eq('email', credentials.email)
					.not('password_hash', 'is', null)
					.single();

				if (error || !user?.password_hash) return null;

				const isValid = await bcrypt.compare(credentials.password, user.password_hash);
				if (!isValid) return null;

				return {
					id: String(user.id),
					email: user.email,
					name: user.name,
					image: user.image,
				};
			},
		}),
	],
	callbacks: {
		async signIn({ user, account }: { user: User; account: Account | null }) {
			const provider = account?.provider;
			if (provider !== 'google' && provider !== 'github') return true;

			const idColumn = provider === 'google' ? 'google_id' : 'github_id';

			try {
				const supabase = getSupabaseAdmin();
				const { data: existingUser, error: selectError } = await supabase.from('users').select('*').eq(idColumn, user.id).single();

				if (selectError && selectError.code !== 'PGRST116') {
					console.error('Error checking existing Supabase user:', selectError.message);
					throw selectError;
				}

				if (!existingUser) {
					const { error: insertError } = await supabase.from('users').insert({
						[idColumn]: user.id,
						name: user.name ?? '',
						email: user.email ?? '',
						image: user.image ?? '',
					});

					if (insertError) {
						console.error('Error inserting user into Supabase:', insertError.message);
						throw insertError;
					}
				}

				return true;
			} catch (error) {
				console.error('Error in signIn callback:', error);
				return true;
			}
		},

		async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
			if (url.includes('signout') || url === baseUrl) return baseUrl;
			if (url.startsWith(baseUrl)) return url;
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			return `${baseUrl}/dashboard`;
		},

		async jwt({ token, user }: { token: JWT; user?: User }) {
			if (user) {
				token.id = user.id;
			}

			if (!token.id) {
				console.error('WARNING: JWT token missing user ID!', token);
			}

			return token;
		},

		async session({ session, token }: { session: Session; token: JWT }) {
			if (!token.id) {
				console.error('ERROR: No user ID in JWT token!');
			}

			if (session.user) {
				session.user.id = token.id as string;
			} else {
				console.error('ERROR: Session.user is undefined!');
			}

			return session;
		},
	},
};
