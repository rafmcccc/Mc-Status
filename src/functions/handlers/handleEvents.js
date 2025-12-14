const path = require("path")
const fs = require("fs")

module.exports = client => {
  client.handleEvents = async () => {
    const eventsPath = path.join(__dirname, "../../events")

    if (!fs.existsSync(eventsPath)) {
      console.warn("No events folder found")
      return
    }

    const eventFolders = fs.readdirSync(eventsPath)

    for (const folder of eventFolders) {
      const folderPath = path.join(eventsPath, folder)
      const eventFiles = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"))

      if (folder === "client") {
        for (const file of eventFiles) {
          const event = require(path.join(folderPath, file))

          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client))
          } else {
            client.on(event.name, (...args) => event.execute(...args, client))
          }
        }
      }
    }
  }
}
