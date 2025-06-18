import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * NextAuth configuration options for authentication.
 * Uses Google as the OAuth provider and integrates with Supabase for user management.
 */
export const authOptions: NextAuthOptions = {
  /**
   * Authentication providers.
   * Here we use Google OAuth.
   */
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  /**
   * Secret for NextAuth encryption/signing.
   */
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    /**
     * Callback triggered on sign-in.
     * Ensures the user exists in Supabase; if not, insert a new user record.
     * @param {{ user: import("next-auth").User }} params - Parameters provided by NextAuth.
     * @returns {Promise<boolean>} Return true to allow sign-in.
     */
    async signIn({ user }) {
      try {
        // Check if user with this Google ID exists in 'users' table
        const { data: existingUser, error: selectError } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", user.id)
          .single();

        // If an error occurred other than "no rows", allow sign-in but log error
        if (selectError && selectError.code !== "PGRST116") {
          console.error(
            "Error checking existing Supabase user:",
            selectError.message
          );
          return true;
        }

        // If user does not exist, insert a new record
        if (!existingUser) {
          const { error: insertError } = await supabase.from("users").insert({
            google_id: user.id,
            name: user.name || "",
            email: user.email || "",
            image: user.image || "",
          });

          if (insertError) {
            console.error(
              "Error inserting user into Supabase:",
              insertError.message
            );
          }
        }

        return true;
      } catch (error) {
        console.error("Error in NextAuth signIn callback:", error);
        // Allow sign-in even if Supabase operation fails
        return true;
      }
    },

    /**
     * Callback to control redirect URLs after sign-in or sign-out.
     * @param {{ url: string; baseUrl: string }} params - Requested URL and base URL.
     * @returns {Promise<string>} URL to redirect to.
     */
    async redirect({ url, baseUrl }) {
      // If signing out or root, redirect to baseUrl
      if (url.includes("signout") || url === baseUrl) {
        return baseUrl;
      }
      // If URL is on the same site, allow direct redirect
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // If relative path, prefix with baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },

    /**
     * JWT callback to include user ID in token.
     * @param {{ token: import("next-auth").JWT; user?: import("next-auth").User }} params
     * @returns {Promise<import("next-auth").JWT>} Modified JWT token.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * Session callback to include user ID from token into session object.
     * @param {{ session: import("next-auth").Session; token: import("next-auth").JWT }} params
     * @returns {Promise<import("next-auth").Session>} Modified session.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    /**
     * Event triggered on successful sign-in.
     * @param {import("next-auth").EventMessage} message - Event details.
     */
    async signIn(message) {
      // Add any custom logic on sign-in here.
    },

    /**
     * Event triggered on sign-out.
     * @param {import("next-auth").EventMessage} message - Event details.
     */
    async signOut(message) {
      // Add any custom logic on sign-out here.
    },
  },
  /**
   * Enable debug logs in development.
   */
  debug: process.env.NODE_ENV === "development",
};

/**
 * NextAuth handler for API route.
 * Exports GET and POST handlers for authentication endpoints.
 */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
