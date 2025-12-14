require('dotenv').config();

//Parse sub-servers from environment variable
function parseSubServers() {
  const defaultServers = [
    { name: 'One Block', emoji: '⛏️' },
    { name: 'Survival', emoji: '🌲' }
  ];

  const subServersEnv = process.env.SUB_SERVERS;
  
  if (!subServersEnv) {
    console.log('⚠️ SUB_SERVERS not set, using defaults');
    return defaultServers;
  }

  try {
    const servers = subServersEnv.split(',').map(server => {
      const [name, emoji] = server.split(':');
      if (!name || !emoji) {
        throw new Error(`Invalid format: ${server}`);
      }
      return { 
        name: name.trim(), 
        emoji: emoji.trim() 
      };
    });
    
    if (servers.length === 0) {
      console.log('⚠️ No valid servers found, using defaults');
      return defaultServers;
    }
    
    console.log(`✅ Loaded ${servers.length} sub-servers:`, servers.map(s => s.name).join(', '));
    return servers;
  } catch (error) {
    console.warn('⚠️ Error parsing SUB_SERVERS, using defaults:', error.message);
    return defaultServers;
  }
}

//Validate required environment variables
function validateConfig() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('❌ DISCORD_TOKEN is required in .env file');
  }
}

// Validate config on load
validateConfig();

module.exports = {
  // Discord Configuration
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,

  // Server Configuration
  SERVER_IP: process.env.SERVER_IP || 'play.example.com',
  BEDROCK_IP: process.env.BEDROCK_IP || 'bedrock.example.com',
  
  // Sub-servers for status rotation
  SUB_SERVERS: parseSubServers(),

  // Update Intervals (in milliseconds)
  STATUS_UPDATE_INTERVAL: parseInt(process.env.STATUS_UPDATE_INTERVAL) || 30000, // 30 seconds
  STATS_UPDATE_INTERVAL: parseInt(process.env.STATS_UPDATE_INTERVAL) || 10000,   // 10 seconds
};