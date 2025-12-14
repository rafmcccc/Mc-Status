const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');
const { fetchServerData, createStatsEmbed } = require('../../functions/statsUpdater');

const CONFIG_PATH = path.join(__dirname, '../../data/stats-channels.json');

/**
 * Load stats configuration
 */
function loadConfig() {
  try {
    if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
      fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    }
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading stats config:', error);
  }
  return {};
}

/**
 * Save stats configuration
 */
function saveConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  } catch (error) {
    console.error('Error saving stats config:', error);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Manage Server Stats display")
    .addSubcommand(subcommand =>
      subcommand
        .setName("setup")
        .setDescription("Setup server stats in a channel")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("The channel to send stats to")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Remove server stats display")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("view")
        .setDescription("View current server stats (ephemeral)")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    // SETUP SUBCOMMAND
    if (subcommand === 'setup') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const channel = interaction.options.getChannel("channel");
      const cfg = loadConfig();
      
      // Check if already setup
      if (cfg[interaction.guild.id]) {
        return interaction.editReply({
          content: "⚠️ Server stats are already setup! Use `/status remove` first to reset."
        });
      }
      
      try {
        const ip = config.SERVER_IP;
        
        // Fetch server data and create initial embed
        const serverData = await fetchServerData(ip);
        const embed = await createStatsEmbed(ip, serverData);
        
        // Send the stats message (no buttons/components)
        const message = await channel.send({ 
          embeds: [embed]
        });
        
        // Save config
        cfg[interaction.guild.id] = {
          channelId: channel.id,
          messageId: message.id
        };
        saveConfig(cfg);
        
        const successEmbed = new EmbedBuilder()
          .setColor("#4CAF50")
          .setTitle("✅ Server Stats Setup Complete!")
          .setDescription(`Stats message will auto-update every ${config.STATS_UPDATE_INTERVAL / 1000} seconds.`)
          .addFields(
            { name: "📍 Channel", value: `<#${channel.id}>`, inline: true },
            { name: "🌐 Server", value: config.SERVER_IP, inline: true }
          )
          .setTimestamp();
        
        await interaction.editReply({ embeds: [successEmbed] });
        
      } catch (error) {
        console.error('Error setting up server stats:', error);
        await interaction.editReply({
          content: "❌ An error occurred while setting up server stats. Make sure I have proper permissions!"
        });
      }
    }
    
    // REMOVE SUBCOMMAND
    else if (subcommand === 'remove') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const cfg = loadConfig();
      const guildConfig = cfg[interaction.guild.id];
      
      if (!guildConfig) {
        return interaction.editReply({
          content: "❌ Server stats are not setup in this server!"
        });
      }
      
      try {
        // Try to delete the message
        try {
          const channel = await interaction.guild.channels.fetch(guildConfig.channelId);
          if (channel) {
            const message = await channel.messages.fetch(guildConfig.messageId);
            if (message) await message.delete();
          }
        } catch (error) {
          // Message might already be deleted
        }
        
        // Remove from config
        delete cfg[interaction.guild.id];
        saveConfig(cfg);
        
        const embed = new EmbedBuilder()
          .setColor("#FF6B6B")
          .setTitle("✅ Server Stats Removed")
          .setDescription("The server stats display has been removed.")
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } catch (error) {
        console.error('Error removing server stats:', error);
        await interaction.editReply({
          content: "❌ An error occurred while removing server stats."
        });
      }
    }
    
    // VIEW SUBCOMMAND
    else if (subcommand === 'view') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const ip = config.SERVER_IP;
      
      try {
        const serverData = await fetchServerData(ip);
        const embed = await createStatsEmbed(ip, serverData);
        
        await interaction.editReply({ 
          embeds: [embed]
        });
        
      } catch (error) {
        console.error('Error viewing server stats:', error);
        await interaction.editReply({ 
          content: '❌ An error occurred while fetching server stats.'
        });
      }
    }
  }
};