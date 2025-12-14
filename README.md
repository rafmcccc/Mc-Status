# Minecraft Server Status Discord Bot

> A Discord bot that displays real-time Minecraft server statistics with automatic updates and customizable status rotation.

[![Bun](https://img.shields.io/badge/Bun-black?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![JavaScript]( https://img.shields.io/badge/logo-javascript-blue?logo=javascript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NodeJS](https://img.shields.io/npm/v/npm.svg?logo=nodedotjs)](https://nodejs.org/en)

## Special Thanks

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [MC Status API](https://api.mcstatus.io/) - Minecraft server status API
- [Bun](https://bun.sh/) - Fast JavaScript runtime
- All contributors and users!

## Features

- 📊 Real-time server status display
- 🔄 Auto-updating stats every 10 seconds
- 🎮 Support for both Java and Bedrock editions
- 📱 Rotating bot status showing different sub-servers
- ⚙️ Easy configuration through environment variables
- 🚀 Lightweight and efficient
- ⚡ Supports both Node.js and Bun

## Prerequisites

Choose one:
- [Node.js](https://nodejs.org/) v16.9.0 or higher
- [Bun](https://bun.sh/) v1.0.0 or higher (faster alternative)

And:
- A Discord Bot Token ([How to get one](https://discord.com/developers/applications))

## Installation

### Using Bun (Recommended - Faster) ⚡

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/mc-status-bot.git
cd mc-status-bot
```

2. **Install dependencies with Bun:**
```bash
bun install
```

3. **Edit `.env` file with your configuration:**
```env
DISCORD_TOKEN=your_discord_bot_token_here
SERVER_IP=play.yourserver.com
BEDROCK_IP=bedrock.yourserver.com
SUB_SERVERS=Survival:🌲,Creative:🎨,SkyBlock:☁️
STATUS_UPDATE_INTERVAL=30000
STATS_UPDATE_INTERVAL=10000
```

4. **Start the bot:**
```bash
bun run bun
# or for development with auto-reload
bun run bun:dev
```

### Using Node.js

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/mc-status-bot.git
cd mc-status-bot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Edit `.env` file (same as above)**

4. **Start the bot:**
```bash
npm start
# or for development
npm run dev
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DISCORD_TOKEN` | Your Discord bot token | - | ✅ Yes |
| `SERVER_IP` | Your Minecraft server IP | `play.example.com` | ✅ Yes |
| `BEDROCK_IP` | Your Bedrock server IP | `bedrock.example.com` | ✅ Yes |
| `SUB_SERVERS` | Sub-servers for status rotation | `One Block:⛏️,Survival:🌲` | ✅ Yes |
| `STATUS_UPDATE_INTERVAL` | Bot status update interval (ms) | `30000` | ❌ No |
| `STATS_UPDATE_INTERVAL` | Stats embed update interval (ms) | `10000` | ❌ No |

### Sub-Servers Format

The `SUB_SERVERS` variable uses the format: `name:emoji,name:emoji`

Example:
```env
SUB_SERVERS=Survival:🌲,Creative:🎨,SkyBlock:☁️,Mini-Games:🎯
```

## Commands

### `/status setup`
- **Description**: Setup server stats display in a channel
- **Permission**: Manage Channels
- **Usage**: `/status setup channel:#your-channel`
- **Note**: Stats will auto-update every 10 seconds

### `/status remove`
- **Description**: Remove server stats display
- **Permission**: Manage Channels
- **Usage**: `/status remove`

### `/status view`
- **Description**: View current server stats (ephemeral message)
- **Permission**: Everyone
- **Usage**: `/status view`

## Bot Permissions

The bot requires the following permissions:
- **Send Messages** - To send status updates
- **Embed Links** - To display formatted stats
- **Read Message History** - To update existing messages
- **Use Application Commands** - To register slash commands

### Bot Invite Link

Replace `YOUR_CLIENT_ID` with your bot's client ID:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=277025770496&scope=bot%20applications.commands
```

## How It Works

1. **Status Rotation**: The bot's status rotates through your configured sub-servers every 30 seconds (configurable)
2. **Auto-Updates**: Stats embeds automatically update every 10 seconds (configurable)
3. **No Manual Refresh**: No buttons needed - everything updates automatically!

## File Structure

```
mc-status-bot/
├── src/
│   ├── commands/
│   │   └── tools/
│   │       └── serverstatus.js
│   ├── components/
│   │   ├── buttons/
│   │   └── selectMenus/
│   ├── data/
│   │   └── stats-channels.json
│   ├── events/
│   │   └── client/
│   │       ├── interactionCreate.js
│   │       └── ready.js
│   ├── functions/
│   │   ├── handlers/
│   │   │   ├── handleCommands.js
│   │   │   ├── handleComponents.js
│   │   │   └── handleEvents.js
│   │   ├── idle.js
│   │   └── statsUpdater.js
│   ├── config.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
├── LICENSE
└── README.md
```

## Running in Production

### Using PM2 with Node.js

1. **Install PM2:**
```bash
npm install -g pm2
```

2. **Start the bot:**
```bash
pm2 start src/index.js --name mc-status-bot
```

3. **Save PM2 configuration:**
```bash
pm2 save
pm2 startup
```

4. **Useful PM2 commands:**
```bash
pm2 status                  # Check bot status
pm2 logs mc-status-bot      # View logs
pm2 restart mc-status-bot   # Restart bot
pm2 stop mc-status-bot      # Stop bot
```

### Using PM2 with Bun

```bash
pm2 start --interpreter bun src/index.js --name mc-status-bot
pm2 save
```

### Using systemd (Linux)

Create a service file at `/etc/systemd/system/mc-status-bot.service`:

**For Node.js:**
```ini
[Unit]
Description=Minecraft Status Discord Bot
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/mc-status-bot
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**For Bun:**
```ini
[Unit]
Description=Minecraft Status Discord Bot
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/mc-status-bot
ExecStart=/usr/bin/bun run src/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mc-status-bot
sudo systemctl start mc-status-bot
sudo systemctl status mc-status-bot
```

## Performance Comparison

| Runtime | Startup Time | Memory Usage | Install Time |
|---------|-------------|--------------|--------------|
| **Bun** | ~50ms | ~40MB | ~2s |
| **Node.js** | ~200ms | ~60MB | ~15s |

💡 **Tip**: Use Bun for faster startup and lower memory usage!

## Troubleshooting

### Bot not responding to commands
1. Make sure the bot has `applications.commands` scope
2. Wait a few minutes for commands to register
3. Try kicking and re-inviting the bot with the correct permissions

### Stats not updating
1. Check if the server IP is correct in `.env`
2. Verify the bot has permissions to edit messages in the channel
3. Check console for any error messages
4. Make sure the channel hasn't been deleted

### High memory usage
- Adjust cache settings in `src/index.js`
- Increase update intervals in `.env` (e.g., 60000ms = 1 minute)
- Consider using Bun instead of Node.js for better performance

### "DISCORD_TOKEN is required" error
- Make sure you've created a `.env` file (copy from `.env.example`)
- Ensure your token is correct and has no extra spaces
- Don't share your token publicly!

### Bun-specific issues
- Make sure you have Bun v1.0.0 or higher: `bun --version`
- Try clearing cache: `rm -rf node_modules && bun install`
- Check Bun compatibility: https://bun.sh/docs

## APIs Used

- [MC Status API](https://api.mcstatus.io/) - For fetching server status
- [MCAPI.us](https://mcapi.us/) - Backup API for status rotation

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/yourusername/mc-status-bot/issues)
- Check the [Troubleshooting](#troubleshooting) section

## Changelog

### v1.0.0
- Initial release
- Auto-updating server stats
- Configurable via environment variables
- Support for multiple sub-servers
- No refresh buttons needed
- Bun runtime support

Made with ❤️ for the Minecraft community

**Star ⭐ this repository if you find it useful!**