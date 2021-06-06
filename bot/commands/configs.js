const guild = require('../../schemas/guild.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'configs',
    description: lang => lang.get('configsDescription'),
    aliases: ['config', 'settings', 'setting'],
    usage: lang => [lang.get('configsUsage0'), lang.get('configsUsage1'), lang.get('configsUsage2'), 'logattachments <on/off>'],
    example: ['prefix !', 'language pt', 'logattachments on'],
    cooldown: 5,
    categoryID: 0,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    execute: async function(message, args){
        var channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        switch(args[0]){
            case 'prefix':
                if(args[1].length > 10) return message.channel.send(message.client.langs[channelLanguage].get('longPrefix'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {prefix: args[1]}});
                message.client.guildData.get(message.guild.id).prefix = args[1];
                message.channel.send(message.client.langs[channelLanguage].get('newPrefix'));
                break;
            case 'language':
                if(!message.client.langs[args[1]]) return message.channel.send(message.client.langs[channelLanguage].get('lang404'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {language: args[1]}});
                message.client.guildData.get(message.guild.id).language = args[1];
                channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
                message.channel.send(message.client.langs[channelLanguage].get('newLang'));
                break;
            case 'logattachments':
                if(!['on', 'off'].includes(args[1])) return message.channel.send('Choose to turn this setting `on` or `off`');
                if(args[1] === 'on'){
                    let hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID || message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookToken || message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                    if(!hook) return message.channel.send('Choose a channel to log deleted messages first');
                    if(!message.guild.channels.cache.get(hook.channelID).nsfw) return message.channel.send('To use this settings your deleted messages log channel needs to be set to NSFW');
                    await guild.findByIdAndUpdate(message.guild.id, {$set: {logAttachments: true}});
                    message.client.guildData.get(message.guild.id).logAttachments = true;
                    message.channel.send('Attachments will be logged');
                }
                else{
                    await guild.findByIdAndUpdate(message.guild.id, {$set: {logAttachments: false}});
                    message.client.guildData.get(message.guild.id).logAttachments = false;
                    message.channel.send('Attachments will not be logged');
                }
                break;
            case 'view':
                if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor(message.client.langs[channelLanguage].get('configsEmbedAuthor'), message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }))
                    .setDescription(message.client.langs[channelLanguage].get('configsEmbedDesc', [message.client.guildData.get(message.guild.id).prefix, message.client.guildData.get(message.guild.id).language, message.client.guildData.get(message.guild.id).logAttachments]))
                    .setTimestamp();
                message.channel.send(embed);
                break;
            default:
                message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                break;
        }
    },
};