import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export const authOptions: NextAuthOptions = {
     providers: [
          GoogleProvider({
               clientId: process.env.GOOGLE_CLIENT_ID!,
               clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
     ],
     secret: process.env.NEXTAUTH_SECRET,
     callbacks: {
          async signIn({ user }) {
               try {
                    // Check if user exists in Supabase
                    const { data: existingUser, error: selectError } = await supabase.from('users').select('*').eq('google_id', user.id).single();

                    if (selectError && selectError.code !== 'PGRST116') {
                         console.error('Error checking existing Supabase user:', selectError.message);
                         return true;
                    }

                    if (!existingUser) {
                         const { error: insertError } = await supabase.from('users').insert({
                              google_id: user.id,
                              name: user.name || '',
                              email: user.email || '',
                              image: user.image || '',
                         });

                         if (insertError) {
                              console.error('Error inserting user into Supabase:', insertError.message);
                         }
                    }

                    return true;
               } catch (error) {
                    console.error('Error in NextAuth signIn callback:', error);
                    return true;
               }
          },

          async redirect({ url, baseUrl }) {
               if (url.includes('signout') || url === baseUrl) return baseUrl;
               if (url.startsWith(baseUrl)) return url;
               if (url.startsWith('/')) return `${baseUrl}${url}`;
               return `${baseUrl}/dashboard`;
          },

          async jwt({ token, user }) {
               if (user) token.id = user.id;
               return token;
          },

          async session({ session, token }) {
               if (session.user) session.user.id = token.id as string;
               return session;
          },
     },
};

// NextAuth handler for API route
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
