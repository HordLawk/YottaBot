const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'unban',
    description: lang => lang.get('unbanDescription'),
    usage: lang => [lang.get('unbanUsage')],
    example: ['@LordHawk apologised'],
    cooldown: 5,
    categoryID: 3,
    args: true,
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.channel.send(channelLanguage.get('invUser'));
        const ban = await message.guild.fetchBan(id).catch(() => null);
        if(!ban) return message.channel.send(channelLanguage.get('invBanned'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send(channelLanguage.get('cantUnban'));
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'ban',
            target: ban.user.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
            removal: true,
        });
        await current.save();
        await message.guild.members.unban(ban.user.id, channelLanguage.get('unbanAuditReason', [message.author.tag, reason]));
        await message.channel.send(channelLanguage.get('unbanSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const embed = new MessageEmbed()
            .setColor(0x00ff00)
            .setAuthor(channelLanguage.get('unbanEmbedAuthor', [message.author.tag, ban.user.tag]), ban.user.displayAvatarURL({dynamic: true}))
            .setDescription(channelLanguage.get('unbanEmbedDescription', [message.url]))
            .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [ban.user]), true)
            .addField(channelLanguage.get('unbanEmbedExecutorTitle'), message.author, true)
            .setTimestamp()
            .setFooter(channelLanguage.get('unbanEmbedFooter', [current.id]), message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField(channelLanguage.get('unbanEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};