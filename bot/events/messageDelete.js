const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    name: 'messageDelete',
    execute: async message => {
        if(message.partial || !message.guild || !message.guild.available || message.system || message.author.bot || !message.client.guildData.has(message.guild.id) || !message.client.guildData.get(message.guild.id).actionlogs.id('delmsg') || (!message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID && !message.client.guildData.get(message.guild.id).defaultLogsHookID)) return;
        var executor = '';
        if(message.guild.me.permissions.has('VIEW_AUDIT_LOG')){
            let audits = await message.guild.fetchAuditLogs({type: 'MESSAGE_DELETE', limit: 1});
            if(audits.entries.first()){
                if(!message.client.lastdelmsg.has(message.guild.id)){
                    message.client.lastdelmsg.set(message.guild.id, {
                        count: audits.entries.first().extra.count,
                        id: audits.entries.first().id,
                    });
                }
                else{
                    if((audits.entries.first().extra.count != message.client.lastdelmsg.get(message.guild.id).count) || (audits.entries.first().id != message.client.lastdelmsg.get(message.guild.id).id)) executor = `\nExecutor: ${audits.entries.first().executor}`;
                }
            }
        }
        const channelDoc = await channel.findById(message.channel.id);
        if(channelDoc && chanenlDoc.ignoreActions.includes('delmsg')) return;
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
        // const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').chanenlID || message.client.guildData.get(message.guild.id).defaultLogs);
        if(!hook) return;
        // if(!discordChannel || !message.guild.me.permissionsIn(discordChannel).has('SEND_MESSAGES') || !message.guild.me.permissionsIn(discordChannel).has('EMBED_LINKS') || !message.guild.me.permissionsIn(discordChannel).has('MANAGE_WEBHOOKS')) return;
        const embed = new MessageEmbed()
            .setColor(message.guild.me.displayColor || 0xff0000)
            .setFooter(`${message.author.id} | Original message sent:`)
            .setTimestamp(message.createdAt)
            .setAuthor('Deleted message', message.author.displayAvatarURL({
                size: 4096,
                dynamic: true,
            }))
            .setDescription(`Author: ${message.author}\nChannel: ${message.channel}${executor}`);
        if(message.content) embed.addField('Content', `${message.content.slice(0, (message.content.length > 1024) ? 1021 : undefined)}${(message.content.length > 1024) ? '...' : ''}`);
        var files = [];
        if(message.attachments.size){
            if(message.client.guildData.get(message.guild.id).logAttachments && message.guild.channels.cache.get(hook.channelID).nsfw){
                files = message.attachments.map(e => ({name: e.name, attachment: e.url}));
            }
            else{
                embed.addField('Attachments', message.attachments.array().map((e, i) => e.height ? `**[Attachment-${i + 1}-Image](${e.url.replace('cdn', 'media').replace('com', 'net')})**` : `**[Attachment-${i + 1}-File](${e.url})**`).join('\n').concat('\n').slice(0, 1024).split(/\n/g).slice(0, -1).join('\n'), true);
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