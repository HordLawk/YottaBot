const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    name: 'messageDelete',
    execute: async message => {
        if(message.partial || !message.guild || !message.guild.available || message.system || !message.client.guildData.has(message.guild.id) || !message.client.guildData.get(message.guild.id).actionlogs.id('delmsg') || (!message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID && !message.client.guildData.get(message.guild.id).defaultLogsHookID)) return;
        const channelLanguage = message.client.guildData.get(message.guild.id).language;
        var executor = null;
        if(message.guild.me.permissions.has('VIEW_AUDIT_LOG')){
            let audits = await message.guild.fetchAuditLogs({type: 'MESSAGE_DELETE', limit: 1});
            if(audits.entries.first()){
                if(message.client.lastdelmsg.has(message.guild.id) && ((audits.entries.first().extra.count != message.client.lastdelmsg.get(message.guild.id).count) || (audits.entries.first().id != message.client.lastdelmsg.get(message.guild.id).id))) executor = audits.entries.first().executor;
                message.client.lastdelmsg.set(message.guild.id, {
                    count: audits.entries.first().extra.count,
                    id: audits.entries.first().id,
                });
            }
        }
        if(message.author.bot) return;
        const channelDoc = await channel.findById(message.channel.id);
        if(channelDoc && channelDoc.ignoreActions.includes('delmsg')) return;
        const memb = message.guild.members.cache.get(message.author.id) || await message.guild.members.fetch(message.author.id).catch(() => null);
        if(memb){
            let roleDoc = await role.findOne({
                guild: message.guild.id,
                roleID: {$in: memb.roles.cache.map(e => e.id)},
                ignoreActions: 'delmsg',
            });
            if(roleDoc) return;
        }
        const hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID || message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookToken || message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
        if(!hook) return;
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setFooter(message.author.id)
            .setTimestamp()
            .setAuthor(message.client.langs[channelLanguage].get('delmsgEmbedAuthor'), message.author.displayAvatarURL({
                size: 4096,
                dynamic: true,
            }), message.url)
            .setDescription(message.content)
            .addField(message.client.langs[channelLanguage].get('delmsgEmbedAuthorTitle'), message.author, true)
            .addField(message.client.langs[channelLanguage].get('delmsgEmbedChannelTitle'), message.channel, true);
        if(executor) embed.addField('\u200B', '\u200B', true).addField(message.client.langs[channelLanguage].get('delmsgEmbedExecutorTitle'), executor, true);
        embed.addField(message.client.langs[channelLanguage].get('delmsgEmbedSentTitle'), message.client.langs[channelLanguage].get('delmsgEmbedSentValue', [Math.floor(message.createdTimestamp / 1000)]), true);
        if(executor) embed.addField('\u200B', '\u200B', true);
        var files = [];
        if(message.attachments.size){
            if(message.client.guildData.get(message.guild.id).logAttachments && message.guild.channels.cache.get(hook.channelID).nsfw){
                files = message.attachments.map(e => ({name: e.name, attachment: e.url}));
            }
            else{
                embed.addField(message.client.langs[channelLanguage].get('delmsgEmbedAttachmentsTitle'), message.attachments.array().map((e, i) => e.height ? message.client.langs[channelLanguage].get('delmsgEmbedAttachmentsMedia', [(i + 1), e.url.replace('cdn', 'media').replace('com', 'net')]) : message.client.langs[channelLanguage].get('delmsgEmbedAttachmentsFile', [(i + 1), e.url])).join('\n').concat('\n').slice(0, 1024).split(/\n/g).slice(0, -1).join('\n'));
            }
        }
        hook.send({
            embeds: [embed.toJSON()],
            username: message.client.user.username,
            avatarURL: message.client.user.avatarURL({size: 4096}),
            files: files,
        });
    },
};