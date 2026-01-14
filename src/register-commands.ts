import "dotenv/config";
import { REST, Routes } from "discord.js";

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error(
    "Please set DISCORD_TOKEN, CLIENT_ID and GUILD_ID in your environment before running this script."
  );
  process.exit(1);
}

const commands = [
  {
    name: "assign",
    description: "Assign a role to the invoking user based on ID",
  },
  {
    name: "rankscore",
    description: "Get The Finals ranked points graph for a username",
    options: [
      {
        name: "username",
        description: "The Finals username to fetch the ranked points graph for",
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering guild commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("Commands registered to guild.");
  } catch (err) {
    console.error("Error registering commands", err);
  }
})();
