const {PermissionsBitField, ApplicationCommandOptionType, ChannelType} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'slowmode',
    description: lang => lang.get('slowmodeDescription'),
    aliases: ['sm', 'slow'],
    usage: lang => [lang.get('slowmodeUsage')],
    example: ['3h7m3s #general'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: PermissionsBitField.Flags.ManageChannels,
    guildOnly: true,
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'cooldown',
            nameLocalizations: utils.getStringLocales('slowmodeOptioncooldownLocalisedName'),
            description: 'The time between each message an user can send',
            descriptionLocalisedDesc: utils.getStringLocales('slowmodeOptioncooldownLocalisedDesc'),
            required: true,
            autocomplete: true,
            minValue: 0,
            maxValue: 21600,
        },
        {
            type: ApplicationCommandOptionType.Channel,
            name: 'channel',
            nameLocalizations: utils.getStringLocales('slowmodeOptionchannelLocalisedName'),
            description: 'The channel to set the slowmode cooldown',
            descriptionLocalisedDesc: utils.getStringLocales('slowmodeOptionchannelLocalisedDesc'),
            required: false,
            channelTypes: [
                ChannelType.GuildNews,
                ChannelType.GuildText,
                ChannelType.GuildVoice,
                ChannelType.GuildNewsThread,
                ChannelType.GuildPublicThread,
                ChannelType.GuildPrivateThread,
            ],
        },
    ],
    execute: async (message, args) => {
        const {channelLanguage} = message;
        const discordChannel = (
            message.guild.channels.cache.get(args[1]?.match(/^(?:<#)?(\d{17,19})>?$/)?.[1])
            ??
            message.channel
        );
        const seconds = (
            (
                (parseInt(args[0].match(/(\d+)h/)?.[1], 10) * 3600)
                ||
                0
            ) + (
                (parseInt(args[0].match(/(\d+)m/)?.[1], 10) * 60)
                ||
                0
            ) + (
                parseInt(args[0].match(/(\d+)(?:s|$)/)?.[1], 10)
                ||
                0
            )
        );
        if(seconds > 21600) return message.reply(channelLanguage.get('slowValueTooHigh'));
        if(
            !message.member
                .permissionsIn(discordChannel)
                .has(PermissionsBitField.Flags.ManageChannels)
        ) return message.reply(
            channelLanguage.get(
                'cantEditSlowmode',
                [discordChannel]
            )
        );
        if(
            !message.guild.members.me
                .permissionsIn(discordChannel)
                .has(PermissionsBitField.Flags.ManageChannels)
        ) return message.reply(channelLanguage.get('botCantEditSlowmode'));
        await discordChannel.setRateLimitPerUser(seconds, channelLanguage.get('executor', [message.author]));
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        await message.reply(
            seconds
            ? channelLanguage.get(
                'slowmodeEdited',
                [
                    h,
                    m,
                    s,
                    discordChannel,
                ]
            )
            : channelLanguage.get(
                'slowmodeRemoved',
                [discordChannel]
            )
        );
    },
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const targetChannel = args.channel ?? interaction.channel;
        if(
            !interaction.guild.members.me
                .permissionsIn(targetChannel)
                .has(PermissionsBitField.Flags.ManageChannels)
        ) return await interaction.reply({
            content: channelLanguage.get('botCantEditSlowmode'),
            ephemeral: true,
        });
        await targetChannel.setRateLimitPerUser(args.cooldown, channelLanguage.get('executor', [interaction.user]));
        const h = Math.floor((args.cooldown % 86400) / 3600);
        const m = Math.floor((args.cooldown % 3600) / 60);
        const s = args.cooldown % 60;
        await interaction.reply(
            args.cooldown
            ? channelLanguage.get(
                'slowmodeEdited',
                [
                    h,
                    m,
                    s,
                    targetChannel,
                ]
            )
            : channelLanguage.get(
                'slowmodeRemoved',
                [targetChannel]
            )
        );
    },
    commandAutocomplete: {
        cooldown: (interaction, value, locale) => {
            if(!value) return interaction.respond([
                {
                    name: locale.get('slowmodeDisable'),
                    value: 0,
                },
                {
                    name: locale.get('timeAmountSeconds', ['1']),
                    value: 1,
                },
                {
                    name: locale.get('timeAmountSeconds', ['5']),
                    value: 5,
                },
                {
                    name: locale.get('timeAmountSeconds', ['10']),
                    value: 10,
                },
                {
                    name: locale.get('timeAmountSeconds', ['15']),
                    value: 15,
                },
                {
                    name: locale.get('timeAmountSeconds', ['30']),
                    value: 30,
                },
                {
                    name: locale.get('timeAmountMinutes', ['1']),
                    value: 60,
                },
                {
                    name: locale.get('timeAmountMinutes', ['2']),
                    value: 120,
                },
                {
                    name: locale.get('timeAmountMinutes', ['5']),
                    value: 300,
                },
                {
                    name: locale.get('timeAmountMinutes', ['10']),
                    value: 600,
                },
                {
                    name: locale.get('timeAmountMinutes', ['15']),
                    value: 900,
                },
                {
                    name: locale.get('timeAmountMinutes', ['30']),
                    value: 1800,
                },
                {
                    name: locale.get('timeAmountHours', ['1']),
                    value: 3600,
                },
                {
                    name: locale.get('timeAmountHours', ['2']),
                    value: 7200,
                },
                {
                    name: locale.get('timeAmountHours', ['6']),
                    value: 21600,
                },
            ]);
            const realValue = parseInt(value, 10);
            if(realValue === 0) return interaction.respond([{
                name: locale.get('slowmodeDisable'),
                value: realValue,
            }]);
            const choices = [];
            if(realValue < 21601) choices.push({
                name: locale.get('timeAmountSeconds', [value]),
                value: realValue,
            });
            if(realValue < 361) choices.push({
                name: locale.get('timeAmountMinutes', [value]),
                value: realValue * 60,
            });
            if(realValue < 7) choices.push({
                name: locale.get('timeAmountHours', [value]),
                value: realValue * 3600,
            });
            interaction.respond(choices);
        },
    },
}