// node --experimental-strip-types 🍴💩/index.mts

import { Client, GatewayIntentBits, Events, Partials } from "discord.js";
import { llm } from "./bot.mts";
import path from "path";
import { readFile } from "fs/promises";
import type { Command } from "./types.mts";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages], partials: [Partials.Channel] });


const __dirname = import.meta.dirname;

const types = await readFile(path.resolve(__dirname, './types.mts'), 'utf-8')

client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  if (!message.content) {return}

  console.log(message.content)

  await message.channel.sendTyping()

  let maybeJson = await llm(`\`\`\`typescript\n${types.trim().replace(/^export /gm, '')}\n\`\`\`\n\nFigure out which of the above commands the following message (which may refer to you as <@${client.user?.id}>) is probably referring to, and report it as a JSON value that can be parsed as a value assignable \`Command\`, and nothing else; if none of the commands make sense, explain to the user that you don't understand in plain text (no JSON).\n\n${message.content}`)

  let command: Command
  try {
    maybeJson = maybeJson.replaceAll(/^```\w*/gm, '')
    command = JSON.parse(maybeJson)
  } catch {
    await message.reply({
      content: maybeJson,
      allowedMentions: {repliedUser: false}
    })
    return
  }

  console.log(command)
  await message.reply({content:'thanks.'})

  // // Check if the bot is mentioned
  // if (message.mentions.has(client.user!)) {
  //     console.log(`Bot was mentioned! Message: ${message.content}`);
  //     message.reply("Hello! You mentioned me?");
  // }
});


// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN!);
