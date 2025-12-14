const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.handleComponents = async () => {
    const componentsPath = path.join(__dirname, "../../components");

    // ✅ Check folder exists
    if (!fs.existsSync(componentsPath)) {
      console.warn("⚠️ No components folder found at:", componentsPath);
      return;
    }

    const componentFolders = fs.readdirSync(componentsPath);

    for (const folder of componentFolders) {
      const folderPath = path.join(componentsPath, folder);

      // ✅ Skip invalid folders
      if (!fs.existsSync(folderPath)) continue;

      const componentFiles = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith(".js"));

      const { buttons, selectMenus } = client;

      switch (folder) {
        case "buttons":
          for (const file of componentFiles) {
            const button = require(path.join(folderPath, file));
            if (button?.data?.name) {
              buttons.set(button.data.name, button);
            }
          }
          break;

        case "selectMenus":
          for (const file of componentFiles) {
            const menu = require(path.join(folderPath, file));
            if (menu?.data?.name) {
              selectMenus.set(menu.data.name, menu);
            }
          }
          break;

        default:
          break;
      }
    }
  };
};
