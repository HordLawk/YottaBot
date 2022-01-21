const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const {Permissions, GuildAuditLogs} = require('discord.js');

module.exports = {
    name: 'messageDeleteBulk',
    execute: async messages => {
        const {guild, client} = messages.first();
        if(!guild || !guild.available || !client.guildData.get(guild.id)?.actionlogs.id('prune') || (!client.guildData.get(guild.id)?.actionlogs.id('prune').hookID && !client.guildData.get(guild.id)?.defaultLogsHookID)) return;
        let relevantMessages = messages.filter(e => (!e.partial && !e.author.bot && !e.system));
        if(!relevantMessages.size) return;
        const channelLanguage = client.langs[client.guildData.get(guild.id).language];
        var executor = null;
        if(guild.me.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG)){
            let audits = await guild.fetchAuditLogs({
                type: GuildAuditLogs.Actions.MESSAGE_BULK_DELETE,
                limit: 1,
            });
            executor = audits.entries.first()?.executor;
        }
        const channelDoc = await channel.findById(messages.first().channel.id);
        if(channelDoc && channelDoc.ignoreActions.includes('prune')) return;
        const memb = executor && await guild.members.fetch(executor).catch(() => null);
        if(memb){
            let roleDoc = await role.findOne({
                guild: guild.id,
                roleID: {$in: memb.roles.cache.map(e => e.id)},
                ignoreActions: 'prune',
            });
            if(roleDoc) return;
        }
        const hook = await client.fetchWebhook(client.guildData.get(guild.id).actionlogs.id('prune')?.hookID ?? client.guildData.get(guild.id).defaultLogsHookID, client.guildData.get(guild.id).actionlogs.id('prune').hookToken ?? client.guildData.get(guild.id).defaultLogsHookToken).catch(() => null);
        if(!hook) return;
        hook.send({
            username: client.user.username,
            avatarURL: client.user.avatarURL(),
            files: [{
                name: 'bulkDeletedMessages.log',
                attachment: Buffer.from(relevantMessages.map(e => `${channelLanguage.get('delmsgEmbedAuthorTitle')}: ${e.author.tag} (${e.author.id})\n${channelLanguage.get('delmsgEmbedChannelTitle')}: ${e.channel.name} (${e.channel.id})${executor ? `\n${channelLanguage.get('delmsgEmbedExecutorTitle')}: ${executor.tag} (${executor.id})` : ''}\n${channelLanguage.get('delmsgEmbedSentTitle')}: ${e.createdAt.toUTCString()}${e.content ? `\n==================================================\n${e.content}\n==================================================` : ''}${[...e.attachments.values()].map((ee, i) => `\nAttachment-${i + 1}-${ee.height ? `Media: ${ee.url.replace('cdn', 'media').replace('com', 'net')}` : `File: ${ee.url}`}`).join('')}`).join('\n\n'))
            }],
        });
    }
}