const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    name: 'guildBanAdd',
    execute: async ban => {
        if(ban.partial) ban = await ban.fetch().catch(() => null);
        if(!ban) return;
        if(!ban.guild.me.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG)) return;
        const audits = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_BAN_ADD',
        });
        if(audits.entries.first().executor.bot) return;
        const reason = ban.reason?.slice(0, 500);
        const guildDoc = await guild.findByIdAndUpdate(ban.guild.id, {$inc: {counterLogs: 1}});
        ban.client.guildData.get(ban.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: ban.guild.id,
            type: 'ban',
            target: ban.user.id,
            executor: audits.entries.first().executor.id,
            timeStamp:  audits.entries.first().createdAt,
            reason: reason,
        });
        await current.save();
        const discordChannel = ban.guild.channels.cache.get(ban.client.guildData.get(ban.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(ban.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(ban.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const channelLanguage = ban.client.langs[ban.client.guildData.get(ban.guild.id).language];
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setAuthor({
                name: channelLanguage.get('banEmbedAuthor', [audits.entries.first().executor.tag, ban.user.tag]),
                iconURL: ban.user.displayAvatarURL({dynamic: true}),
            })
            .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [ban.user]), true)
            .addField(channelLanguage.get('banEmbedExecutorTitle'), audits.entries.first().executor.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('banEmbedFooter', [current.id]),
                iconURL: ban.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('banEmbedReasonTitle'), reason);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};