import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
     return createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
     );
}

export const authOptions: NextAuthOptions = {
     providers: [
          GoogleProvider({
               clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
               clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
          }),
     ],
     secret: process.env.NEXTAUTH_SECRET,
     callbacks: {
          async signIn({ user }) {
               try {
                    console.log('SignIn callback - user:', user.id);

                    const { data: existingUser, error: selectError } = await getSupabase().from('users').select('*').eq('google_id', user.id).single();

                    if (selectError && selectError.code !== 'PGRST116') {
                         console.error('Error checking existing Supabase user:', selectError.message);
                         return true;
                    }

                    if (!existingUser) {
                         const { error: insertError } = await getSupabase().from('users').insert({
                              google_id: user.id,
                              name: user.name || '',
                              email: user.email || '',
                              image: user.image || '',
                         });

                         if (insertError) {
                              console.error('Error inserting user into Supabase:', insertError.message);
                         } else {
                              console.log('New user inserted into Supabase:', user.email);
                         }
                    } else {
                         console.log('Existing user found in Supabase:', user.email);
                    }

                    return true;
               } catch (error) {
                    console.error('Error in NextAuth signIn callback:', error);
                    return true;
               }
          },

          async redirect({ url, baseUrl }) {
               console.log('🔀 Redirect callback - url:', url, 'baseUrl:', baseUrl);
               if (url.includes('signout') || url === baseUrl) return baseUrl;
               if (url.startsWith(baseUrl)) return url;
               if (url.startsWith('/')) return `${baseUrl}${url}`;
               return `${baseUrl}/dashboard`;
          },

          async jwt({ token, user }) {
               if (user) {
                    console.log('JWT callback - creating token for user:', user.id);
                    token.id = user.id;
               } else {
                    console.log('JWT callback - refreshing existing token');
               }

               if (!token.id) {
                    console.error('WARNING: JWT token missing user ID!', token);
               }

               return token;
          },

          async session({ session, token }) {
               console.log('Session callback - token.id:', token.id);

               if (!token.id) {
                    console.error('ERROR: No user ID in JWT token!');
               }

               if (session.user) {
                    session.user.id = token.id as string;
                    console.log('Session created for user:', session.user.email, 'with ID:', session.user.id);
               } else {
                    console.error(' ERROR: Session.user is undefined!');
               }

               return session;
          },
     },
};

// NextAuth handler for API route
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
