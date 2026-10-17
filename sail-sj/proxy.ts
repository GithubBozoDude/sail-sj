import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/register"];

const ALLOWED_PAGES = [
  "/",
  "/index",
  "/dashboard",
  "/profile",
];

type IPInfo = {
  ip?: string;
  org?: string;
  asn?: string;
  country_name?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  country?: string;
  connection?: {
    org?: string;
    asn?: number | string;
  };
  security?: {
    vpn?: boolean;
    proxy?: boolean;
    tor?: boolean;
  };
  vpn?: boolean;
  mobile?: boolean;
};

type FallbackIPInfo = {
  success?: boolean;
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: {
    id?: string;
  };
  connection?: {
    isp?: string;
    org?: string;
    asn?: number | string;
  };
  security?: {
    vpn?: boolean;
    proxy?: boolean;
    tor?: boolean;
  };
};

function getValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "Unknown";
  }

  return String(value);
}

function getPCInfo(userAgent: string): {
  os: string;
  browser: string;
} {
  let os = "Unknown";
  let browser = "Unknown";

  // Operating system
  if (/Windows NT 10\.0/i.test(userAgent)) {
    os = "Windows 10/11";
  } else if (/Windows NT 6\.3/i.test(userAgent)) {
    os = "Windows 8.1";
  } else if (/Windows NT 6\.2/i.test(userAgent)) {
    os = "Windows 8";
  } else if (/Windows NT 6\.1/i.test(userAgent)) {
    os = "Windows 7";
  } else if (/Windows NT 6\.0/i.test(userAgent)) {
    os = "Windows Vista";
  } else if (/Windows NT 5\.1|Windows XP/i.test(userAgent)) {
    os = "Windows XP";
  } else if (/Windows/i.test(userAgent)) {
    os = "Windows";
  } else if (/Android/i.test(userAgent)) {
    os = "Android";
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    os = "iOS";
  } else if (/Mac OS X/i.test(userAgent)) {
    const match = userAgent.match(/Mac OS X ([\d_]+)/i);
    os = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  } else if (/Linux/i.test(userAgent)) {
    os = "Linux";
  }

  // Browser — check Edge and Opera before Chrome.
  let match: RegExpMatchArray | null;

  if ((match = userAgent.match(/Edg\/([\d.]+)/i))) {
    browser = `Edge ${match[1]}`;
  } else if ((match = userAgent.match(/OPR\/([\d.]+)/i))) {
    browser = `Opera ${match[1]}`;
  } else if ((match = userAgent.match(/Firefox\/([\d.]+)/i))) {
    browser = `Firefox ${match[1]}`;
  } else if (
    (match = userAgent.match(/Chrome\/([\d.]+)/i)) &&
    !/Chromium/i.test(userAgent)
  ) {
    browser = `Chrome ${match[1]}`;
  } else if ((match = userAgent.match(/Chromium\/([\d.]+)/i))) {
    browser = `Chromium ${match[1]}`;
  } else if ((match = userAgent.match(/Version\/([\d.]+).*Safari/i))) {
    browser = `Safari ${match[1]}`;
  }

  return { os, browser };
}

async function logToDiscord(
  ip: string,
  email: string,
  path: string,
  domain: string,
  userAgent: string,
) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not configured.");
    return;
  }

  const now = new Date().toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }) + " AZ";

  let info: IPInfo = {};
  let fallback: FallbackIPInfo = {};

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (response.ok) {
      info = (await response.json()) as IPInfo;
    }
  } catch (error) {
    console.error("ipapi.co lookup failed:", error);
  }

  // Use a second provider to fill in missing information.
  const needsFallback =
    !info.country_name ||
    !info.region ||
    !info.city ||
    !info.org ||
    info.latitude === undefined ||
    info.longitude === undefined;

  if (needsFallback) {
    try {
      const response = await fetch(
        `https://ipwho.is/${encodeURIComponent(ip)}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
      );

      if (response.ok) {
        fallback = (await response.json()) as FallbackIPInfo;
      }
    } catch (error) {
      console.error("ipwho.is lookup failed:", error);
    }
  }

  const provider =
    info.org ||
    info.connection?.org ||
    fallback.connection?.org ||
    fallback.connection?.isp;

  const asn =
    info.asn ||
    info.connection?.asn ||
    fallback.connection?.asn;

  const country =
    info.country_name ||
    fallback.country;

  const region =
    info.region ||
    fallback.region;

  const city =
    info.city ||
    fallback.city;

  const latitude =
    info.latitude ??
    fallback.latitude;

  const longitude =
    info.longitude ??
    fallback.longitude;

  const coordinates =
    latitude !== undefined && longitude !== undefined
      ? `${latitude}, ${longitude}`
      : "Unknown";

  const timezone =
    info.timezone ||
    fallback.timezone?.id;

  const vpn = Boolean(
    info.vpn ||
      info.security?.vpn ||
      info.security?.proxy ||
      info.security?.tor ||
      fallback.security?.vpn ||
      fallback.security?.proxy ||
      fallback.security?.tor,
  );

  const mobile = Boolean(info.mobile);

  const bot =
    /bot|crawler|spider|crawling|headless/i.test(userAgent);

  const { os, browser } = getPCInfo(userAgent);

  const boxedValue = (value: unknown) => `\`${getValue(value)}\``;

  const booleanValue = (value: boolean) =>
    value ? "`TRUE`" : "`FALSE`";

  const fields = [
    {
      name: "IP Info",
      value: [
        `> **IP:** ${boxedValue(ip || "Unknown")}`,
        `> **Provider:** ${boxedValue(provider)}`,
        `> **ASN:** ${boxedValue(asn)}`,
        `> **Country:** ${boxedValue(country)}`,
        `> **Region:** ${boxedValue(region)}`,
        `> **City:** ${boxedValue(city)}`,
        `> **Coords:** ${boxedValue(coordinates)}`,
        `> **Timezone:** ${boxedValue(timezone)}`,
        `> **Mobile:** ${booleanValue(mobile)}`,
        `> **VPN:** ${booleanValue(vpn)}`,
        `> **Bot:** ${booleanValue(bot)}`,
      ].join("\n"),
      inline: false,
    },
    {
      name: "PC Info",
      value: [
        `> **OS:** \`${os}\``,
        `> **Browser:** \`${browser}\``,
      ].join("\n"),
      inline: false,
    },
    {
      name: "Visit Info",
      value: [
        `> **Email:** ${boxedValue(email)}`,
        `> **Page:** ${boxedValue(path)}`,
        `> **Domain:** ${boxedValue(domain)}`,
      ].join("\n"),
      inline: false,
    },
  ];

  const payload = {
    embeds: [
      {
        title: "Sail Visit",
        color: 0x2b2d31,
        fields,
        footer: {
          text: `Time: ${now}`,
        },
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
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Discord webhook failed:",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public pages and static/API requests.
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/sail/") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/index", req.url));
  }

  if (!ALLOWED_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  // Avoid logging requests that are not document navigations.
  const accept = req.headers.get("accept") || "";
  if (!accept.includes("text/html")) {
    return NextResponse.next();
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    realIp ||
    "Unknown";

  const email =
    typeof token.email === "string" ? token.email : "Unknown";

  const domain = req.nextUrl.hostname;
  const userAgent = req.headers.get("user-agent") || "Unknown";

  await logToDiscord(
    ip,
    email,
    pathname,
    domain,
    userAgent,
  );

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - Next.js static/image optimization
     * - favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
