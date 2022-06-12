const locale = require('../../locale');
const interactions = require('../interactions');

module.exports = {
    name: 'interactionCreate',
    execute: async interaction => interactions.get(interaction.type)?.execute(interaction).catch(error => {
        if(interaction.isApplicationCommand()) interaction.reply({
            content: locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en').get('error', [interaction.commandName]),
            ephemeral: true,
        });
        throw error;
    }),
};