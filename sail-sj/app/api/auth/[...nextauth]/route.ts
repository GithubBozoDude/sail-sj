
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const ALLOWED_ORIGINS = new Set([
  "https://sail-sj-chi.vercel.app",
  "https://sail-sj-og-chi.vercel.app",
  "https://iready-ucer.vercel.app",
]);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        // Resolve relative URLs against the current auth base URL.
        const target = new URL(url, baseUrl);

        // Only allow redirects to your three approved domains.
        if (
          target.protocol === "https:" &&
          ALLOWED_ORIGINS.has(target.origin)
        ) {
          return target.toString();
        }
      } catch {
        // Invalid redirect URL.
      }

      // Safe fallback if the requested redirect is not allowed.
      return `${baseUrl}/index.html`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
