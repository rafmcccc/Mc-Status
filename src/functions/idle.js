const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require('../config');

let currentServerIndex = 0;
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; 
let consecutiveZeroPlayerCount = 0;
const ZERO_PLAYER_THRESHOLD = 3; // Consider offline after 3 consecutive 0/0 readings

//Fetch server status with caching
async function fetchServerStatus() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const startTime = Date.now();
    const getData = await fetch(`https://mcapi.us/server/status?ip=${config.SERVER_IP}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    const response = await getData.json();
    const ping = Date.now() - startTime;

    cachedData = { response, ping };
    lastFetchTime = now;
    
    return cachedData;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⚠️ Server status fetch timeout');
    } else {
      console.error('⚠️ Error fetching server status:', error.message);
    }
    return null;
  }
}

//Check if server should be considered offline based on player count
function isServerOfflineByPlayerCount(playersOnline, playersMax) {
  if (!config.AUTO_OFFLINE_ON_ZERO_PLAYERS) {
    return false;
  }
  
  // Check for 0/0 players
  if (playersOnline === 0 && playersMax === 0) {
    consecutiveZeroPlayerCount++;
    
    if (consecutiveZeroPlayerCount >= ZERO_PLAYER_THRESHOLD) {
      if (consecutiveZeroPlayerCount === ZERO_PLAYER_THRESHOLD) {
        console.log(`⚠️ Server detected as offline: ${consecutiveZeroPlayerCount} consecutive 0/0 player readings`);
      }
      return true;
    }
    
    console.log(`⚠️ Zero players detected (${consecutiveZeroPlayerCount}/${ZERO_PLAYER_THRESHOLD})`);
  } else {
    if (consecutiveZeroPlayerCount > 0) {
      console.log(`✅ Server back online with ${playersOnline}/${playersMax} players`);
    }
    consecutiveZeroPlayerCount = 0;
  }
  
  return false;
}

//Update bot presence/idle status
async function updatePresence(client) {
  const data = await fetchServerStatus();
  
  if (!data) {
    consecutiveZeroPlayerCount = 0;
    client.user.setPresence({
      status: "dnd",
      activities: [{ name: "Server Offline 🔴", type: 3 }]
    });
    return;
  }

  const { response, ping } = data;
  const currentSubServer = config.SUB_SERVERS[currentServerIndex];

  if (response.online === true && response.status !== "error") {
    const playersOnline = response.players?.now || response.players?.online || 0;
    const playersMax = response.players?.max || 0;
    
    const isOfflineByPlayerCount = isServerOfflineByPlayerCount(playersOnline, playersMax);
    
    if (isOfflineByPlayerCount) {
      client.user.setPresence({
        status: "dnd",
        activities: [{ name: "Server Offline 🔴 (0/0 Players)", type: 3 }]
      });
    } else {
      const statusText = `${currentSubServer.emoji} ${currentSubServer.name} | ${playersOnline}/${playersMax} Players | ${ping}ms`;

      client.user.setPresence({
        status: "online",
        activities: [{ name: statusText, type: 0 }]
      });
    }
  } else {
    consecutiveZeroPlayerCount = 0;
    client.user.setPresence({
      status: "dnd",
      activities: [{ name: "Server Offline 🔴", type: 3 }]
    });
  }
  currentServerIndex = (currentServerIndex + 1) % config.SUB_SERVERS.length;
}

//Start the status updater
function start(client) {
  let updateInterval;

  updatePresence(client);

  updateInterval = setInterval(() => {
    updatePresence(client);
  }, config.STATUS_UPDATE_INTERVAL);

  console.log(`✅ Status updater started (updates every ${config.STATUS_UPDATE_INTERVAL / 1000}s)`);
  if (config.AUTO_OFFLINE_ON_ZERO_PLAYERS) {
    console.log(`✅ Auto-offline detection enabled (threshold: ${ZERO_PLAYER_THRESHOLD} consecutive 0/0 readings)`);
  }

  // Cleanup function
  return () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      consecutiveZeroPlayerCount = 0;
      console.log('🛑 Status updater stopped');
    }
  };
}

module.exports = { start };