import type { NextAuthOptions, Session } from 'next-auth';
import type { User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { getSupabase } from '@/app/lib/supabase';

export const authOptions: NextAuthOptions = {
     secret: process.env.NEXTAUTH_SECRET,
     providers: [
          GoogleProvider({
               clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
               clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
          }),
     ],
     callbacks: {
          async signIn({ user }: { user: User }) {
               try {
                    const supabase = getSupabase();
                    const { data: existingUser, error: selectError } = await supabase.from('users').select('*').eq('google_id', user.id).single();

                    if (selectError && selectError.code !== 'PGRST116') {
                         console.error('Error checking existing Supabase user:', selectError.message);
                         throw selectError;
                    }

                    if (!existingUser) {
                         const { error: insertError } = await supabase.from('users').insert({
                              google_id: user.id,
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
