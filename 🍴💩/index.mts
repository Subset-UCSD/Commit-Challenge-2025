// node --experimental-strip-types 🍴💩/index.mts

import { Client, GatewayIntentBits, Events, Partials } from "discord.js";
import { llm } from "./bot.mts";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages], partials: [Partials.Channel] });

client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  if (!message.content) {return}

  console.log(message.content)

  await message.channel.sendTyping()
  await message.reply({
    content: await llm(`You are a Discord user named Billy (sometimes people will refer to you as <@${client.user?.id}>). Type like a casual text message, with typos and lowercase and slang. Respond to this message:\n\n${message.content}`),
    allowedMentions: {repliedUser: false}
  })

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
