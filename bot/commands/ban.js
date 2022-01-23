const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'ban',
    description: lang => lang.get('banDescription'),
    aliases: ['b', 'forceban', 'hackban'],
    usage: lang => [lang.get('banUsage')],
    example: ['@LordHawk#0001 spammer'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: Permissions.FLAGS.BAN_MEMBERS,
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.reply(channelLanguage.get('invUser'));
        const user = await message.client.users.fetch(id).catch(() => null);
        if(!user) return message.reply(channelLanguage.get('invUser'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        const member = await message.guild.members.fetch(user.id).catch(() => null);
        if(member){
            if(!member.bannable) return message.reply(channelLanguage.get('cantBan'));
            if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply(channelLanguage.get('youCantBan'));
            await member.send(channelLanguage.get('dmBanned', [message.guild.name, reason])).catch(() => null);
        }
        else{
            const ban = await message.guild.bans.fetch(user.id).catch(() => null);
            if(ban) return message.reply(channelLanguage.get('alreadyBanned'));
        }
        const newban = await message.guild.members.ban(user.id, {
            reason: channelLanguage.get('banReason', [message.author.tag, reason]),
            days: message.client.guildData.get(message.guild.id).pruneBan,
        }).catch(() => null);
        if(!newban) return message.reply(channelLanguage.get('cantBan'));
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
            image: message.attachments.first()?.height && message.attachments.first().url,
        });
        await current.save();
        await message.reply(channelLanguage.get('memberBanSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setAuthor({
                name: channelLanguage.get('banEmbedAuthor', [message.author.tag, user.tag]),
                iconURL: user.displayAvatarURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('banEmbedDescription', [message.url]))
            .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [user]), true)
            .addField(channelLanguage.get('banEmbedExecutorTitle'), message.author.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('banEmbedFooter', [current.id]),
                iconURL: message.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('banEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};