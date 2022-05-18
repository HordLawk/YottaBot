module.exports = {
    name: 'APPLICATION_COMMAND_AUTOCOMPLETE',
    execute: async interaction => {
        const subCommandName = interaction.options.getSubcommand(false);
        const subCommandGroupName = interaction.options.getSubcommandGroup(false) ?? '';
        const option = interaction.options.getFocused(true);
        if((interaction.commandName === 'unban') && (!interaction.guild.bans.cache.size)) await interaction.guild.bans.fetch();
        interaction.client.commands.get(interaction.commandName)[`${subCommandName ? `${subCommandGroupName}${subCommandName}` : 'command'}Autocomplete`][option.name](interaction, option.value);
    },
};