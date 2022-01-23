module.exports = {
    name: 'interactionCreate',
    execute: async interaction => interaction.client.interactions.get(interaction.type)?.execute(interaction).catch(error => {
        if(interaction.isApplicationCommand()) interaction.reply({
            content: interaction.client.langs[interaction.locale === 'pt-BR' ? 'pt' : 'en'].get('error', [interaction.commandName]),
            ephemeral: true,
        });
        throw error;
    }),
};