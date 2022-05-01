const channelModel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const {Permissions, GuildAuditLogs, MessageEmbed} = require('discord.js');

module.exports = {
    name: 'messageDeleteBulk',
    execute: async messages => {
        const {guild, client, channel} = messages.first();
        if(!guild || !guild.available || !client.guildData.get(guild.id)?.actionlogs.id('prune') || (!client.guildData.get(guild.id)?.actionlogs.id('prune').hookID && !client.guildData.get(guild.id)?.defaultLogsHookID) || !guild.me.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG)) return;
        const relevantMessages = messages.filter(e => (!e.partial && !e.author.bot && !e.system));
        if(!relevantMessages.size) return;
        const channelLanguage = client.langs[client.guildData.get(guild.id).language];
        const audits = await guild.fetchAuditLogs({limit: 1});
        const executor = (() => {
            if(audits.entries.size && ['MESSAGE_BULK_DELETE', 'MEMBER_BAN_ADD'].includes(audits.entries.first().action)) return audits.entries.first().executor;
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
        const embed = new MessageEmbed()
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
                attachment: Buffer.from(`\
${relevantMessages.reverse().map(e => `\
${channelLanguage.get('delmsgEmbedAuthorTitle')}: ${e.author.tag} (${e.author.id})
${channelLanguage.get('delmsgEmbedSentTitle')}: ${e.createdAt.toUTCString()}${e.content ? `
================================================
${e.content}
================================================\
` : ''}${[...e.attachments.values()].map((ee, i) => `\nAttachment-${i + 1}-${ee.height ? `Media: ${ee.proxyURL}` : `File: ${ee.url}`}`).join('')}\
`).join('\n\n')}\
                `),
            }],
        });
    },
};