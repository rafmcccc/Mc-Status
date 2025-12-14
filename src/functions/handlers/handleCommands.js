const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.handleCommands = async () => {
    const basePath = path.join(__dirname, "..", "..", "commands")
    const commandFolders = fs.readdirSync(basePath);

    // Clear existing commands to prevent duplicates
    client.commands.clear();
    client.commandArray = [];

    console.log("\n📝 Loading commands...");

    for (const folder of commandFolders) {
      const folderPath = path.join(basePath, folder);
      
      if (!fs.statSync(folderPath).isDirectory()) continue;
      
      const commandFiles = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        try {
          const filePath = path.join(folderPath, file);
          
          // Clear require cache to avoid stale data
          delete require.cache[require.resolve(filePath)];
          
          const command = require(filePath);

          if (!command.data || !command.data.name) {
            console.warn(`⚠️ Skipping ${file}: Missing data or name property`);
            continue;
          }

          if (!client.commands.has(command.data.name)) {
            client.commands.set(command.data.name, command);
            client.commandArray.push(command.data.toJSON());
            console.log(`  ✓ Loaded: ${command.data.name}`);
          }
        } catch (error) {
          console.error(`❌ Error loading ${file}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Loaded ${client.commandArray.length} commands total`);

    const clientId = client.user.id;
    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

    try {
      console.log("\n🔄 Registering commands to guilds...");

      // Get all guilds
      const guilds = Array.from(client.guilds.cache.values());
      console.log(`Found ${guilds.length} guild(s)`);

      let successCount = 0;
      let failCount = 0;

      // Register to each guild one by one with progress
      for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i];
        
        try {
          console.log(`  [${i + 1}/${guilds.length}] Registering to: ${guild.name}...`);
          
          await rest.put(
            Routes.applicationGuildCommands(clientId, guild.id),
            { body: client.commandArray }
          );
          
          successCount++;
          console.log(`  ✓ Success: ${guild.name}`);
        } catch (error) {
          failCount++;
          console.error(`  ✗ Failed: ${guild.name} - ${error.message}`);
        }
      }

      console.log(`\n✅ Registration complete: ${successCount} successful, ${failCount} failed`);

    } catch (error) {
      console.error("\n❌ Fatal error during command registration:", error.message);
      throw error;
    }
  };
};