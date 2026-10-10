```js
const { Client, GatewayIntentBits } = require("discord.js");

const required = [
  "DISCORD_BOT_TOKEN",
  "SITE_URL",
  "DEV_MESSAGE_BOT_SECRET",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error("Missing environment variables:", missing.join(", "));
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const siteUrl = process.env.SITE_URL.replace(/\/+$/, "");

client.once("ready", () => {
  console.log(`Discord bot connected as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const match = message.content.match(
    /^@online-users(?:\s+([\s\S]*))?$/i
  );

  if (!match) return;

  const announcement = (match[1] || "").trim();

  if (!announcement) {
    console.log("Ignoring announcement with no message text.");
    return;
  }

  try {
    const response = await fetch(`${siteUrl}/api/dev-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEV_MESSAGE_BOT_SECRET}`,
      },
      body: JSON.stringify({
        message: announcement,
        content: announcement,
        author: message.author.username,
        discordMessageId: message.id,
        channelId: message.channelId,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(
        `Website API returned ${response.status}:`,
        details.slice(0, 300)
      );
      return;
    }

    await message.react("✅");
    console.log("Announcement sent to website.");
  } catch (error) {
    console.error("Failed to send website announcement:", error);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
```
