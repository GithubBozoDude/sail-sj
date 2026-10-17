
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

type IPInfo = {
  org?: string;
  asn?: string;
  country_name?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  error?: boolean;
};

function getValue(value: unknown): string {
  return value !== undefined && value !== null && value !== ""
    ? String(value)
    : "Unknown";
}

async function logToDiscord(
  ip: string | null,
  email: string | null,
  path: string,
  domain: string,
  userAgent: string | null
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not configured.");
    return;
  }

  // Preserve the existing Arizona timestamp.
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

  let geo: IPInfo = {};

  // Retrieve approximate public-IP information.
  if (ip && ip !== "unknown") {
    try {
      const response = await fetch(
        `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
        { signal: AbortSignal.timeout(4000) }
      );

      if (response.ok) {
        const result = (await response.json()) as IPInfo;

        if (!result.error) {
          geo = result;
        }
      }
    } catch (error) {
      console.error("IP lookup failed:", error);
    }
  }

  const coordinates =
    typeof geo.latitude === "number" &&
    typeof geo.longitude === "number"
      ? `${geo.latitude}, ${geo.longitude} (Approximate)`
      : "Unknown";

  // A basic user-agent heuristic, not definitive bot detection.
  const isBot =
    /bot|crawler|spider|slurp|headless/i.test(userAgent || "");

  const fields = [
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
    {
      name: "Provider",
      value: getValue(geo.org),
      inline: false,
    },
    {
      name: "ASN",
      value: getValue(geo.asn),
      inline: true,
    },
    {
      name: "Country",
      value: getValue(geo.country_name),
      inline: true,
    },
    {
      name: "Region",
      value: getValue(geo.region),
      inline: true,
    },
    {
      name: "City",
      value: getValue(geo.city),
      inline: true,
    },
    {
      name: "Coordinates",
      value: coordinates,
      inline: false,
    },
    {
      name: "Timezone",
      value: getValue(geo.timezone),
      inline: true,
    },
    {
      name: "Mobile",
      value: "Unknown (not provided by lookup)",
      inline: true,
    },
    {
      name: "VPN",
      value: "Unknown (not provided by lookup)",
      inline: true,
    },
    {
      name: "Bot",
      value: isBot ? "Likely (user-agent match)" : "Not detected",
      inline: true,
    },
  ];

  const payload = {
    content: "",
    embeds: [
      {
        title: "Sail Visit",
        description: `Time: ${now}`,
        fields,
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
    return NextResponse.redirect(new URL("/index.html", req.url));
  }

  if (!ALLOWED_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/index.html", req.url));
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

    const domain = req.nextUrl.host;
    const userAgent = req.headers.get("user-agent");

    await logToDiscord(
      ip,
      email,
      pathname,
      domain,
      userAgent
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};
