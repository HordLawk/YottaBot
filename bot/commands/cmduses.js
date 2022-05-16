const { MessageEmbed, Collection } = require("discord.js");
const memberModel = require('../../schemas/member.js');

module.exports = {
    active: true,
    name: 'cmduses',
    dev: true,
    description: () => 'Shows command usage stats',
    allSlash: async interaction => {
        const members = await memberModel.find({commandUses: {$ne: []}});
        const embed = new MessageEmbed()
            .setAuthor({
                name: 'General command usage stats',
                iconURL: interaction.client.user.avatarURL(),
            })
            .setColor(0x2f3136)
            .setDescription(members.reduce((acc, e) => (e.commandUses.forEach(el => acc.set(el._id, (acc.get(el._id) ?? 0) + el.count)), acc), new Collection()).map((e, i) => `${i}: \`${e}\``).join('\n'));
        await interaction.reply({embeds: [embed]});
    },
    userSlash: async (interaction, args) => {
        const members = await memberModel.find({
            userID: args.user.id,
            commandUses: {
                $ne: [],
                $exists: true,
            },
        });
        if(!members.length) return await interaction.reply({
            content: 'There are no commands usage statistics for this user',
            ephemeral: true,
        });
        const embed = new MessageEmbed()
            .setAuthor({
                name: args.user.tag,
                iconURL: args.user.avatarURL(),
            })
            .setColor(0x2f3136)
            .setDescription(members.reduce((acc, e) => (e.commandUses.forEach(el => acc.set(el._id, (acc.get(el._id) ?? 0) + el.count)), acc), new Collection()).map((e, i) => `${i}: \`${e}\``).join('\n'));
        await interaction.reply({embeds: [embed]});
    },
    serverSlash: async (interaction, args) => {
        const members = await memberModel.find({
            guild: args.guild,
            commandUses: {
                $ne: [],
                $exists: true,
            },
        });
        if(!members.length) return await interaction.reply({
            content: 'There are no commands usage statistics for this server',
            ephemeral: true,
        });
        const server = interaction.client.guilds.cache.get(args.guild);
        const embed = new MessageEmbed()
            .setAuthor({
                name: server.name,
                iconURL: server.iconURL({dynamic: true}),
            })
            .setColor(0x2f3136)
            .setDescription(members.reduce((acc, e) => (e.commandUses.forEach(el => acc.set(el._id, (acc.get(el._id) ?? 0) + el.count)), acc), new Collection()).map((e, i) => `${i}: \`${e}\``).join('\n'));
        await interaction.reply({embeds: [embed]});
    },
    slashOptions: [
        {
            type: 'SUB_COMMAND',
            name: 'all',
            description: 'Shows stats of the usage of commands throughout all servers',
        },
        {
            type: 'SUB_COMMAND',
            name: 'user',
            description: 'Shows stats of the usage of commands for an user',
            options: [{
                type: 'USER',
                name: 'user',
                description: 'The user to check command usage stats of',
                required: true,
            }],
        },
        {
            type: 'SUB_COMMAND',
            name: 'server',
            description: 'Shows stats of the usage of command for a server',
            options: [{
                type: 'STRING',
                name: 'guild',
                description: 'The server to check command usage stats of',
                required: true,
                autocomplete: true,
            }],
        },
    ],
    serverAutocomplete: {
        guild: (interaction, value) => interaction.respond((interaction.user.id === interaction.client.application.owner.id) ? interaction.client.guilds.cache.filter(e => e.name.toLowerCase().startsWith(value.toLowerCase())).first(25).map(e => ({
            name: e.name,
            value: e.id,
        })) : [{
            name: interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'].get('forbidden'),
            value: '',
        }]),
    },
};