const {MessageEmbed, Permissions} = require('discord.js');
const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');

module.exports = {
    name: 'guildMemberRemove',
    execute: async member => {
        if(member.partial) member = await member.fetch().catch(() => null);
        if(!member || (member.id === member.client.user.id) || !member.guild.me.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG)) return;
        const audits = await member.guild.fetchAuditLogs({limit: 1});
        if((audits.entries.first()?.action != 'MEMBER_KICK') || (audits.entries.first()?.target.id != member.id) || audits.entries.first()?.executor.bot) return;
        const reason = audits.entries.first().reason?.slice(0, 500);
        const guildDoc = await guild.findByIdAndUpdate(member.guild.id, {$inc: {counterLogs: 1}});
        member.client.guildData.get(member.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: member.guild.id,
            type: 'kick',
            target: member.id,
            executor: audits.entries.first().executor.id,
            timeStamp: audits.entries.first().createdAt,
            reason: reason,
        });
        await current.save();
        const discordChannel = member.guild.channels.cache.get(member.client.guildData.get(member.guild.id).modlogs.kick);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(member.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(member.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const channelLanguage = member.client.langs[member.client.guildData.get(member.guild.id).language];
        const embed = new MessageEmbed()
            .setColor(0xffbf00)
            .setAuthor({
                name: channelLanguage.get('kickEmbedAuthor', [audits.entries.first().executor.tag, member.user.tag]),
                iconURL: member.user.displayAvatarURL({dynamic: true}),
            })
            .addField(channelLanguage.get('kickEmbedTargetTitle'), channelLanguage.get('kickEmbedTargetValue', [member, member.id]), true)
            .addField(channelLanguage.get('kickEmbedExecutorTitle'), audits.entries.first().executor.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('kickEmbedFooter', [current.id]),
                iconURL: member.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('kickEmbedReasonTitle'), reason);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};