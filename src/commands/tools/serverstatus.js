const { SlashCommandBuilder, ButtonBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ComponentType, MessageFlags, PermissionFlagsBits, ChannelType } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

const ALLOWED_IP = 'monyxmc.net';
const CONFIG_PATH = path.join(__dirname, '../../data/stats-channels.json');

// Load config
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

// Save config
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving stats config:', error);
  }
}

// Function to calculate real-time ping
async function getPing(ip) {
  const startTime = Date.now();
  try {
    await fetch(`https://mcapi.us/server/status?ip=${ip}`);
    return Date.now() - startTime;
  } catch (error) {
    return 'N/A';
  }
}

// Create stats embed
async function createStatsEmbed(ip) {
  const startTime = Date.now();
  const getData = await fetch(`https://mcapi.us/server/status?ip=${ip}`);
  const ping = Date.now() - startTime;
  const response = await getData.json();

  if (response.status === "error" || response.online === false) {
    return {
      embed: new EmbedBuilder()
        .setColor("#FF6B6B")
        .setDescription(`❌ **Server is currently offline**\n\n🌐 **IP:** ${ip}`),
      isOnline: false
    };
  }

  const playersOnline = response.players?.now || response.players?.online || 0;
  const playersMax = response.players?.max || 0;
  
  return {
    embed: new EmbedBuilder()
      .setColor("#b6cdff")
      .setTitle('📊 MonyxMC Server Stats')
      .addFields(
      { name: '🟢 Status', value: 'Online', inline: true },
      { name: '👥 Players', value: `${playersOnline}/${playersMax}`, inline: true },
      { name: '⏱️ Ping', value: `${ping}ms`, inline: true },
      { name: '🎮 Bedrock IP', value: `\`mc.monyxmc.net\``, inline: true },
      { name: '🌐 Server IP', value: `\`${ip}\``, inline: false }
      )
      .setFooter({ text: 'Last updated' })
      .setTimestamp(),
    isOnline: true
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Manage MonyxMC Server Stats display")
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
    
    if (subcommand === 'setup') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const channel = interaction.options.getChannel("channel");
      const config = loadConfig();
      
      // Check if already setup
      if (config[interaction.guild.id]) {
        return interaction.editReply({
          content: "⚠️ Server stats are already setup! Use `/stats remove` first to reset."
        });
      }
      
      try {
        const ip = ALLOWED_IP;
        
        // Create initial stats embed
        const { embed, isOnline } = await createStatsEmbed(ip);
        
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel('Refresh')
              .setStyle(ButtonStyle.Primary)
              .setCustomId('refreshStats')
              .setEmoji('🔄')
          );
        
        // Send the stats message to the chosen channel
        const message = await channel.send({ 
          embeds: [embed], 
          components: [row]
        });
        
        // Save config
        config[interaction.guild.id] = {
          channelId: channel.id,
          messageId: message.id
        };
        saveConfig(config);
        
        const successEmbed = new EmbedBuilder()
          .setColor("#4CAF50")
          .setTitle("✅ Server Stats Setup Complete!")
          .setDescription("Stats message has been sent and will be interactive.")
          .addFields(
            { name: "Channel", value: `<#${channel.id}>`, inline: true },
            { name: "Server", value: ALLOWED_IP, inline: true }
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
    
    else if (subcommand === 'remove') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const config = loadConfig();
      const guildConfig = config[interaction.guild.id];
      
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
        delete config[interaction.guild.id];
        saveConfig(config);
        
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
    
    else if (subcommand === 'view') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const ip = ALLOWED_IP;
      
      try {
        const { embed, isOnline } = await createStatsEmbed(ip);
        
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel('Refresh')
              .setStyle(ButtonStyle.Primary)
              .setCustomId('refreshStats_view')
              .setEmoji('🔄')
          );
        
        await interaction.editReply({ 
          embeds: [embed], 
          components: [row]
        });
        
        const reply = await interaction.fetchReply();
        
        const collector = reply.createMessageComponentCollector({ 
          componentType: ComponentType.Button, 
          time: 300000 // 5 minutes
        });
        
        collector.on('collect', async i => {
          if (i.customId === 'refreshStats_view') {
            const { embed: updatedEmbed } = await createStatsEmbed(ip);
            
            await i.update({
              embeds: [updatedEmbed],
              components: [row]
            });
          }
        });

        collector.on('end', async () => {
          try {
            const disabledRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Refresh')
                  .setStyle(ButtonStyle.Primary)
                  .setCustomId('refreshStats_view')
                  .setEmoji('🔄')
                  .setDisabled(true)
              );
            
            await interaction.editReply({ components: [disabledRow] });
          } catch (error) {
            // Ignore if message was deleted
          }
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