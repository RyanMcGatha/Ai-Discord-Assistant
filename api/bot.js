import { Client, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: message.content }],
    });

    const reply = completion.data.choices[0].message.content.trim();
    await message.channel.send(reply);
  } catch (error) {
    console.error("Error fetching completion from OpenAI:", error);
    await message.channel.send(
      "Sorry, something went wrong while processing your request."
    );
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

export default function handler(req, res) {
  res.status(200).json({ status: "Bot is running!" });
}
