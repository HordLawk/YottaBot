const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');

module.exports = {
    name: 'messageDeleteBulk',
    execute: async messages => {
        const {guild, client} = messages.first();
        if(!guild || !guild.available || !client.guildData.get(guild.id)?.actionlogs.id('prune') || (!client.guildData.get(guild.id)?.actionlogs.id('prune').hookID && !client.guildData.get(guild.id)?.defaultLogsHookID)) return;
        let relevantMessages = messages.filter(e => (!e.partial && !e.author.bot && !e.system));
        if(!relevantMessages.size) return;
        const channelLanguage = client.langs[client.guildData.get(guild.id).language];
        var executor = null;
        if(guild.me.permissions.has('VIEW_AUDIT_LOG')){
            let audits = await guild.fetchAuditLogs({
                type: 'MESSAGE_BULK_DELETE',
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
        const embeds = relevantMessages.map(e => {
            const fields = [
                {
                    name: channelLanguage.get('delmsgEmbedAuthorTitle'),
                    value: e.author,
                    inline: true,
                },
                {
                    name: channelLanguage.get('delmsgEmbedChannelTitle'),
                    value: e.channel,
                    inline: true,
                },
            ];
            if(executor){
                fields.push({
                    name: '\u200B',
                    value: '\u200B',
                    inline: true,
                });
                fields.push({
                    name: channelLanguage.get('delmsgEmbedExecutorTitle'),
                    value: executor,
                    inline: true,
                })
            }
            fields.push({
                name: channelLanguage.get('delmsgEmbedSentTitle'),
                value: channelLanguage.get('delmsgEmbedSentValue', [Math.floor(e.createdTimestamp / 1000)]),
                inline: true,
            })
            if(executor) fields.push({
                name: '\u200B',
                value: '\u200B',
                inline: true,
            });
            if(e.attachments.size) fields.push({
                name: channelLanguage.get('delmsgEmbedAttachmentsTitle'),
                value: e.attachments.array().map((ee, i) => ee.height ? channelLanguage.get('delmsgEmbedAttachmentsMedia', [(i + 1), ee.url.replace('cdn', 'media').replace('com', 'net')]) : channelLanguage.get('delmsgEmbedAttachmentsFile', [(i + 1), ee.url])).join('\n').concat('\n').slice(0, 1024).split(/\n/g).slice(0, -1).join('\n'),
            });
            return {
                color: 0xff0000,
                author: {
                    name: channelLanguage.get('delmsgEmbedAuthor'),
                    icon_url: e.author.displayAvatarURL({dynamic: true}),
                    url: e.url,
                },
                description: e.content,
                footer: {text: e.author.id},
                timestamp: e.createdAt,
                fields,
            };
        }).reverse();
        for(let i = 0; i < (relevantMessages.size / 10); i++){
            await hook.send({
                username: client.user.username,
                avatarURL: client.user.avatarURL({size: 4096}),
                embeds: embeds.slice(i * 10, (i * 10) + 10),
            });
        }
    }
}