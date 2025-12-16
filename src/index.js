const config = require("./config");
const path = require("path");
const fs = require("fs");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const idle = require("./functions/idle");
const statsUpdater = require("./functions/statsUpdater");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  
  // Optimize caching 
  sweepers: {
    messages: {
      interval: 300, 
      lifetime: 180  
    },
    users: {
      interval: 3600, 
      filter: () => user => user.bot && user.id !== client.user.id
    }
  },
  makeCache: require('discord.js').Options.cacheWithLimits({
    MessageManager: 50, 
    PresenceManager: 0, 
  })
});

client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.commandArray = [];

// Load handler 
const handlersPath = path.join(__dirname, "functions", "handlers");
if (fs.existsSync(handlersPath)) {
  fs.readdirSync(handlersPath)
    .filter(f => f.endsWith(".js"))
    .forEach(f => {
      console.log(`📦 Loading handler: ${f}`);
      require(path.join(handlersPath, f))(client);
    });
}

console.log("🔐 Logging in...");

// Ready
client.once("ready", async () => {
  console.log(`\n✅ Logged in as ${client.user.tag}`);
  console.log(`🌐 Bot is in ${client.guilds.cache.size} guild(s)`);
  console.log(`📊 Configured server: ${config.SERVER_IP}`);
  console.log(`🎮 Bedrock server: ${config.BEDROCK_IP}\n`);

  if (client.handleEvents) {
    console.log("📡 Loading events...");
    await client.handleEvents();
  }

  if (client.handleComponents) {
    console.log("🔘 Loading components...");
    await client.handleComponents();
  }

  // Load and register commands
  if (client.handleCommands) {
    console.log("⚙️ Loading and registering commands...");
    try {
      await client.handleCommands();
      console.log("✅ Commands registered successfully!\n");
    } catch (error) {
      console.error("❌ Error registering commands:", error);
    }
  }

  console.log("🚀 Starting background services...");
  statsUpdater.start(client);
  idle.start(client);
  
  console.log("\n🎉 Bot is fully operational!\n");
});

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
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Login
client.login(config.DISCORD_TOKEN).catch(error => {
  console.error('❌ Failed to login:', error.message);
  process.exit(1);
});
