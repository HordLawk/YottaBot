const guild = require('../../schemas/guild.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'configs',
    description: lang => lang.get('configsDescription'),
    aliases: ['config', 'settings', 'setting'],
    usage: lang => [lang.get('configsUsage0'), lang.get('configsUsage1'), lang.get('configsUsage2'), 'logattachments <on/off>', lang.get('configsUsage3'), lang.get('configsUsage4'), 'beta <on/off>'],
    example: ['prefix !', 'language pt', 'logattachments on', 'mod logs #warn-and-mute-logs warn mute'],
    cooldown: 5,
    categoryID: 2,
    args: true,
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        switch(args[0]){
            case 'prefix': {
                if(!args[1]) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                if(args[1].length > 10) return message.reply(channelLanguage.get('longPrefix'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {prefix: args[1]}});
                message.client.guildData.get(message.guild.id).prefix = args[1];
                message.reply(channelLanguage.get('newPrefix'));
            }
            break;
            case 'language': {
                if(!message.client.langs[args[1]]) return message.reply(channelLanguage.get('lang404'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {language: args[1]}});
                message.client.guildData.get(message.guild.id).language = args[1];
                message.reply(message.client.langs[message.client.guildData.get(message.guild.id).language].get('newLang'));
            }
            break;
            case 'logattachments': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('logattachmentsBadArgs'));
                if(args[1] === 'on'){
                    if(!message.client.guildData.get(message.guild.id).actionlogs.id('delmsg')) return message.reply(channelLanguage.get('logattachmentsNoHook'));
                    let hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID || message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookToken || message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                    if(!hook) return message.reply(channelLanguage.get('logattachmentsNoHook'));
                    if(!message.guild.channels.cache.get(hook.channelId).nsfw) return message.reply(channelLanguage.get('logattachmentsNoNSFW'));
                    await guild.findByIdAndUpdate(message.guild.id, {$set: {logAttachments: true}});
                    message.client.guildData.get(message.guild.id).logAttachments = true;
                    message.reply(channelLanguage.get('logattachmentsOnSuccess'));
                }
                else{
                    await guild.findByIdAndUpdate(message.guild.id, {$set: {logAttachments: false}});
                    message.client.guildData.get(message.guild.id).logAttachments = false;
                    message.reply(channelLanguage.get('logattachmentsOffSuccess'));
                }
            }
            break;
            case 'mod': {
                switch(args[1]){
                    case 'logs': {
                        if(!args[3] || args.slice(3, 7).some(e => !['warn', 'mute', 'kick', 'ban'].includes(e))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        let discordChannel = message.guild.channels.cache.get(args[2].match(/^(?:<#)?(\d{17,19})>?$/)?.[1]);
                        if(!discordChannel || !discordChannel.isText()) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.viewable) return message.reply(channelLanguage.get('sendMessages'));
                        if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
                        let guildDoc = await guild.findById(message.guild.id);
                        args.slice(3, 7).forEach(e => (guildDoc.modlogs[e] = discordChannel.id));
                        await guildDoc.save();
                        message.client.guildData.get(message.guild.id).modlogs = guildDoc.modlogs;
                        message.reply(channelLanguage.get('modLogsSetSuccess', [args.slice(3, 7), discordChannel]));
                    }
                    break;
                    case 'clearonban': {
                        if(isNaN(parseInt(args[2], 10)) || !isFinite(parseInt(args[2], 10)) || (parseInt(args[2], 10) < 0) || (parseInt(args[2], 10) > 7)) return message.reply(channelLanguage.get('invClearOnBanDays'));
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {pruneBan: parseInt(args[2], 10)}});
                        message.client.guildData.get(message.guild.id).pruneBan = parseInt(args[2], 10);
                        message.reply(channelLanguage.get('clearOnBanDaysSetSuccess', [message.client.guildData.get(message.guild.id).pruneBan]));
                    }
                    break;
                    // case 'mute': {
                    //     switch(args[2]){
                    //         case 'role': {
                    //             if(!args[3]) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                    //             let roleName = message.content.toLowerCase().replace(/^(?:\S+\s+){4}/, '');
                    //             let discordRole = message.guild.roles.cache.get(args[3].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                    //             if(!discordRole || (discordRole.id === message.guild.id)) return message.reply(channelLanguage.get('invRole'));
                    //             if(!discordRole.editable || discordRole.managed) return message.reply(channelLanguage.get('manageRole'));
                    //             await guild.findByIdAndUpdate(message.guild.id, {$set: {muteRoleID: discordRole.id}});
                    //             message.client.guildData.get(message.guild.id).muteRoleID = discordRole.id;
                    //             message.reply(channelLanguage.get('muteRoleSetSuccess', [discordRole.name]));
                    //         }
                    //         break;
                    //         case 'autosetup': {
                    //             if(!['on', 'off'].includes(args[3])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                    //             await guild.findByIdAndUpdate(message.guild.id, {$set: {autoSetupMute: (args[3] === 'on')}});
                    //             message.client.guildData.get(message.guild.id).autoSetupMute = (args[3] === 'on');
                    //             message.reply(channelLanguage.get('autoSetupMuteSetSuccess', [args[3]]));
                    //         }
                    //         break;
                    //         default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                    //     }
                    // }
                    // break;
                    default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                }
            }
            break;
            case 'beta': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {beta: (message.client.guildData.get(message.guild.id).beta = (args[1] === 'on'))}});
                message.reply(channelLanguage.get('betaSuccess', [args[1]]));
            }
            break;
            case 'view': {
                if(!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('configsEmbedAuthor'),
                        iconURL: message.guild.iconURL({
                            size: 4096,
                            dynamic: true,
                        }),
                    })
                    .setDescription(channelLanguage.get('configsEmbedDesc', [message.client.guildData.get(message.guild.id).prefix, message.client.guildData.get(message.guild.id).language, message.client.guildData.get(message.guild.id).logAttachments, message.client.guildData.get(message.guild.id).modlogs, message.client.guildData.get(message.guild.id).pruneBan, message.client.guildData.get(message.guild.id).beta]))
                    .setTimestamp();
                message.reply({embeds: [embed]});
            }
            break;
            default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        }
    },
};