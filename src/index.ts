import "dotenv/config";
import axios from "axios";
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Interaction,
  FileUploadBuilder,
  LabelBuilder,
  EmbedBuilder,
  Channel,
  TextChannel,
  AttachmentBuilder,
} from "discord.js";
import { generatePointsGraph } from "./graph";
import express from "express";

const {
  DISCORD_TOKEN,
  API_URL_TEMPLATE,
  STATS_URL_TEMPLATE,
  API_METHOD,
  CHANNEL_ID = "GET",
  ROLE_MAPPINGS_JSON,
} = process.env;

// Validate required env variables
if (!DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in environment");
  process.exit(1);
}
if (!API_URL_TEMPLATE) {
  console.error(
    "Missing API_URL_TEMPLATE in environment (e.g. https://api.example.com/user?username={username})"
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// Fetch THE FINALS stats for a given username
async function fetchStatsForUsername(username: string) {
  const url = STATS_URL_TEMPLATE;
  if (!url) {
    throw new Error("STATS_URL_TEMPLATE is not defined in environment");
  }
  const body = {
    meta: {
      id: username,
      range: 604800, // Hardcoded to finals api date range
      time: "Asia/Kolkata",
    },
  };
  const res = await axios.post(STATS_URL_TEMPLATE, body);
  return res.data;
}

// Fetch THE FINALS data for a given username
async function fetchApiForUsername(username: string) {
  const url = API_URL_TEMPLATE?.replace(
    "{username}",
    encodeURIComponent(username)
  );
  const method = (API_METHOD || "GET").toUpperCase();
  const res = await axios.request({ url, method });
  return res.data;
}

// Ensure role exists in guild
async function ensureRole(guild: any, roleName: string) {
  const ROLE_MAP: RoleMap = JSON.parse(ROLE_MAPPINGS_JSON ?? "{}");
  const roleId = ROLE_MAP[roleName];
  return guild.roles.fetch(roleId);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

// Handle interactions
client.on("interactionCreate", async (interaction: Interaction) => {
  // When /rank is run, fetch stats and generate graph
  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "rankscore"
  ) {
    try {
      await interaction.deferReply();
      const username = interaction.options.getString("username", true);
      const rankData = await fetchStatsForUsername(username);

      if (!rankData || !rankData.history || rankData.history.length === 0) {
        await interaction.editReply({
          content: `No rank history found for username '${username}'. Please ensure the username is correct.`,
        });
        return;
      }

      const buffer = await generatePointsGraph(
        rankData?.history || [],
        rankData?.stats
      );

      const attachment = new AttachmentBuilder(buffer, {
        name: "points-graph.png",
      });

      await interaction.editReply({
        content: `Here is the rank progression for ${username} 📈`,
        files: [attachment],
      });
    } catch (err: any) {
      console.error(err.response.data);
      await interaction.editReply({
        content: `${err.response.data.message || String(err)}`,
      });
    }
  }

  // When /assign is run, send a message with a button that opens a modal with a text box
  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "assign"
  ) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("open_username_modal")
        .setLabel("Enter Embark ID")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: `Click the button to get your rank roles based on your Embark ID.`,
      components: [row],
      ephemeral: false,
    });
    return;
  }

  // Button click: show a modal containing a single text input
  if (
    interaction.isButton() &&
    interaction.customId === "open_username_modal"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("assign_modal")
      .setTitle("Rank Details Submission");

    const rankInput = new TextInputBuilder()
      .setCustomId("username_input")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setMinLength(6)
      .setRequired(true);
    const rankInputLabel = new LabelBuilder()
      .setLabel("Embark ID")
      .setDescription("Enter your Embark ID associated with THE FINALS account")
      .setTextInputComponent(rankInput);

    const rankSSUpload = new FileUploadBuilder().setCustomId("picture");
    const rankSSFileLabel = new LabelBuilder()
      .setLabel("Screenshot of profile page showing your rank")
      .setDescription(
        "Open THE FINALS > Click on Icon showing your level > Take SS with stats and your rank > Upload here"
      )
      .setFileUploadComponent(rankSSUpload);

    modal
      .addLabelComponents(rankInputLabel)
      .addLabelComponents(rankSSFileLabel);

    await interaction.showModal(modal);
    return;
  }

  // Handle modal submit (assign_modal)
  if (interaction.isModalSubmit() && interaction.customId === "assign_modal") {
    await interaction.deferReply({ ephemeral: true });
    const channel = (await client.channels.fetch(CHANNEL_ID)) as TextChannel;
    const username = interaction.fields.getTextInputValue("username_input");
    const rankPicFiles = interaction.fields.getUploadedFiles("picture");
    const rankPic = rankPicFiles?.first()?.url || null;

    try {
      const { data } = await fetchApiForUsername(username);
      let roleName: string | undefined;
      let rankPoints: number | undefined;
      if (
        data != null &&
        data.length > 0 &&
        data[0].name.toLowerCase() === username.toLowerCase()
      ) {
        const dataRoleName = data[0].league;
        rankPoints = data[0].rankScore;
        if (dataRoleName == "Ruby") {
          roleName = dataRoleName.toUpperCase();
        } else {
          roleName = dataRoleName
            ? dataRoleName.slice(0, dataRoleName.length - 2).toUpperCase()
            : undefined;
        }
      } else {
        await interaction.editReply({
          content:
            "Could not determine role from the Finals Leaderboard. Please check the username and try again. \n NOTE: Only top 10000 players are listed on the Finals Leaderboard.",
        });
        return;
      }

      const guild = interaction.guild;
      const member = await guild?.members.fetch(interaction.user.id);

      const targetRole = await ensureRole(guild, roleName as string);
      if (!targetRole) {
        await interaction.editReply({
          content: `Role '${roleName}' not found in this guild.`,
        });
        return;
      }

      const me = await guild?.members.fetchMe();
      if (!me) {
        await interaction.editReply({
          content: `Could not fetch the bot user in this guild.`,
        });
        return;
      }

      if (me.roles.highest.position <= targetRole.position) {
        await interaction.editReply({
          content: `Cannot assign role '${roleName}' because it's equal/above the bot's highest role. Move the bot's role higher in server settings.`,
        });
        return;
      }

      await member?.roles.add(
        targetRole,
        `Assigned by bot for username ${username}`
      );
      await interaction.editReply({
        content: `Assigned role '${roleName}' to ${member?.user.tag}.`,
      });

      const txtReply = `User ${interaction.user} (${interaction.user.tag}) assigned to themselves the role '${roleName}' for Embark ID '${username}' with ${rankPoints} RS.`;

      const modMsgEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Rank Submission Received")
        .setAuthor({
          name: "TFI Rank Bot",
          iconURL:
            "https://github.com/nikelbane/THE-FINALS-RankBot/blob/master/src/TFI.png?raw=true",
        })
        .setDescription(txtReply)
        .setImage(rankPic)
        .setTimestamp();

      await channel.send({ embeds: [modMsgEmbed] });
    } catch (err: any) {
      console.error(err);
      await interaction.editReply({
        content: `Error: ${err.message || String(err)}`,
      });
    }
  }
});

// Simple web server to keep the bot alive
const app = express();
const port = process.env.PORT || 10000; // Use the PORT environment variable

app.get("/", (req, res) => {
  res.send("Discord bot is alive!");
});

app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});

client.login(DISCORD_TOKEN);
