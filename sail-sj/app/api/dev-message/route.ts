import { NextRequest, NextResponse } from "next/server";

const MESSAGE_KEY = "sail:dev-message";

type DevMessage = {
  id: string;
  message: string;
  createdAt: number;
};

async function redis(path: string, init?: RequestInit) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) throw new Error("Upstash Redis is not configured");
  return fetch(`${base}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

export async function GET(req: NextRequest) {
  try {
    const since = Number(req.nextUrl.searchParams.get("since") || 0);
    const response = await redis(`get/${encodeURIComponent(MESSAGE_KEY)}`);
    if (!response.ok) return NextResponse.json({ message: null }, { status: 502 });

    const data = await response.json() as { result: string | null };
    if (!data.result) return NextResponse.json({ message: null });

    const message = JSON.parse(data.result) as DevMessage;
    return NextResponse.json({
      message: message.createdAt > since ? message : null,
    });
  } catch (error) {
    console.error("Dev message GET failed:", error);
    return NextResponse.json({ message: null }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.DEV_MESSAGE_BOT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as { message?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const payload: DevMessage = {
      id: crypto.randomUUID(),
      message,
      createdAt: Date.now(),
    };

    const response = await redis(`set/${encodeURIComponent(MESSAGE_KEY)}`, {
      method: "POST",
      body: JSON.stringify(JSON.stringify(payload)),
    });

    if (!response.ok) return NextResponse.json({ error: "Storage failed" }, { status: 502 });
    return NextResponse.json({ ok: true, message: payload });
  } catch (error) {
    console.error("Dev message POST failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
