const channelModel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const edition = require('../../schemas/edition.js');
const {PermissionsBitField, EmbedBuilder, AuditLogEvent} = require('discord.js');
const locale = require('../../locale');

module.exports = {
    name: 'messageDeleteBulk',
    execute: async messages => {
        const {guild, client, channel} = messages.first();
        if(!guild) return;
        await edition.deleteMany({messageID: {$in: messages.map(e => e.id)}});
        if(!guild.available || !client.guildData.get(guild.id)?.actionlogs.id('prune') || (!client.guildData.get(guild.id)?.actionlogs.id('prune').hookID && !client.guildData.get(guild.id)?.defaultLogsHookID) || !guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return;
        const relevantMessages = messages.filter(e => (!e.partial && !e.author.bot && !e.system));
        if(!relevantMessages.size) return;
        const channelLanguage = locale.get(client.guildData.get(guild.id).language);
        const audits = await guild.fetchAuditLogs({limit: 1});
        const executor = (() => {
            if(audits.entries.size && [AuditLogEvent.MessageBulkDelete, AuditLogEvent.MemberBanAdd].includes(audits.entries.first().action)) return audits.entries.first().executor;
        })();
        if(executor?.id === client.user.id) return;
        const channelDoc = await channelModel.findById(channel.id);
        if(channelDoc && channelDoc.ignoreActions.includes('prune')) return;
        if(executor){
            const memb = await guild.members.fetch(executor).catch(() => null);
            if(memb){
                let roleDoc = await role.findOne({
                    guild: guild.id,
                    roleID: {$in: memb.roles.cache.map(e => e.id)},
                    ignoreActions: 'prune',
                });
                if(roleDoc) return;
            }
        }
        const hook = await client.fetchWebhook(client.guildData.get(guild.id).actionlogs.id('prune')?.hookID ?? client.guildData.get(guild.id).defaultLogsHookID, client.guildData.get(guild.id).actionlogs.id('prune').hookToken ?? client.guildData.get(guild.id).defaultLogsHookToken).catch(() => null);
        if(!hook) return;
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTimestamp()
            .setAuthor({
                name: channelLanguage.get('pruneEmbedAuthor'),
                iconURL: guild.iconURL({dynamic: true})
            })
            .addField(channelLanguage.get('pruneEmbedAmountTitle'), relevantMessages.size.toString(), true)
            .addField(channelLanguage.get('delmsgEmbedChannelTitle'), channel.toString(), true);
        if(executor) embed.addField(channelLanguage.get('delmsgEmbedExecutorTitle'), executor.toString(), true);
        await hook.send({
            username: client.user.username,
            avatarURL: client.user.avatarURL(),
            embeds: [embed],
            files: [{
                name: 'bulkDeletedMessages.log',
                attachment: Buffer.from(
`\
${relevantMessages.reverse().map(e => `\
${channelLanguage.get('delmsgEmbedAuthorTitle')}: ${e.author.tag} (${e.author.id})
${channelLanguage.get('delmsgEmbedSentTitle')}: ${e.createdAt.toUTCString()}${e.content ? `
================================================
${e.content}
================================================\
` : ''}${[...e.attachments.values()].map((ee, i) => `\nAttachment-${i + 1}-${ee.height ? `Media: ${ee.proxyURL}` : `File: ${ee.url}`}`).join('')}\
`).join('\n\n')}\
`
                ),
            }],
        });
    },
};