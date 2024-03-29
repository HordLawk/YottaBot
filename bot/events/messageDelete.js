const {EmbedBuilder, PermissionsBitField, StickerFormatType, AuditLogEvent} = require('discord.js');
const locale = require('../../locale');

module.exports = {
    name: 'messageDelete',
    execute: async message => {
        if(!message.guild || !message.client.guildData.has(message.guild.id)) return;
        const edition = require('../../schemas/edition.js');
        await edition.deleteMany({messageID: message.id});
        if(message.partial || !message.guild.available || !message.client.guildData.get(message.guild.id).actionlogs.id('delmsg') || (!message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID && !message.client.guildData.get(message.guild.id).defaultLogsHookID)) return;
        const channelLanguage = locale.get(message.client.guildData.get(message.guild.id).language);
        let executor = null;
        if(message.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)){
            const audits = await message.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 1,
            });
            if(audits.entries.first()){
                if(message.client.lastdelmsg.has(message.guild.id) && (audits.entries.first().target?.id === message.author.id) && ((audits.entries.first().extra.count !== message.client.lastdelmsg.get(message.guild.id).count) || (audits.entries.first().id !== message.client.lastdelmsg.get(message.guild.id).id))) executor = audits.entries.first().executor;
                message.client.lastdelmsg.set(message.guild.id, {
                    count: audits.entries.first().extra.count,
                    id: audits.entries.first().id,
                });
            }
        }
        if(message.author.bot || message.system) return;
        const channel = require('../../schemas/channel.js');
        const channelDoc = await channel.findById(message.channel.id);
        if(channelDoc && channelDoc.ignoreActions.includes('delmsg')) return;
        const memb = executor ? await message.guild.members.fetch(executor.id).catch(() => null) : message.member;
        if(memb){
            const role = require('../../schemas/role.js');
            let roleDoc = await role.findOne({
                guild: message.guild.id,
                roleID: {$in: memb.roles.cache.map(e => e.id)},
                ignoreActions: 'delmsg',
            });
            if(roleDoc) return;
        }
        const hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID || message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookToken || message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
        if(!hook) return;
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setFooter({text: message.author.id})
            .setTimestamp()
            .setAuthor({
                name: channelLanguage.get('delmsgEmbedAuthor'),
                iconURL: message.author.displayAvatarURL({
                    size: 4096,
                    dynamic: true,
                }),
                url: message.url,
            })
            .setDescription(message.content || null)
            .addField(channelLanguage.get('delmsgEmbedAuthorTitle'), message.author.toString(), true)
            .addField(channelLanguage.get('delmsgEmbedChannelTitle'), message.channel.toString(), true);
        if(executor) embed.addField('\u200B', '\u200B', true).addField(channelLanguage.get('delmsgEmbedExecutorTitle'), executor.toString(), true);
        embed.addField(channelLanguage.get('delmsgEmbedSentTitle'), channelLanguage.get('delmsgEmbedSentValue', [Math.floor(message.createdTimestamp / 1000)]), true);
        if(executor) embed.addField('\u200B', '\u200B', true);
        if(message.stickers.size){
            if(message.stickers.first().format === StickerFormatType.Lottie){
                embed.addField(channelLanguage.get('delmsgEmbedStickerTitle'), `[${message.stickers.first().name}](${message.stickers.first().url})`);
            }
            else{
                embed.setThumbnail(message.stickers.first().url);
            }
        }
        var files = [];
        if(message.attachments.size){
            if(
                message.client.guildData.get(message.guild.id).logAttachments
                &&
                (message.attachments.reduce((acc, attach) => acc + attach.size, 0) <= (8 * 1024 * 1024))
            ){
                files = message.attachments.map(e => ({name: e.name, attachment: e.url}));
            }
            else{
                embed.addField(channelLanguage.get('delmsgEmbedAttachmentsTitle'), [...message.attachments.values()].map((e, i) => e.height ? channelLanguage.get('delmsgEmbedAttachmentsMedia', [(i + 1), e.url.replace('cdn', 'media').replace('com', 'net')]) : channelLanguage.get('delmsgEmbedAttachmentsFile', [(i + 1), e.url])).join('\n').concat('\n').slice(0, 1024).split(/\n/g).slice(0, -1).join('\n'));
            }
        }
        await hook.send({
            embeds: [embed],
            username: message.client.user.username,
            avatarURL: message.client.user.avatarURL({size: 4096}),
            files: files,
        });
    },
};