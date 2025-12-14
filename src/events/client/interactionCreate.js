module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // Fast exit for non-command interactions
    if (!interaction.isChatInputCommand() && 
        !interaction.isButton() && 
        !interaction.isStringSelectMenu() &&
        !interaction.isUserSelectMenu() &&
        !interaction.isRoleSelectMenu() &&
        !interaction.isMentionableSelectMenu() &&
        !interaction.isContextMenuCommand()) {
      return;
    }

    try {
      // Slash commands
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction, client);
      }

      // Buttons
      else if (interaction.isButton()) {
        const button = client.buttons.get(interaction.customId);
        if (!button) return;
        await button.execute(interaction, client);
      }

      // Select menus (all types)
      else if (interaction.isAnySelectMenu()) {
        const menu = client.selectMenus.get(interaction.customId);
        if (!menu) return;
        await menu.execute(interaction, client);
      }

      // Context menu commands
      else if (interaction.isContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction, client);
      }

    } catch (error) {
      console.error('Error handling interaction:', error.message);

      const errorMessage = {
        content: 'Something went wrong while handling this interaction.',
        ephemeral: true
      };

      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(errorMessage);
        } else {
          await interaction.followUp(errorMessage);
        }
      } catch (followUpError) {
        // Silently fail if we can't send error message
      }
    }
  },
};