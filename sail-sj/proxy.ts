import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth", "/dev-messages.js"];

const ALLOWED_PAGES = [
  "/index.html",
  "/cyber.html",
  "/deepspace.html",
  "/og.html",
  "/nautical.html",
];

async function logToDiscord(
  ip: string | null,
  email: string | null,
  path: string,
  domain: string
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not configured.");
    return;
  }

  const now =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Phoenix",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date()) + " AZ";

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
            name: "Domain",
            value: domain || "unknown",
            inline: false,
          },
          {
            name: "Page",
            value: path,
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

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (
  pathname.startsWith("/_next") ||
  pathname.startsWith("/favicon") ||
  pathname.startsWith("/assets") ||
  pathname.startsWith("/sail/")
) {
  return NextResponse.next();
}

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL("/index.html", req.url)
    );
  }

  if (!ALLOWED_PAGES.includes(pathname)) {
    return NextResponse.redirect(
      new URL("/index.html", req.url)
    );
  }

  const fetchDest = req.headers.get("sec-fetch-dest");

  if (fetchDest === "document" || !fetchDest) {
    const forwardedFor = req.headers.get("x-forwarded-for");

    const ip =
      forwardedFor?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const email =
      typeof token.email === "string" ? token.email : null;

    // Gets the domain the visitor used.
    // Examples:
    // sail-sj-chi.vercel.app
    // sail-sj-og-chi.vercel.app
    // iready-ucer.vercel.app
    const domain = req.nextUrl.host;

    await logToDiscord(ip, email, pathname, domain);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};
