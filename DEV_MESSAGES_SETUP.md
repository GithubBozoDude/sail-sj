# @online-users setup

This feature does not change Sail's existing design. It adds one deferred background script to the five existing theme pages.

## How it works

1. A visitor opens Sail. The background script records when their current browser session started.
2. While they are on the site, it checks `/api/dev-message` every 3 seconds.
3. The Discord bot watches for messages beginning with `@online-users`.
4. The bot sends the rest of the Discord message to `/api/dev-message`.
5. Browsers that were already on the site when the message was sent show a `Message From Dev` popup.
6. A visitor who opens the site after the announcement was sent does not receive that old announcement.

## Required environment variables on the website

Copy the new variables from `sail-sj/.env.example` into your production environment:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `DEV_MESSAGE_BOT_SECRET`

Keep your existing NextAuth and Discord webhook variables.

### Redis

Create an Upstash Redis database and copy its REST URL and REST token. The site uses one Redis key to store only the latest announcement.

### Secret

Set `DEV_MESSAGE_BOT_SECRET` to a long random string. Use the exact same value in the Discord bot's environment.

## Discord bot

The `discord-bot` directory is a Cloudflare Worker. Deploy that directory as its own Cloudflare Worker project. It uses a Durable Object to keep the Discord Gateway connection alive.

Required Cloudflare secrets/variables:

- `DISCORD_BOT_TOKEN` — your Discord bot token
- `SITE_URL` — your production website URL
- `DEV_MESSAGE_BOT_SECRET` — exactly the same secret configured on the Vercel website
- `START_SECRET` — a separate random secret used to start the gateway connection

In the Discord Developer Portal, enable the **Message Content Intent**. The bot needs permission to view channels, read message history, and add reactions.

After deploying the Worker, start the gateway connection once by sending a POST request to:

```text
https://YOUR-WORKER.workers.dev/start
```

with this header:

```text
Authorization: Bearer YOUR_START_SECRET
```

You can test the Worker with `/health`.

## Example

Discord:

```text
@online-users site might be down for a few hours
```

Existing visitors see:

```text
Message From Dev

site might be down for a few hours

                         OK
```

The existing Sail pages, theme styles, Scramjet code, and navigation are not otherwise changed.
