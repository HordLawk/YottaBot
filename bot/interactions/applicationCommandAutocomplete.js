const { InteractionType } = require('discord.js');
const commands = require('../commands');

module.exports = {
    type: InteractionType.ApplicationCommandAutocomplete,
    execute: async interaction => {
        const subCommandName = interaction.options.getSubcommand(false);
        const subCommandGroupName = interaction.options.getSubcommandGroup(false) ?? '';
        const option = interaction.options.getFocused(true);
        commands.get(interaction.commandName)[`${subCommandName ? `${subCommandGroupName}${subCommandName}` : 'command'}Autocomplete`][option.name](interaction, option.value);
    },
};