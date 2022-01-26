module.exports = {
    name: 'APPLICATION_COMMAND_AUTOCOMPLETE',
    execute: async interaction => {
        const subCommandName = interaction.options.getSubcommand();
        const option = (subCommandName ? interaction.options.data[0].options : interaction.options.data).find(e => e.focused);
        interaction.client.commands.get(interaction.commandName)[`${subCommandName ?? 'execute'}Autocomplete`][option.name](interaction, option.value);
    },
};