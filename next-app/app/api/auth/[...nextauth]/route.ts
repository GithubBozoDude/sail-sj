import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { cookies } from "next/headers";

async function logToDiscord(
  ip: string | null,
  email: string | null
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not configured.");
    return;
  }

  const now = new Date().toISOString().replace("T", " ").replace("Z", " UTC");

  const payload = {
    content: "",
    embeds: [
      {
        title: "Google Login",
        description: `Time: ${now}`,
        fields: [
          {
            name: "IP",
            value: ip || "unknown",
            inline: true,
          },
          {
            name: "Email",
            value: email || "(none)",
            inline: true,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Discord webhook failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Discord webhook error:", error);
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  events: {
    async signIn({ user }) {
      /*
       * The login page/proxy stores the current IP briefly in a
       * server-only cookie. Read it here when the Google login
       * actually succeeds.
       */
      const cookieStore = await cookies();
      const ip = cookieStore.get("sail_login_ip")?.value ?? null;

      await logToDiscord(ip, user.email ?? null);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };