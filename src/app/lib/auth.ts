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
			clientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
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
				const email = credentials.email.trim().toLowerCase();
				const { data: user, error } = await supabase
					.from('users')
					.select('id, email, name, image, password_hash')
					.eq('email', email)
					.not('password_hash', 'is', null)
					.maybeSingle();

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
				const providerAccountId = user.id;
				const { data: existingUser, error: selectError } = await supabase.from('users').select('*').eq(idColumn, providerAccountId).single();

				if (selectError && selectError.code !== 'PGRST116') {
					console.error('Error checking existing Supabase user:', selectError.message);
					throw selectError;
				}

				if (existingUser) {
					// Replace provider ID with Supabase UUID so JWT stores the correct ID
					user.id = String(existingUser.id);
				} else {
					const email = (user.email ?? '').trim().toLowerCase();

					// The address may already belong to a password account (or one created by
					// accepting an invitation). Link the provider to it instead of inserting a
					// duplicate - the insert would violate the unique email constraint and leave
					// the provider ID in the JWT, which breaks every board permission check.
					const { data: userByEmail } = email
						? await supabase.from('users').select('id').eq('email', email).maybeSingle()
						: { data: null };

					if (userByEmail) {
						const { error: linkError } = await supabase
							.from('users')
							.update({ [idColumn]: providerAccountId })
							.eq('id', userByEmail.id);

						if (linkError) {
							console.error(`Error linking ${provider} account to existing user:`, linkError.message);
							return false;
						}

						user.id = String(userByEmail.id);
					} else {
						const { data: newUser, error: insertError } = await supabase
							.from('users')
							.insert({
								[idColumn]: providerAccountId,
								name: user.name ?? '',
								email,
								image: user.image ?? '',
							})
							.select('id')
							.single();

						if (insertError) {
							console.error('Error inserting user into Supabase:', insertError.message);
							throw insertError;
						}

						if (newUser) {
							user.id = String(newUser.id);
						}
					}
				}

				return true;
			} catch (error) {
				// Fail closed: without a resolved Supabase UUID the session would carry the
				// provider ID, and every board/team lookup keyed on user_id would deny access.
				console.error('Error in signIn callback:', error);
				return false;
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
