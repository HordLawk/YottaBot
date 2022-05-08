const guild = require('../../schemas/guild.js');

module.exports = {
    active: true,
    name: 'partner',
    description: () => 'Sets a server as bot partner',
    dev: true,
    args: true,
    usage: () => ['<add/rem> (server id)'],
    executeSlash: async (interaction, args) => {
        const guildDoc = await guild.findByIdAndUpdate(args.guild, {$set: {partner: args.add}}, {new: true});
        if(!guildDoc) return interaction.reply({
            content: `Could not find a server with Id \`${args.guild}\` in the database`,
            ephemeral: true,
        });
        interaction.client.guildData.get(guildDoc._id).partner = guildDoc.partner;
        await interaction.reply(`The server with Id \`${guildDoc._id}\` had its partner status set to \`${guildDoc.partner}\``);
    },
    slashOptions: [
        {
            type: 'BOOLEAN',
            name: 'add',
            description: 'Whether to add this server as partner',
            required: true,
        },
        {
            type: 'STRING',
            name: 'guild',
            description: 'The guild to issue the partner action on',
            required: true,
            autocomplete: true,
        },
    ],
    commandAutocomplete: {
        guild: (interaction, value) => interaction.respond((interaction.user.id === interaction.client.application.owner.id) ? interaction.client.guilds.cache.filter(e => e.name.toLowerCase().startsWith(value.toLowerCase())).first(25).map(e => ({
            name: e.name,
            value: e.id,
        })) : [{
            name: interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'].get('forbidden'),
            value: '',
        }]),
    },
};