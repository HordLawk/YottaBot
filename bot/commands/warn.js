const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'warn',
    description: lang => lang.get('warnDescription'),
    aliases: ['adv', 'advert'],
    usage: lang => [lang.get('warnUsage')],
    example: ['@LordHawk#0572 stop spamming'],
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
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.channel.send(message.client.langs[channelLanguage].get('invMember'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        if(member.user.bot) return message.channel.send(message.client.langs[channelLanguage].get('cantWarnBot'));
        if((message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) || (message.guild.ownerID === member.id)) return message.channel.send(message.client.langs[channelLanguage].get('youCantWarn'));
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'warn',
            target: member.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height ? message.attachments.first().url : null,
        });
        await current.save();
        await member.user.send(message.client.langs[channelLanguage].get('dmWarned', [message.guild.name, reason])).catch(() => message.channel.send(message.client.langs[channelLanguage].get('warnedBlockedDms')));
        await message.channel.send(message.client.langs[channelLanguage].get('warnSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.warn);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const embed = new MessageEmbed()
            .setColor(0xffff00)
            .setAuthor(message.client.langs[channelLanguage].get('warnEmbedAuthor', [message.author.tag, member.user.tag]), member.user.displayAvatarURL({dynamic: true}))
            .setDescription(message.client.langs[channelLanguage].get('warnEmbedDescription', [message.url]))
            .addField(message.client.langs[channelLanguage].get('warnEmbedTargetTitle'), message.client.langs[channelLanguage].get('warnEmbedTargetValue', [member]), true)
            .addField(message.client.langs[channelLanguage].get('warnEmbedExecutorTitle'), message.author, true)
            .setTimestamp()
            .setFooter(message.client.langs[channelLanguage].get('warnEmbedFooter', [current.id]), message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField(message.client.langs[channelLanguage].get('warnEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};