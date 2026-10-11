
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANNOUNCEMENTS_KEY = "sail:announcements";
const PRESENCE_KEY = "sail:announcement-presence";
const PRESENCE_WINDOW_MS = 15_000;

type DevMessage = {
  id: string;
  message: string;
  createdAt: number;
  audience: "online" | "all";
  recipients?: string[];
};

async function redisCommand<T>(...command: (string | number)[]): Promise<T> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!base || !token) {
    throw new Error("Upstash Redis is not configured");
  }

  const response = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  const data = await response.json() as {
    result?: T;
    error?: string;
  };

  if (!response.ok || data.error) {
    throw new Error(data.error || "Redis command failed");
  }

  return data.result as T;
}

async function getAccount(req: NextRequest): Promise<string | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return typeof token?.email === "string" && token.email.trim()
    ? token.email.trim().toLowerCase()
    : null;
}

function dismissalKey(email: string) {
  return `sail:announcement-dismissed:${encodeURIComponent(email)}`;
}

export async function GET(req: NextRequest) {
  try {
    const email = await getAccount(req);

    if (!email) {
      return NextResponse.json(
        { error: "Sign in with Google to view announcements." },
        { status: 401 },
      );
    }

    // Refresh this account's online presence.
    await redisCommand(
      "HSET",
      PRESENCE_KEY,
      email,
      Date.now(),
    );

    const [rawMessages, dismissedIds] = await Promise.all([
      redisCommand<string[]>("LRANGE", ANNOUNCEMENTS_KEY, "0", "-1"),
      redisCommand<string[]>("SMEMBERS", dismissalKey(email)),
    ]);

    const dismissed = new Set(dismissedIds || []);
    const now = Date.now();

    // Redis stores newest first; deliver oldest first.
    const messages = (rawMessages || [])
      .map((raw) => JSON.parse(raw) as DevMessage)
      .reverse()
      .filter((message) => {
        if (dismissed.has(message.id)) return false;

        if (message.audience === "all") return true;

        // Online-only messages go only to accounts present at send time.
        return Array.isArray(message.recipients)
          && message.recipients.includes(email)
          && now >= message.createdAt;
      });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Dev message GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load announcements." },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      action?: unknown;
      id?: unknown;
      message?: unknown;
      audience?: unknown;
    };

    // Dismissals require a verified Google sign-in session.
    if (body.action === "dismiss") {
      const email = await getAccount(req);

      if (!email) {
        return NextResponse.json(
          { error: "Please sign in first." },
          { status: 401 },
        );
      }

      if (typeof body.id !== "string" || !body.id) {
        return NextResponse.json(
          { error: "Announcement ID is required." },
          { status: 400 },
        );
      }

      await redisCommand(
        "SADD",
        dismissalKey(email),
        body.id,
      );

      return NextResponse.json({ ok: true });
    }

    // Publishing is reserved for the Discord bot.
    const secret = process.env.DEV_MESSAGE_BOT_SECRET;

    if (
      !secret
      || req.headers.get("authorization") !== `Bearer ${secret}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 },
      );
    }

    if (body.audience !== "online" && body.audience !== "all") {
      return NextResponse.json(
        { error: "Audience must be online or all." },
        { status: 400 },
      );
    }

    let recipients: string[] | undefined;

    if (body.audience === "online") {
      const presence = await redisCommand<string[]>(
        "HGETALL",
        PRESENCE_KEY,
      );

      const cutoff = Date.now() - PRESENCE_WINDOW_MS;
      recipients = [];

      for (let i = 0; i + 1 < (presence || []).length; i += 2) {
        const email = presence[i].toLowerCase();
        const lastSeen = Number(presence[i + 1]);

        if (Number.isFinite(lastSeen) && lastSeen >= cutoff) {
          recipients.push(email);
        }
      }

      recipients = [...new Set(recipients)];
    }

    const payload: DevMessage = {
      id: crypto.randomUUID(),
      message,
      createdAt: Date.now(),
      audience: body.audience,
      ...(recipients ? { recipients } : {}),
    };

    // Keep every announcement so returning users can receive old
    // all-user announcements even if newer announcements were sent.
    await redisCommand(
      "LPUSH",
      ANNOUNCEMENTS_KEY,
      JSON.stringify(payload),
    );

    return NextResponse.json({ ok: true, message: payload });
  } catch (error) {
    console.error("Dev message POST failed:", error);
    return NextResponse.json(
      { error: "Unable to process announcement." },
      { status: 503 },
    );
  }
}

