require('dotenv').config();
const fs = require('fs');
const path = require('path');

const TOKEN_HISTORY_PATH = path.join(__dirname, 'data', 'token-history.json');

//Load token history
function loadTokenHistory() {
  try {
    if (!fs.existsSync(path.dirname(TOKEN_HISTORY_PATH))) {
      fs.mkdirSync(path.dirname(TOKEN_HISTORY_PATH), { recursive: true });
    }
    if (fs.existsSync(TOKEN_HISTORY_PATH)) {
      return JSON.parse(fs.readFileSync(TOKEN_HISTORY_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading token history:', error);
  }
  return { tokens: [] };
}

//Save token history
function saveTokenHistory(history) {
  try {
    if (!fs.existsSync(path.dirname(TOKEN_HISTORY_PATH))) {
      fs.mkdirSync(path.dirname(TOKEN_HISTORY_PATH), { recursive: true });
    }
    fs.writeFileSync(TOKEN_HISTORY_PATH, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving token history:', error);
  }
}

//Invalidate previous tokens
function invalidatePreviousTokens(currentToken) {
  const history = loadTokenHistory();
  
  const partialToken = currentToken.substring(0, 20);
  
  const existingToken = history.tokens.find(entry => 
    entry.token === partialToken + '.....'
  );
  
  if (!existingToken) {
    history.tokens.forEach(entry => {
      entry.status = 'invalidated';
      entry.invalidatedAt = new Date().toISOString();
    });
    
    history.tokens.push({
      token: partialToken + '.....', // Store partial for reference
      addedAt: new Date().toISOString(),
      status: 'active'
    });
    
    saveTokenHistory(history);
    console.log('✅ Previous tokens have been invalidated');
    
    if (history.tokens.length > 1) {
      console.log(`📝 ${history.tokens.length - 1} previous token(s) marked as invalid`);
    }
  }
}

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

function validateConfig() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('❌ DISCORD_TOKEN is required in .env file');
  }
  
  // Invalidate previous tokens when new token is loaded
  invalidatePreviousTokens(process.env.DISCORD_TOKEN);
}

validateConfig();

module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,

  SERVER_IP: process.env.SERVER_IP || 'play.example.com',
  BEDROCK_IP: process.env.BEDROCK_IP || 'bedrock.example.com',
  
  SUB_SERVERS: parseSubServers(),

  STATUS_UPDATE_INTERVAL: parseInt(process.env.STATUS_UPDATE_INTERVAL) || 30000, // 30 seconds
  STATS_UPDATE_INTERVAL: parseInt(process.env.STATS_UPDATE_INTERVAL) || 10000,   // 10 seconds
  
  AUTO_OFFLINE_ON_ZERO_PLAYERS: process.env.AUTO_OFFLINE_ON_ZERO_PLAYERS !== 'false', // Default true
};