
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
  asn?: string | number;
  country_name?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  error?: boolean;
};

type FallbackIPInfo = {
  success?: boolean;
  message?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: { id?: string };
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
  };
  security?: {
    vpn?: boolean;
    proxy?: boolean;
    mobile?: boolean;
  };
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

  // Arizona timestamp, preserving the existing format.
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

  let info: IPInfo = {};
  let vpn = "Unknown";
  let mobile = "Unknown";

  if (ip) {
    // Primary IP lookup.
    try {
      const response = await fetch(
        `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
        { signal: AbortSignal.timeout(4000) }
      );

      if (response.ok) {
        const data = (await response.json()) as IPInfo;

        if (!data.error && (data.country_name || data.org)) {
          info = data;
        }
      }
    } catch (error) {
      console.error("Primary IP lookup failed:", error);
    }

    // Fallback when the primary lookup has no useful result.
    if (!info.country_name && !info.org) {
      try {
        const response = await fetch(
          `https://ipwho.is/${encodeURIComponent(ip)}`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (response.ok) {
          const data = (await response.json()) as FallbackIPInfo;

          if (data.success) {
            info = {
              org: data.connection?.isp || data.connection?.org,
              asn: data.connection?.asn,
              country_name: data.country,
              region: data.region,
              city: data.city,
              latitude: data.latitude,
              longitude: data.longitude,
              timezone: data.timezone?.id,
            };

            if (typeof data.security?.vpn === "boolean") {
              vpn = data.security.vpn ? "Yes" : "No";
            } else if (typeof data.security?.proxy === "boolean") {
              vpn = data.security.proxy ? "Yes (proxy detected)" : "Not detected";
            }

            if (typeof data.security?.mobile === "boolean") {
              mobile = data.security.mobile ? "Yes" : "No";
            }
          } else {
            console.error("Fallback IP lookup:", data.message);
          }
        }
      } catch (error) {
        console.error("Fallback IP lookup failed:", error);
      }
    }
  }

  const coordinates =
    typeof info.latitude === "number" &&
    typeof info.longitude === "number"
      ? `${info.latitude}, ${info.longitude} (Approximate)`
      : "Unknown";

  // This is a basic user-agent heuristic, not definitive bot detection.
  const isBot =
    /bot|crawler|spider|slurp|headless/i.test(userAgent || "");

  const bot = isBot
    ? "Likely (user-agent match)"
    : "Not detected";

  // Gray code-style block containing all IP details.
  const details = [
    `IP: ${ip || "Unknown"}`,
    `Provider: ${getValue(info.org)}`,
    `ASN: ${getValue(info.asn)}`,
    `Country: ${getValue(info.country_name)}`,
    `Region: ${getValue(info.region)}`,
    `City: ${getValue(info.city)}`,
    `Coordinates: ${coordinates}`,
    `Timezone: ${getValue(info.timezone)}`,
    `Mobile: ${mobile}`,
    `VPN: ${vpn}`,
    `Bot: ${bot}`,
  ].join("\n");

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
      value: getValue(info.org),
      inline: false,
    },
    {
      name: "ASN",
      value: getValue(info.asn),
      inline: true,
    },
    {
      name: "Country",
      value: getValue(info.country_name),
      inline: true,
    },
    {
      name: "Region",
      value: getValue(info.region),
      inline: true,
    },
    {
      name: "City",
      value: getValue(info.city),
      inline: true,
    },
    {
      name: "Coordinates",
      value: coordinates,
      inline: false,
    },
    {
      name: "Timezone",
      value: getValue(info.timezone),
      inline: true,
    },
    {
      name: "Mobile",
      value: mobile,
      inline: true,
    },
    {
      name: "VPN",
      value: vpn,
      inline: true,
    },
    {
      name: "Bot",
      value: bot,
      inline: true,
    },
    {
      name: "IP Information",
      value: `\`\`\`text\n${details}\n\`\`\``,
      inline: false,
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
