const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const CONFIG_PATH = path.join(__dirname, '../data/stats-channels.json');
const UPDATE_INTERVAL = 10 * 1000;
const ALLOWED_IP = 'monyxmc.net';
const BEDROCK_IP = 'mc.monyxmc.net';

let config = {};
let lastConfigLoad = 0;
const CONFIG_CACHE_DURATION = 60000;

// Load config with caching
function loadConfig() {
  const now = Date.now();
  if (config && Object.keys(config).length > 0 && (now - lastConfigLoad) < CONFIG_CACHE_DURATION) {
    return config;
  }

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      lastConfigLoad = now;
      return config;
    }
  } catch (error) {
    console.error('Error loading stats config:', error.message);
  }
  return {};
}

// Create stats embed
async function createStatsEmbed(ip, serverData) {
  if (!serverData || serverData.online !== true) {
    return new EmbedBuilder()
      .setColor("#FF6B6B")
      .setDescription(
        `❌ Server offline\n\nJava IP \`${ip}\`\nBedrock IP \`${BEDROCK_IP}\``
      );
  }

  const playersOnline = serverData.players?.online || 0;
  const playersMax = serverData.players?.max || 0;
  const version = serverData.version?.name_clean || serverData.version?.name_raw || 'Unknown';

  return new EmbedBuilder()
    .setColor("#b6cdff")
    .setTitle('MonyxMC Server Stats')
    .setDescription('Auto updates every 10 seconds')
    .addFields(
      { name: 'Status', value: 'Online', inline: true },
      { name: 'Players', value: `${playersOnline}/${playersMax}`, inline: true },
      { name: 'Ping', value: `${serverData.ping}ms`, inline: true },
      { name: 'Version', value: version, inline: true },
      { name: 'Java IP', value: `\`${ip}\``, inline: true },
      { name: 'Bedrock IP', value: `\`${BEDROCK_IP}\``, inline: true }
    )
    .setFooter({ text: 'Last updated' })
    .setTimestamp();
}

// Fetch server data with more accurate ping logic
async function fetchServerData(ip) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const startTime = process.hrtime.bigint();

    const req = await fetch(`https://api.mcstatus.io/v2/status/java/${ip}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MonyxMC-Discord-Bot/1.0' }
    });

    clearTimeout(timeout);

    if (!req.ok) {
      return { online: false };
    }

    const json = await req.json();
    const endTime = process.hrtime.bigint();

    const ping = Number(endTime - startTime) / 1e6;

    return { ...json, ping: Math.floor(ping), online: true };
  } catch (error) {
    return { online: false };
  }
}


// Update all messages
async function updateStatsMessages(client) {
  const cfg = loadConfig();
  if (Object.keys(cfg).length === 0) return;

  const serverData = await fetchServerData(ALLOWED_IP);

  const updatePromises = Object.entries(cfg).map(async ([guildId, guildConfig]) => {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      const channel = guild.channels.cache.get(guildConfig.channelId);
      if (!channel) return;

      const message = await channel.messages.fetch(guildConfig.messageId, { force: true }).catch(() => null);
      if (!message) return;

      const embed = await createStatsEmbed(ALLOWED_IP, serverData);

      await message.edit({
        embeds: [embed],
        components: [] // refresh button removed
      });

    } catch (error) {
      if (error.code !== 10008) {
        console.error(`Error updating stats for guild ${guildId}:`, error.message);
      }
    }
  });

  await Promise.allSettled(updatePromises);
}

// Start updater
function start(client) {
  console.log('Stats updater started');

  setTimeout(() => {
    updateStatsMessages(client);
  }, 10000);

  const interval = setInterval(() => {
    updateStatsMessages(client);
  }, UPDATE_INTERVAL);

  return () => clearInterval(interval);
}

module.exports = { start, updateStatsMessages, fetchServerData, createStatsEmbed };