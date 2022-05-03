const {Permissions} = require('discord.js');

module.exports = {
    active: false,
    name: 'editions',
    description: lang => lang.get('editionsDescription'), // fazer locale
    cooldown: 5,
    categoryID: 2,
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
    premium: true,
    executeSlash: async (interaction, args) => {

    },
    slashOptions: [
        {
            type: 'SUB_COMMAND',
            name: 'storage',
            description: 'Sets if edited messages should be stored for later viewing',
            options: [{
                type: 'BOOLEAN',
                name: 'enable',
                description: 'Whether edited messages should be stored or not',
                required: true,
            }],
        },
        {
            type: 'SUB_COMMAND',
            name: 'delete',
            description: 'Requests deletion of all stored previously edited messages from this server',
        },
        {
            type: 'SUB_COMMAND',
            name: 'info',
            description: 'Shows information on the current state of the edited messages storing functionality in this server',
        },
    ],
}