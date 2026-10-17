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

function getPCInfo(userAgent: string | null) {
  const ua = userAgent || "";

  let os = "Unknown";

  // Check ChromeOS before Linux because ChromeOS user agents contain Linux.
  if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
  } else if (/Windows NT 10\.0/i.test(ua)) {
    // Windows 10 and 11 commonly share this user-agent identifier.
    os = "Windows 10/11";
  } else if (/Windows NT 6\.3/i.test(ua)) {
    os = "Windows 8.1";
  } else if (/Windows NT 6\.2/i.test(ua)) {
    os = "Windows 8";
  } else if (/Windows NT 6\.1/i.test(ua)) {
    os = "Windows 7";
  } else if (/Windows NT 6\.0/i.test(ua)) {
    os = "Windows Vista";
  } else if (/Windows NT 5\.1/i.test(ua)) {
    os = "Windows XP";
  } else if (/Windows/i.test(ua)) {
    os = "Windows";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/Mac OS X|Macintosh/i.test(ua)) {
    os = "macOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  let browser = "Unknown";

  // Check specific browsers before Chrome.
  const edge = ua.match(/Edg(?:A|iOS)?\/([\d.]+)/);
  const opera = ua.match(/(?:OPR|Opera)\/([\d.]+)/);
  const samsung = ua.match(/SamsungBrowser\/([\d.]+)/);
  const firefox = ua.match(/(?:Firefox|FxiOS)\/([\d.]+)/);
  const chrome = ua.match(/(?:Chrome|CriOS)\/([\d.]+)/);
  const safari = ua.match(/Version\/([\d.]+).*Safari/);

  if (edge) {
    browser = `Edge ${edge[1]}`;
  } else if (opera) {
    browser = `Opera ${opera[1]}`;
  } else if (samsung) {
    browser = `Samsung Browser ${samsung[1]}`;
  } else if (firefox) {
    browser = `Firefox ${firefox[1]}`;
  } else if (chrome) {
    browser = `Chrome ${chrome[1]}`;
  } else if (safari) {
    browser = `Safari ${safari[1]}`;
  }

  return { os, browser };
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
  let vpn = false;
  let mobile = false;

  if (ip) {
    // Primary lookup for location and provider information.
    try {
      const response = await fetch(
        `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
        { signal: AbortSignal.timeout(4000) }
      );

      if (response.ok) {
        const data = (await response.json()) as IPInfo;

        if (!data.error) {
          info = data;
        }
      }
    } catch (error) {
      console.error("Primary IP lookup failed:", error);
    }

    // Secondary lookup for VPN and mobile classifications.
    try {
      const response = await fetch(
        `https://ipwho.is/${encodeURIComponent(ip)}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = (await response.json()) as FallbackIPInfo;

        if (data.success) {
          // Use fallback location data when primary data is missing.
          if (!info.country_name && !info.org) {
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
          } else {
            // Fill missing values without overwriting valid primary data.
            info = {
              ...info,
              org: info.org || data.connection?.isp || data.connection?.org,
              asn: info.asn ?? data.connection?.asn,
              country_name: info.country_name || data.country,
              region: info.region || data.region,
              city: info.city || data.city,
              latitude: info.latitude ?? data.latitude,
              longitude: info.longitude ?? data.longitude,
              timezone: info.timezone || data.timezone?.id,
            };
          }

          if (typeof data.security?.vpn === "boolean") {
            vpn = data.security.vpn;
          } else if (typeof data.security?.proxy === "boolean") {
            vpn = data.security.proxy;
          }

          if (typeof data.security?.mobile === "boolean") {
            mobile = data.security.mobile;
          }
        } else {
          console.error("Fallback IP lookup:", data.message);
        }
      }
    } catch (error) {
      console.error("Fallback IP lookup failed:", error);
    }
  }

  const coordinates =
    typeof info.latitude === "number" &&
    typeof info.longitude === "number"
      ? `${info.latitude}, ${info.longitude} (Approximate)`
      : "Unknown";

  // Basic bot detection based on the user-agent header.
  const bot = /bot|crawler|spider|slurp|headless/i.test(userAgent || "");

  // Detect OS and browser from the user-agent header.
  const pcInfo = getPCInfo(userAgent);

  // Discord inline-code formatting creates a dark box around each value.
  const boxedValue = (value: unknown) => `\`${getValue(value)}\``;

  const booleanValue = (value: boolean) =>
    value ? "`TRUE`" : "`FALSE`";

  // Display all three categories as separate stacked sections.
  const fields = [
    {
      name: "IP Info:",
      value: [
        `> **IP:** ${boxedValue(ip || "unknown")}`,
        `> **Provider:** ${boxedValue(info.org)}`,
        `> **ASN:** ${boxedValue(info.asn)}`,
        `> **Country:** ${boxedValue(info.country_name)}`,
        `> **Region:** ${boxedValue(info.region)}`,
        `> **City:** ${boxedValue(info.city)}`,
        `> **Coords:** ${boxedValue(coordinates)}`,
        `> **Timezone:** ${boxedValue(info.timezone)}`,
        `> **Mobile:** ${booleanValue(mobile)}`,
        `> **VPN:** ${booleanValue(vpn)}`,
        `> **Bot:** ${booleanValue(bot)}`,
      ].join("\n"),
      inline: false,
    },
    {
      name: "PC Info:",
      value: [
        `> **OS:** ${boxedValue(pcInfo.os)}`,
        `> **Browser:** ${boxedValue(pcInfo.browser)}`,
      ].join("\n"),
      inline: false,
    },
    {
      name: "User Agent:",
      value: `> ${boxedValue(userAgent)}`,
      inline: false,
    },
  ];

  const payload = {
    content: "",
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
