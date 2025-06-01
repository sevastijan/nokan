import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("=== SIGNIN CALLBACK START ===");
      console.log("User:", user);
      console.log("Account:", account);
      console.log("Profile:", profile);
      
      try {
        // Sprawdź czy użytkownik już istnieje
        const { data: existingUser, error: selectError } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", user.id)
          .single();

        if (selectError && selectError.code !== "PGRST116") {
          console.error("Error checking existing user:", selectError);
          return true; // Nie blokuj logowania
        }

        if (!existingUser) {
          console.log("Creating new user...");
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              google_id: user.id,
              name: user.name || "",
              email: user.email || "",
              image: user.image || "",
            });

          if (insertError) {
            console.error("Error creating user:", insertError);
          } else {
            console.log("User created successfully");
          }
        } else {
          console.log("User already exists");
        }

        console.log("=== SIGNIN CALLBACK END - SUCCESS ===");
        return true;
      } catch (error) {
        console.error("=== SIGNIN CALLBACK ERROR ===", error);
        return true; // Nie blokuj logowania
      }
    },
    async redirect({ url, baseUrl }) {
      console.log("=== REDIRECT CALLBACK ===");
      console.log("URL:", url);
      console.log("BaseURL:", baseUrl);
      
      const redirectUrl = `${baseUrl}/dashboard`;
      console.log("Redirecting to:", redirectUrl);
      return redirectUrl;
    },
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Session:", session);
      return session;
    },
    async jwt({ token, account, user }) {
      console.log("=== JWT CALLBACK ===");
      console.log("Token:", token);
      return token;
    },
  },
  events: {
    async signIn(message) {
      console.log("=== SIGNIN EVENT ===", message);
    },
    async signOut(message) {
      console.log("=== SIGNOUT EVENT ===", message);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };