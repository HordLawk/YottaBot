const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'ban',
    description: lang => lang.get('banDescription'),
    aliases: ['b', 'forceban', 'hackban'],
    usage: lang => [lang.get('banUsage')],
    example: ['@LordHawk#0572 spammer'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: 'BAN_MEMBERS',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.channel.send(message.client.langs[channelLanguage].get('invUser'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        const member = await message.guild.members.fetch(id).catch(() => null);
        if(member){
            if(!member.bannable) return message.channel.send(message.client.langs[channelLanguage].get('cantBan'));
            if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.channel.send(message.client.langs[channelLanguage].get('youCantBan'));
            await member.send(message.client.langs[channelLanguage].get('dmBanned', [message.guild.name, reason])).catch(() => null);
        }
        else{
            const ban = await message.guild.fetchBan(id).catch(() => null);
            if(ban) return message.channel.send(message.client.langs[channelLanguage].get('alreadyBanned'));
        }
        const user = await message.guild.members.ban(id, {
            reason: message.client.langs[channelLanguage].get('banReason', [message.author.tag, reason]),
            days: message.client.guildData.get(message.guild.id).pruneBan,
        }).catch(() => null);
        if(!user) return message.channel.send(message.client.langs[channelLanguage].get('invUser'));
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'ban',
            target: user.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height ? message.attachments.first().url : null,
        });
        await current.save();
        await message.channel.send(message.client.langs[channelLanguage].get('memberBanSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setAuthor(message.client.langs[channelLanguage].get('banEmbedAuthor', [message.author.tag, user.tag]), user.displayAvatarURL({dynamic: true}))
            .setDescription(message.client.langs[channelLanguage].get('banEmbedDescription', [message.url]))
            .addField(message.client.langs[channelLanguage].get('banEmbedTargetTitle'), message.client.langs[channelLanguage].get('banEmbedTargetValue', [user]), true)
            .addField(message.client.langs[channelLanguage].get('banEmbedExecutorTitle'), message.author, true)
            .setTimestamp()
            .setFooter(message.client.langs[channelLanguage].get('banEmbedFooter', [current.id]), message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField(message.client.langs[channelLanguage].get('banEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};