import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth"];

async function logToDiscord(
  ip: string | null,
  email: string | null,
  path: string
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
        title: "Sail Visit",
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
          {
            name: "Page",
            value: path || "/",
            inline: false,
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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page and NextAuth endpoints are public.
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Don't process Next.js/static assets.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  // Don't process API routes.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check for an authenticated NextAuth session.
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not signed in -> redirect to login.
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);

    return NextResponse.redirect(loginUrl);
  }

  /*
   * Only log actual browser document navigations.
   *
   * This means:
   * - refreshing a page -> notification
   * - closing/reopening the site -> notification
   * - navigating to another HTML page -> notification
   *
   * It avoids logging images, scripts, stylesheets, etc.
   */
  const fetchDest = req.headers.get("sec-fetch-dest");

  if (fetchDest === "document" || !fetchDest) {
    const forwardedFor = req.headers.get("x-forwarded-for");

    const ip =
      forwardedFor?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const email = typeof token.email === "string" ? token.email : null;

    await logToDiscord(ip, email, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};