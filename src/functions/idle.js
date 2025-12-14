const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require('../config');

let currentServerIndex = 0;
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Fetch server status with caching
 */
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

/**
 * Update bot presence/status
 */
async function updatePresence(client) {
  const data = await fetchServerStatus();
  
  if (!data) {
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

    const statusText = `${currentSubServer.emoji} ${currentSubServer.name} | ${playersOnline}/${playersMax} Players | ${ping}ms`;

    client.user.setPresence({
      status: "online",
      activities: [{ name: statusText, type: 0 }]
    });
  } else {
    client.user.setPresence({
      status: "dnd",
      activities: [{ name: "Server Offline 🔴", type: 3 }]
    });
  }

  // Rotate to next sub-server
  currentServerIndex = (currentServerIndex + 1) % config.SUB_SERVERS.length;
}

/**
 * Start the status updater
 */
function start(client) {
  let updateInterval;

  // Initial update
  updatePresence(client);

  // Set up interval
  updateInterval = setInterval(() => {
    updatePresence(client);
  }, config.STATUS_UPDATE_INTERVAL);

  console.log(`✅ Status updater started (updates every ${config.STATUS_UPDATE_INTERVAL / 1000}s)`);

  // Cleanup function
  return () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      console.log('🛑 Status updater stopped');
    }
  };
}

module.exports = { start };