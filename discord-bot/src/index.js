const DISCORD_API = "https://discord.com/api/v10";
const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "sail-discord-bot" });
    }

    
if (url.pathname === "/start" && request.method === "POST") {
  return Response.json({
    secretLoaded: Boolean(env.START_SECRET),
    authorizationHeaderReceived: Boolean(
      request.headers.get("Authorization")
    ),
    secretLength: env.START_SECRET?.length ?? 0
  });
}
      const id = env.DISCORD_GATEWAY.idFromName("main");
      const stub = env.DISCORD_GATEWAY.get(id);
      return stub.fetch("https://discord-gateway/internal/start", { method: "POST" });
    }

    return new Response("Sail Discord bot is running.");
  },

  async scheduled(event, env, ctx) {
    const id = env.DISCORD_GATEWAY.idFromName("main");
    const stub = env.DISCORD_GATEWAY.get(id);
    ctx.waitUntil(stub.fetch("https://discord-gateway/internal/start", { method: "POST" }));
  }
};

export class DiscordGateway {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.ws = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.sequence = null;
    this.sessionId = null;
    this.resumeGatewayUrl = null;
    this.lastStart = 0;
  }

  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!this.env.DISCORD_BOT_TOKEN || !this.env.SITE_URL || !this.env.DEV_MESSAGE_BOT_SECRET) {
      return new Response("Missing DISCORD_BOT_TOKEN, SITE_URL, or DEV_MESSAGE_BOT_SECRET", { status: 500 });
    }

    await this.connect();
    return Response.json({ ok: true });
  }

  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const now = Date.now();
    if (now - this.lastStart < 5000) return;
    this.lastStart = now;

    this.clearTimers();

    const ws = new WebSocket(this.resumeGatewayUrl || GATEWAY_URL);
    this.ws = ws;

    ws.addEventListener("message", (event) => {
      this.handleGatewayMessage(event.data).catch((error) => {
        console.error("Gateway message error", error);
      });
    });

    ws.addEventListener("close", () => {
      this.ws = null;
      this.clearTimers();
      this.scheduleReconnect();
    });

    ws.addEventListener("error", (error) => {
      console.error("Discord WebSocket error", error);
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => console.error("Reconnect failed", error));
    }, 5000);
  }

  clearTimers() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  send(payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  async handleGatewayMessage(raw) {
    const packet = JSON.parse(raw);
    if (packet.s !== null && packet.s !== undefined) this.sequence = packet.s;

    switch (packet.op) {
      case 10: { // Hello
        const interval = packet.d.heartbeat_interval;
        this.heartbeatTimer = setInterval(() => {
          this.send({ op: 1, d: this.sequence });
        }, interval);

        if (this.sessionId && this.resumeGatewayUrl) {
          this.send({
            op: 6,
            d: {
              token: this.env.DISCORD_BOT_TOKEN,
              session_id: this.sessionId,
              seq: this.sequence
            }
          });
        } else {
          this.send({
            op: 2,
            d: {
              token: this.env.DISCORD_BOT_TOKEN,
              intents: 33281, // GUILDS (1) + GUILD_MESSAGES (512) + MESSAGE_CONTENT (32768)
              properties: {
                os: "cloudflare",
                browser: "sail-discord-bot",
                device: "sail-discord-bot"
              }
            }
          });
        }
        break;
      }

      case 0: { // Dispatch
        if (packet.t === "READY") {
          this.sessionId = packet.d.session_id;
          this.resumeGatewayUrl = packet.d.resume_gateway_url;
          console.log(`Connected to Discord as ${packet.d.user?.username || "bot"}`);
        }

        if (packet.t === "MESSAGE_CREATE") {
          await this.handleMessageCreate(packet.d);
        }
        break;
      }

      case 7: // Reconnect
        this.closeAndReconnect();
        break;

      case 9: // Invalid Session
        this.sessionId = null;
        this.resumeGatewayUrl = null;
        this.closeAndReconnect();
        break;

      case 11: // Heartbeat ACK
        break;

      default:
        break;
    }
  }

  closeAndReconnect() {
    this.clearTimers();
    try { this.ws?.close(1000, "reconnect"); } catch {}
    this.ws = null;
    this.scheduleReconnect();
  }

  async handleMessageCreate(message) {
    if (message.author?.bot) return;

    const content = message.content || "";
    const match = content.match(/^@online-users(?:\s+([\s\S]*))?$/i);
    if (!match) return;

    const text = (match[1] || "").trim();
    if (!text) {
      await this.sendDiscordMessage(message.channel_id, "Usage: `@online-users your message here`");
      return;
    }

    try {
      const siteUrl = this.env.SITE_URL.replace(/\/$/, "");
      const response = await fetch(`${siteUrl}/api/dev-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.env.DEV_MESSAGE_BOT_SECRET}`
        },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        const body = await response.text();
        console.error("Site rejected message:", response.status, body);
        await this.sendDiscordMessage(message.channel_id, "I couldn't send that message to the site.");
        return;
      }

      await this.addReaction(message.channel_id, message.id, "✅");
    } catch (error) {
      console.error("Site request failed", error);
      await this.sendDiscordMessage(message.channel_id, "I couldn't reach the site.");
    }
  }

  async discordApi(path, options = {}) {
    return fetch(`${DISCORD_API}${path}`, {
      ...options,
      headers: {
        "Authorization": `Bot ${this.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  }

  async sendDiscordMessage(channelId, content) {
    return this.discordApi(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content })
    });
  }

  async addReaction(channelId, messageId, emoji) {
    return this.discordApi(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`, {
      method: "PUT"
    });
  }
}
