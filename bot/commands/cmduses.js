const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const locale = require('../../locale');

module.exports = {
    active: true,
    name: 'cmduses',
    dev: true,
    description: () => 'Shows command usage stats',
    allSlash: async interaction => {
        const memberModel = require('../../schemas/member.js');
        const commandUses = await memberModel.aggregate([
            {$match: {commandUses: {
                $ne: [],
                $exists: true,
            }}},
            {$unwind: "$commandUses"},
            {$group: {
                _id: "$commandUses._id",
                count: {$sum: "$commandUses.count"},
            }},
            {$sort: {count: -1}},
        ]);
        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Commands usage stats',
                iconURL: interaction.client.user.avatarURL(),
            })
            .setColor(0x2f3136)
            .setDescription(commandUses.map(e => `${e._id}: \`${e.count}\``).join('\n'));
        await interaction.reply({embeds: [embed]});
    },
    userSlash: async (interaction, args) => {
        const memberModel = require('../../schemas/member.js');
        const commandUses = await memberModel.aggregate([
            {$match: {
                userID: args.user.id,
                commandUses: {
                    $ne: [],
                    $exists: true,
                },
            }},
            {$unwind: "$commandUses"},
            {$group: {
                _id: "$commandUses._id",
                count: {$sum: "$commandUses.count"},
            }},
            {$sort: {count: -1}},
        ]);
        if(!commandUses.length) return await interaction.reply({
            content: 'There are no commands usage statistics for this user',
            ephemeral: true,
        });
        const embed = new EmbedBuilder()
            .setAuthor({
                name: args.user.tag,
                iconURL: args.user.avatarURL(),
            })
            .setColor(0x2f3136)
            .setDescription(commandUses.map(e => `${e._id}: \`${e.count}\``).join('\n'));
        await interaction.reply({embeds: [embed]});
    },
    serverSlash: async (interaction, args) => {
        const memberModel = require('../../schemas/member.js');
        const commandUses = await memberModel.aggregate([
            {$match: {
                guild: args.guild,
                commandUses: {
                    $ne: [],
                    $exists: true,
                },
            }},
            {$unwind: "$commandUses"},
            {$group: {
                _id: "$commandUses._id",
                count: {$sum: "$commandUses.count"},
            }},
            {$sort: {count: -1}},
        ]);
        if(!commandUses.length) return await interaction.reply({
            content: 'There are no commands usage statistics for this server',
            ephemeral: true,
        });
        const embed = (await interaction.client.shard.broadcastEval(async (c, {guildId, commandUsesStr}) => {
            const guild = c.guilds.cache.get(guildId);
            if(guild) return new EmbedBuilder()
                .setAuthor({
                    name: guild.name,
                    iconURL: guild.iconURL({dynamic: true}),
                })
                .setColor(0x2f3136)
                .setDescription(commandUsesStr);
        }, {context: {
            guildId: args.guild,
            commandUsesStr: commandUses.map(e => `${e._id}: \`${e.count}\``).join('\n'),
        }})).find(e => e);
        await interaction.reply({embeds: [embed]});
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'all',
            description: 'Shows stats of the usage of commands throughout all servers',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'user',
            description: 'Shows stats of the usage of commands for an user',
            options: [{
                type: ApplicationCommandOptionType.User,
                name: 'user',
                description: 'The user to check command usage stats of',
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'server',
            description: 'Shows stats of the usage of command for a server',
            options: [{
                type: ApplicationCommandOptionType.String,
                name: 'guild',
                description: 'The server to check command usage stats of',
                required: true,
                autocomplete: true,
            }],
        },
    ],
    serverAutocomplete: {
        guild: (interaction, value) => interaction.respond(
            (interaction.user.id === interaction.client.application.owner.id)
            ? interaction.client.guilds.cache
                .filter(e => e.name.toLowerCase().startsWith(value.toLowerCase()))
                .first(25)
                .map(e => ({
                    name: e.name,
                    value: e.id,
                }))
            : [{
                name: locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en').get('forbidden'),
                value: '',
            }]
        ),
    },
};