const log = require('../../schemas/log.js');
const guild = require('../../schemas/guild.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'mute',
    description: lang => lang.get('muteDescription'),
    aliases: ['m'],
    usage: lang => [lang.get('muteUsage')],
    example: ['@LordHawk#0001 1h30m spammer'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: Permissions.FLAGS.MODERATE_MEMBERS,
    guildOnly: true,
    execute: async (message, args) => {
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.reply(channelLanguage.get('invMember'));
        if((message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) || member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return message.reply(channelLanguage.get('youCantMute'));
        if(!member.moderatable) return message.reply(channelLanguage.get('iCantMute'));
        const duration = args[1] && (((parseInt(args[1].match(/(\d+)d/)?.[1], 10) * 86400000) || 0) + ((parseInt(args[1].match(/(\d+)h/)?.[1], 10) * 3600000) || 0) + ((parseInt(args[1].match(/(\d+)m/)?.[1], 10) * 60000) || 0));
        const timeStamp = Date.now();
        if(!duration || (duration > 2419200000)) return message.reply(channelLanguage.get('invMuteDuration'));
        if(member.isCommunicationDisabled()) return message.reply(channelLanguage.get('alreadyMuted'));
        const reason = message.content.replace(/^(?:\S+\s+){2}\S+\s*/, '').slice(0, 500);
        const guildDoc = await guild.findById(message.guild.id);
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs++,
            guild: message.guild.id,
            type: 'mute',
            target: member.id,
            executor: message.author.id,
            timeStamp: timeStamp,
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
            ongoing: true,
        });
        await guildDoc.save();
        await current.save();
        await member.timeout(duration, current.reason);
        current.duration = member.communicationDisabledUntil;
        await current.save();
        await message.reply(channelLanguage.get('muteMemberSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.mute);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const d = Math.floor(duration / 86400000);
        const h = Math.floor((duration % 86400000) / 3600000);
        const m = Math.floor((duration % 3600000) / 60000);
        const embed = new MessageEmbed()
            .setTimestamp()
            .setColor(0xff8000)
            .setAuthor({
                name: channelLanguage.get('muteEmbedAuthor', [message.author.tag, member.user.tag]),
                iconURL: member.user.displayAvatarURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('muteEmbedDescription', [message.url]))
            .addField(channelLanguage.get('muteEmbedTargetTitle'), channelLanguage.get('muteEmbedTargetValue', [member]), true)
            .addField(channelLanguage.get('muteEmbedExecutorTitle'), message.author.toString(), true)
            .addField(channelLanguage.get('muteEmbedDurationTitle'), channelLanguage.get('muteEmbedDurationValue', [d, h, m, Math.floor(current.duration.getTime() / 1000)]), true)
            .setFooter({
                text: channelLanguage.get('muteEmbedFooter', [current.id]),
                iconURL: message.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('muteEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};