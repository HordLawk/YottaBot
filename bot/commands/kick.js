const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'kick',
    description: lang => lang.get('kickDescription'),
    aliases: ['k'],
    usage: lang => [lang.get('kickUsage')],
    example: ['@LordHawk#0572 come back when you stop being annoying'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: 'KICK_MEMBERS',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.channel.send(message.client.langs[channelLanguage].get('invMember'));
        if(!member.kickable) return message.channel.send(message.client.langs[channelLanguage].get('cantKick'));
        if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.channel.send(message.client.langs[channelLanguage].get('youCantKick'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'kick',
            target: member.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
        });
        await current.save();
        await member.kick(message.client.langs[channelLanguage].get('kickAuditReason', [message.author.tag, reason]));
        await message.channel.send(message.client.langs[channelLanguage].get('kickSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.kick);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const embed = new MessageEmbed()
            .setColor(0xffbf00)
            .setAuthor(message.client.langs[channelLanguage].get('kickEmbedAuthor', [message.author.tag, member.user.tag]), member.user.displayAvatarURL({dynamic: true}))
            .setDescription(message.client.langs[channelLanguage].get('kickEmbedDescription', [message.url]))
            .addField(message.client.langs[channelLanguage].get('kickEmbedTargetTitle'), message.client.langs[channelLanguage].get('kickEmbedTargetValue', [member]), true)
            .addField(message.client.langs[channelLanguage].get('kickEmbedExecutorTitle'), message.author, true)
            .setTimestamp()
            .setFooter(message.client.langs[channelLanguage].get('kickEmbedFooter', [current.id]), message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField(message.client.langs[channelLanguage].get('kickEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};