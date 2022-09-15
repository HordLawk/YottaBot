const {PermissionsBitField} = require('discord.js');

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
}