const guild = require('../../schemas/guild.js');
const channel = require('../../schemas/channel.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'voicexp',
    description: lang => lang.get('voicexpDescription'),
    aliases: ['vcxp'],
    usage: lang => [lang.get('voicexpUsage0'), 'disable', lang.get('voicexpUsage1'), 'view'],
    example: ['enable 10', 'ignore channel add #!AFK'],
    cooldown: 5,
    categoryID: 4,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    premium: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        switch(args[0]){
            case 'enable': {
                if(isNaN(parseInt(args[1], 10)) || !isFinite(parseInt(args[1], 10)) || (parseInt(args[1], 10) < 1) || (parseInt(args[1], 10) > 59)) return message.channel.send(channelLanguage.get('invCooldown'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {voiceXpCooldown: (message.client.guildData.get(message.guild.id).voiceXpCooldown = parseInt(args[1], 10))}});
                message.channel.send(channelLanguage.get('voicexpEnableSuccess', [message.client.guildData.get(message.guild.id).voiceXpCooldown]));
            }
            break;
            case 'disable': {
                await guild.findByIdAndUpdate(message.guild.id, {$unset: {voiceXpCooldown: (message.client.guildData.get(message.guild.id).voiceXpCooldown = null)}});
                message.channel.send(channelLanguage.get('voicexpDisableSuccess'));
            }
            break;
            case 'ignore': {
                if(!['add', 'remove'].includes(args[1])) return message.channel.send(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                let discordChannel = message.guild.channels.cache.get(args[2].match(/^(?:<#)?(\d{17,19})>?$/)?.[1]);
                if(!discordChannel || (discordChannel.type != 'GUILD_VOICE')) return message.channel.send(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                await channel.findOneAndUpdate({
                    _id: discordChannel.id,
                    guild: message.guild.id,
                }, {$set: {ignoreXp: (args[1] === 'add')}}, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                });
                message.channel.send(channelLanguage.get('xpIgnoreChannel', [args[1], discordChannel]));
            }
            break;
            case 'view': {
                if(!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.channel.send(channelLanguage.get('botEmbed'));
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor ?? 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('voiceXpEmbedAuthor'),
                        iconURL: message.guild.iconURL({dynamic: true}),
                    })
                    .setDescription(channelLanguage.get('voiceXpEmbedDesc', [message.client.guildData.get(message.guild.id).voiceXpCooldown]))
                    .setTimestamp();
                let channels = await channel.find({
                    _id: {$in: message.guild.channels.cache.filter(e => (e.type === 'GUILD_VOICE')).map(e => e.id)},
                    guild: message.guild.id,
                    ignoreXp: true,
                });
                if(channels.length) embed.addField(channelLanguage.get('voiceXpIgnoredChannels'), channels.map(e => `<#${e._id}>`).join(' '));
                message.channel.send({embeds: [embed]});
            }
            break;
            default: message.channel.send(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        }
    },
};