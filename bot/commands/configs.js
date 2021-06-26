const guild = require('../../schemas/guild.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'configs',
    description: lang => lang.get('configsDescription'),
    aliases: ['config', 'settings', 'setting'],
    usage: lang => [lang.get('configsUsage0'), lang.get('configsUsage1'), lang.get('configsUsage2'), 'logattachments <on/off>', 'mod logs (channel) <warn/mute/kick/ban> [(other types)]', 'mod clearonban (days)', 'mod mute role (role)', 'mod mute autosetup <on/off>'],
    example: ['prefix !', 'language pt', 'logattachments on', 'mod logs #warn-and-mute-logs warn mute', 'mod mute role @Muted', 'mod mute autosetup off'],
    cooldown: 5,
    categoryID: 0,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    execute: async function(message, args){
        var channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        switch(args[0]){
            case 'prefix': {
                if(args[1].length > 10) return message.channel.send(message.client.langs[channelLanguage].get('longPrefix'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {prefix: args[1]}});
                message.client.guildData.get(message.guild.id).prefix = args[1];
                message.channel.send(message.client.langs[channelLanguage].get('newPrefix'));
            }
            break;
            case 'language': {
                if(!message.client.langs[args[1]]) return message.channel.send(message.client.langs[channelLanguage].get('lang404'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {language: args[1]}});
                message.client.guildData.get(message.guild.id).language = args[1];
                channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
                message.channel.send(message.client.langs[channelLanguage].get('newLang'));
            }
            break;
            case 'logattachments': {
                if(!['on', 'off'].includes(args[1])) return message.channel.send(message.client.langs[channelLanguage].get('logattachmentsBadArgs'));
                if(args[1] === 'on'){
                    if(!message.client.guildData.get(message.guild.id).actionlogs.id('delmsg')) return message.channel.send(message.client.langs[channelLanguage].get('logattachmentsNoHook'));
                    let hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID || message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookToken || message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                    if(!hook) return message.channel.send(message.client.langs[channelLanguage].get('logattachmentsNoHook'));
                    if(!message.guild.channels.cache.get(hook.channelID).nsfw) return message.channel.send(message.client.langs[channelLanguage].get('logattachmentsNoNSFW'));
                    await guild.findByIdAndUpdate(message.guild.id, {$set: {logAttachments: true}});
                    message.client.guildData.get(message.guild.id).logAttachments = true;
                    message.channel.send(message.client.langs[channelLanguage].get('logattachmentsOnSuccess'));
                }
                else{
                    await guild.findByIdAndUpdate(message.guild.id, {$set: {logAttachments: false}});
                    message.client.guildData.get(message.guild.id).logAttachments = false;
                    message.channel.send(message.client.langs[channelLanguage].get('logattachmentsOffSuccess'));
                }
            }
            break;
            case 'mod': {
                switch(args[1]){
                    case 'logs': {
                        if(!args[3] || args.slice(3, 7).some(e => !['warn', 'mute', 'kick', 'ban'].includes(e))) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        let discordChannel = message.guild.channels.cache.get(args[2].match(/^(?:<#)?(\d{17,19})>?$/)?.[1]);
                        if(!discordChannel || !discordChannel.isText()) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        if(!message.guild.me.permissionsIn(discordChannel).has('SEND_MESSAGES')) return message.channel.send(message.client.langs[channelLanguage].get('sendMessages'));
                        if(!message.guild.me.permissionsIn(discordChannel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
                        let guildDoc = await guild.findById(message.guild.id);
                        args.slice(3, 7).forEach(e => (guildDoc.modlogs[e] = discordChannel.id));
                        await guildDoc.save();
                        message.client.guildData.get(message.guild.id).modlogs = guildDoc.modlogs;
                        message.channel.send(`Log channel for ${args.slice(3, 7).map(e => `\`${e}\``).join(' ')} set to ${discordChannel}`);
                    }
                    break;
                    case 'clearonban': {
                        if(isNaN(parseInt(args[2], 10)) || !isFinite(parseInt(args[2], 10)) || (parseInt(args[2], 10) < 0) || (parseInt(args[2], 10) > 7)) return message.channel.send('Number of days must be between 0 and 7');
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {pruneBan: parseInt(args[2], 10)}});
                        message.client.guildData.get(message.guild.id).pruneBan = parseInt(args[2], 10);
                        message.channel.send(`Number of days of messages to delete set to **${message.client.guildData.get(message.guild.id).pruneBan}**`);
                    }
                    break;
                    case 'mute': {
                        switch(args[2]){
                            case 'role': {
                                let discordRole = message.guild.roles.cache.get(args[3]);
                                if(!discordRole) return message.channel.send('Role not found');
                                if(!discordRole.editable || discordRole.managed) return message.channel.send('I can\'t manage this role');
                                await guild.findByIdAndUpdate(message.guild.id, {$set: {muteRoleID: discordRole.id}});
                                message.client.guildData.get(message.guild.id).muteRoleID = discordRole.id;
                                message.channel.send(`Mute role set to **${discordRole.name}**`);
                            }
                            break;
                            case 'autosetup': {
                                if(!['on', 'off'].includes(args[3])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                                await guild.findByIdAndUpdate(message.guild.id, {$set: {autoSetupMute: (args[3] === 'on')}});
                                message.client.guildData.get(message.guild.id).autoSetupMute = (args[3] === 'on');
                                message.channel.send(`Auto setup mute mode turned **${args[3]}**`);
                            }
                            break;
                            default: message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        }
                    }
                    break;
                    default: message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                }
            }
            break;
            case 'view': {
                if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor(message.client.langs[channelLanguage].get('configsEmbedAuthor'), message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }))
                    .setDescription(message.client.langs[channelLanguage].get('configsEmbedDesc', [message.client.guildData.get(message.guild.id).prefix, message.client.guildData.get(message.guild.id).language, message.client.guildData.get(message.guild.id).logAttachments, message.client.guildData.get(message.guild.id).modlogs, message.client.guildData.get(message.guild.id).pruneBan, message.client.guildData.get(message.guild.id).muteRoleID, message.client.guildData.get(message.guild.id).autoSetupMute]))
                    .setTimestamp();
                message.channel.send(embed);
            }
            break;
            default: message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        }
    },
};