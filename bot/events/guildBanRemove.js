const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    name: 'guildBanRemove',
    execute: async ban => {
        if(ban.partial) ban = await ban.fetch().catch(() => null);
        if(!ban) return;
        if(!ban.guild.me.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG)) return;
        const audits = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_BAN_REMOVE',
        });
        const guildDoc = await guild.findByIdAndUpdate(ban.guild.id, {$inc: {counterLogs: 1}});
        ban.client.guildData.get(ban.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: ban.guild.id,
            type: 'ban',
            target: ban.user.id,
            executor: audits.entries.first().executor.id,
            timeStamp: audits.entries.first().createdAt,
            removal: true,
        });
        await current.save();
        const discordChannel = ban.guild.channels.cache.get(ban.client.guildData.get(ban.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(ban.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(ban.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const channelLanguage = ban.client.langs[ban.client.guildData.get(ban.guild.id).language];
        const embed = new MessageEmbed()
            .setColor(0x00ff00)
            .setAuthor({
                name: channelLanguage.get('unbanEmbedAuthor', [audits.entries.first().executor.tag, ban.user.tag]),
                iconURL: ban.user.displayAvatarURL({dynamic: true}),
            })
            .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [ban.user]), true)
            .addField(channelLanguage.get('unbanEmbedExecutorTitle'), audits.entries.first().executor.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('unbanEmbedFooter', [current.id]),
                iconURL: ban.guild.iconURL({dynamic: true}),
            });
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
}