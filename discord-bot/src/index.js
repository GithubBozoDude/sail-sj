```js
const DISCORD_API = "https://discord.com/api/v10";
const DISCORD_GATEWAY = "wss://gateway.discord.gg/?v=10&encoding=json";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        ok: true,
        service: "sail-discord-bot",
      });
    }

    if (url.pathname === "/start" && request.method === "POST") {
      if (
        !env.START_SECRET ||
        request.headers.get("Authorization") !==
          `Bearer ${env.START_SECRET}`
      ) {
        return new Response("Unauthorized", { status: 401 });
      }

      const id = env.DISCORD_GATEWAY.idFromName("main");
      const stub = env.DISCORD_GATEWAY.get(id);

      return stub.fetch("https://discord-gateway/internal/start", {
        method: "POST",
      });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(controller, env, ctx) {
    const id = env.DISCORD_GATEWAY.idFromName("main");
    const stub = env.DISCORD_GATEWAY.get(id);

    ctx.waitUntil(
      stub.fetch("https://discord-gateway/internal/start", {
        method: "POST",
      })
    );
  },
};

export class DiscordGateway {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.socket = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.heartbeatInterval = 45000;
    this.heartbeatAcked = true;
    this.sequence = null;
    this.sessionId = null;
    this.resumeGatewayUrl = null;
    this.connecting = false;
    this.reconnectDelay = 2000;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== "/internal/start") {
      return new Response("Not found", { status: 404 });
    }

    const missing = [
      ...(!this.env.DISCORD_BOT_TOKEN
        ? ["DISCORD_BOT_TOKEN"]
        : []),
      ...(!this.env.SITE_URL ? ["SITE_URL"] : []),
      ...(!this.env.DEV_MESSAGE_BOT_SECRET
        ? ["DEV_MESSAGE_BOT_SECRET"]
        : []),
    ];

    if (missing.length) {
      return Response.json(
        {
          ok: false,
          error: "Missing configuration",
          missing,
        },
        { status: 500 }
      );
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return Response.json({
        ok: true,
        status: "already_connected",
      });
    }

    await this.connect();

    return Response.json({
      ok: true,
      status: "connection_starting",
    });
  }

  async connect() {
    if (this.connecting) return;
    this.connecting = true;

    try {
      const gatewayUrl = this.resumeGatewayUrl || DISCORD_GATEWAY;
      const socket = new WebSocket(gatewayUrl);
      this.socket = socket;

      socket.addEventListener("open", () => {
        this.connecting = false;
      });

      socket.addEventListener("message", (event) => {
        this.handleGatewayMessage(event.data).catch((error) => {
          console.error("Gateway message error:", error);
        });
      });

      socket.addEventListener("error", () => {
        console.error("Discord Gateway WebSocket error");
      });

      socket.addEventListener("close", () => {
        this.connecting = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      });
    } catch (error) {
      this.connecting = false;
      console.error("Discord connection failed:", error);
      this.scheduleReconnect();
    }
  }

  async handleGatewayMessage(rawData) {
    let packet;

    try {
      packet = JSON.parse(rawData);
    } catch {
      return;
    }

    if (packet.s !== undefined && packet.s !== null) {
      this.sequence = packet.s;
    }

    switch (packet.op) {
      case 10: {
        const interval = packet.d?.heartbeat_interval;
        if (interval) {
          this.heartbeatInterval = interval;
        }

        this.startHeartbeat();

        if (this.sessionId && this.sequence !== null) {
          this.send({
            op: 6,
            d: {
              token: this.env.DISCORD_BOT_TOKEN,
              session_id: this.sessionId,
              seq: this.sequence,
            },
          });
        } else {
          this.send({
            op: 2,
            d: {
              token: this.env.DISCORD_BOT_TOKEN,
              intents: 1 | 512 | 32768,
              properties: {
                os: "linux",
                browser: "sail-discord-bot",
                device: "sail-discord-bot",
              },
            },
          });
        }
        break;
      }

      case 11:
        this.heartbeatAcked = true;
        break;

      case 1:
        this.sendHeartbeat();
        break;

      case 7:
        this.scheduleReconnect(1000);
        break;

      case 9:
        this.sessionId = null;
        this.sequence = null;
        this.resumeGatewayUrl = null;
        this.scheduleReconnect(3000);
        break;

      case 0:
        await this.handleDispatch(packet.t, packet.d);
        break;
    }
  }

  async handleDispatch(eventName, data) {
    if (eventName === "READY") {
      this.sessionId = data.session_id;
      this.resumeGatewayUrl = data.resume_gateway_url
        ? `${data.resume_gateway_url}/?v=10&encoding=json`
        : null;

      console.log("Connected to Discord Gateway");
      return;
    }

    if (eventName === "RESUMED") {
      console.log("Discord Gateway session resumed");
      return;
    }

    if (eventName !== "MESSAGE_CREATE") return;

    await this.handleMessageCreate(data);
  }

  async handleMessageCreate(message) {
    if (!message || message.author?.bot) return;

    const content = String(message.content || "");
    const match = content.match(/^@online-users(?:\s+([\s\S]*))?$/i);

    if (!match) return;

    const announcement = (match[1] || "").trim();

    if (!announcement) {
      console.log("Ignoring @online-users message with no announcement");
      return;
    }

    const siteUrl = this.env.SITE_URL.replace(/\/+$/, "");
    const endpoint = `${siteUrl}/api/dev-message`;

    let response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.env.DEV_MESSAGE_BOT_SECRET}`,
        },
        body: JSON.stringify({
          message: announcement,
          content: announcement,
          author: message.author?.username || "Discord",
          discordMessageId: message.id,
          channelId: message.channel_id,
        }),
      });
    } catch (error) {
      console.error("Website notification request failed:", error);
      return;
    }

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      console.error(
        "Website notification rejected:",
        response.status,
        responseText.slice(0, 300)
      );
      return;
    }

    console.log("Website notification sent");

    // Add a checkmark reaction to the Discord message.
    try {
      const reactionUrl =
        `${DISCORD_API}/channels/${message.channel_id}` +
        `/messages/${message.id}/reactions/%E2%9C%85/@me`;

      const reactionResponse = await fetch(reactionUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
        },
      });

      if (!reactionResponse.ok) {
        console.error(
          "Could not react to Discord message:",
          reactionResponse.status
        );
      }
    } catch (error) {
      console.error("Discord reaction failed:", error);
    }
  }

  send(payload) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatAcked = true;

    this.heartbeatTimer = setInterval(() => {
      if (!this.heartbeatAcked) {
        this.socket?.close(4000, "Heartbeat acknowledgement missed");
        return;
      }

      this.heartbeatAcked = false;
      this.sendHeartbeat();
    }, this.heartbeatInterval);
  }

  sendHeartbeat() {
    this.send({
      op: 1,
      d: this.sequence,
    });
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  scheduleReconnect(delay = this.reconnectDelay) {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 60000);
  }
}
```
