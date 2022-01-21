const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'kick',
    description: lang => lang.get('kickDescription'),
    aliases: ['k'],
    usage: lang => [lang.get('kickUsage')],
    example: ['@LordHawk#0001 come back when you stop being annoying'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: 'KICK_MEMBERS',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.channel.send(channelLanguage.get('invMember'));
        if(!member.kickable) return message.channel.send(channelLanguage.get('cantKick'));
        if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.channel.send(channelLanguage.get('youCantKick'));
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
        await member.kick(channelLanguage.get('kickAuditReason', [message.author.tag, reason]));
        await message.channel.send(channelLanguage.get('kickSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.kick);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const embed = new MessageEmbed()
            .setColor(0xffbf00)
            .setAuthor({
                name: channelLanguage.get('kickEmbedAuthor', [message.author.tag, member.user.tag]),
                iconURL: member.user.displayAvatarURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('kickEmbedDescription', [message.url]))
            .addField(channelLanguage.get('kickEmbedTargetTitle'), channelLanguage.get('kickEmbedTargetValue', [member]), true)
            .addField(channelLanguage.get('kickEmbedExecutorTitle'), message.author.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('kickEmbedFooter', [current.id]),
                iconURL: message.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('kickEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};