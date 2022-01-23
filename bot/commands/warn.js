const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'warn',
    description: lang => lang.get('warnDescription'),
    aliases: ['adv', 'advert'],
    usage: lang => [lang.get('warnUsage')],
    example: ['@LordHawk#0001 stop spamming'],
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
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.reply(channelLanguage.get('invMember'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        if(member.user.bot) return message.reply(channelLanguage.get('cantWarnBot'));
        if((message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) || (message.guild.ownerId === member.id)) return message.reply(channelLanguage.get('youCantWarn'));
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
            image: message.attachments.first()?.height && message.attachments.first().url,
        });
        await current.save();
        await member.user.send(channelLanguage.get('dmWarned', [message.guild.name, reason])).catch(() => message.reply(channelLanguage.get('warnedBlockedDms')));
        await message.reply(channelLanguage.get('warnSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.warn);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const embed = new MessageEmbed()
            .setColor(0xffff00)
            .setAuthor({
                name: channelLanguage.get('warnEmbedAuthor', [message.author.tag, member.user.tag]),
                iconURL: member.user.displayAvatarURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('warnEmbedDescription', [message.url]))
            .addField(channelLanguage.get('warnEmbedTargetTitle'), channelLanguage.get('warnEmbedTargetValue', [member]), true)
            .addField(channelLanguage.get('warnEmbedExecutorTitle'), message.author.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('warnEmbedFooter', [current.id]),
                iconURL: message.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('warnEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};