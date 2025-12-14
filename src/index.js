require("dotenv").config()
const path = require("path")
const fs = require("fs")
const { Client, GatewayIntentBits, Collection } = require("discord.js")
const idle = require("./functions/idle")
const statsUpdater = require("./functions/statsUpdater")

const { DISCORD_TOKEN } = process.env

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  // Optimize caching - reduce memory usage
  sweepers: {
    messages: {
      interval: 300, // Sweep every 5 minutes
      lifetime: 180  // Delete messages older than 3 minutes
    },
    users: {
      interval: 3600, // Sweep every hour
      filter: () => user => user.bot && user.id !== client.user.id // Keep only non-bot users
    }
  },
  // Reduce cache sizes
  makeCache: require('discord.js').Options.cacheWithLimits({
    MessageManager: 50, // Keep last 50 messages per channel
    PresenceManager: 0, // Don't cache presences (we only need counts)
  })
})

client.commands = new Collection()
client.buttons = new Collection()
client.selectMenus = new Collection()
client.commandArray = []

// Load handler FUNCTIONS only (before login)
const handlersPath = path.join(__dirname, "functions", "handlers")
if (fs.existsSync(handlersPath)) {
  fs.readdirSync(handlersPath)
    .filter(f => f.endsWith(".js"))
    .forEach(f => {
      console.log(`Loading handler: ${f}`)
      require(path.join(handlersPath, f))(client)
    })
}

console.log("Logging in...")

// Using "ready" event (fires once when bot is ready)
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`)
  console.log(`Bot is in ${client.guilds.cache.size} guilds`)

  // Load events first (must be loaded before commands)
  if (client.handleEvents) {
    console.log("Loading events...")
    await client.handleEvents()
  }

  // Load components
  if (client.handleComponents) {
    console.log("Loading components...")
    await client.handleComponents()
  }

  // Load and register commands (this is what gets stuck)
  if (client.handleCommands) {
    console.log("Loading and registering commands...")
    try {
      await client.handleCommands()
      console.log("✅ Commands registered successfully!")
    } catch (error) {
      console.error("❌ Error registering commands:", error)
    }
  }

  // Start other services after everything is loaded
  console.log("Starting background services...")
  statsUpdater.start(client)
  idle.start(client)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.login(DISCORD_TOKEN)