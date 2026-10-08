# Sail Discord Bot — Cloudflare Worker

This is the Cloudflare Worker version of the Sail `@online-users` bot. The website itself is unchanged.

## Cloudflare settings

Create/deploy this folder as a Cloudflare Worker. The Worker entry point is `src/index.js` and the Durable Object is `DiscordGateway`.

Required Worker secrets/variables:

- `DISCORD_BOT_TOKEN` — Discord bot token (secret)
- `SITE_URL` — your production website URL, e.g. `https://example.com`
- `DEV_MESSAGE_BOT_SECRET` — same secret used by the Vercel website API (secret)
- `START_SECRET` — a separate random secret used only to authorize `/start` (secret)

## Discord requirements

In the Discord Developer Portal, enable **Message Content Intent** under Bot → Privileged Gateway Intents.

The bot needs permission to view channels, read message history, and add reactions. If you do not want the bot reacting with ✅, the reaction permission can be omitted.

## Starting the gateway connection

After deployment, call the Worker `/start` endpoint once with:

```text
Authorization: Bearer YOUR_START_SECRET
```

For example:

```bash
curl -X POST https://YOUR-WORKER.workers.dev/start \
  -H 'Authorization: Bearer YOUR_START_SECRET'
```

`/health` can be used to check that the Worker is deployed.

## Message format

In Discord:

```text
@online-users site might be down for a few hours
```

The Worker forwards the message to the site's `/api/dev-message` endpoint, and current website visitors receive the existing `Message From Dev` popup.
