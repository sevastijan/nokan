import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    /**
     * Handle user sign in and create user in database if not exists
     * @param user - User object from authentication provider
     * @param account - Account object from authentication provider
     * @param profile - Profile object from authentication provider
     * @returns Promise<boolean> - Whether to allow sign in
     */
    async signIn({ user, account, profile }) {
      try {
        const { data: existingUser, error: selectError } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", user.id)
          .single();

        if (selectError && selectError.code !== "PGRST116") {
          return true;
        }

        if (!existingUser) {
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              google_id: user.id,
              name: user.name || "",
              email: user.email || "",
              image: user.image || "",
            });

          if (insertError) {
            return true;
          }
        }

        return true;
      } catch (error) {
        return true;
      }
    },
    /**
     * Handle redirect after authentication
     * @param url - Current URL
     * @param baseUrl - Base URL of the application
     * @returns Promise<string> - URL to redirect to
     */
    async redirect({ url, baseUrl }) {
      // If signing out, redirect to home page
      if (url.includes('signout') || url === baseUrl) {
        return baseUrl;
      }
      
      // If callback URL is provided and valid, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // If relative URL, prepend base URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Default redirect to dashboard for sign in
      return `${baseUrl}/dashboard`;
    },
    /**
     * Handle session creation
     * @param session - Session object
     * @param token - JWT token
     * @returns Promise<Session> - Modified session object
     */
    async session({ session, token }) {
      return session;
    },
    /**
     * Handle JWT token creation
     * @param token - JWT token
     * @param account - Account object
     * @param user - User object
     * @returns Promise<JWT> - Modified JWT token
     */
    async jwt({ token, account, user }) {
      return token;
    },
  },
  events: {
    /**
     * Handle sign in event
     * @param message - Sign in event message
     */
    async signIn(message) {
      // Sign in event handling can be added here
    },
    /**
     * Handle sign out event
     * @param message - Sign out event message
     */
    async signOut(message) {
      // Sign out event handling can be added here
    },
  },
  debug: process.env.NODE_ENV === "development",
};

/**
 * NextAuth handler for API routes
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };