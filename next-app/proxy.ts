import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth"];

function getClientIp(req: NextRequest): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip");
}

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

export async function proxy(
  req: NextRequest,
  event: NextFetchEvent
) {
  const { pathname } = req.nextUrl;

  // Allow the login page and NextAuth endpoints.
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static assets.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  // Check for a valid NextAuth JWT.
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
   * Log a newly created login session once.
   * A sign-out/sign-in creates a new session token and therefore
   * creates a new notification.
   */
  const loginMarker = `${token.sub ?? "unknown"}:${token.iat ?? "unknown"}`;
  const previousMarker = req.cookies.get("sail_login_logged")?.value;

  if (previousMarker !== loginMarker) {
    const ip = getClientIp(req);
    const email = typeof token.email === "string" ? token.email : null;

    // Send the Discord notification without making the page wait for it.
    event.waitUntil(logToDiscord(ip, email));

    const response = NextResponse.next();

    response.cookies.set("sail_login_logged", loginMarker, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};