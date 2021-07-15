const channel = require('../../schemas/channel.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'disable',
    description: lang => lang.get('disableDescription'),
    aliases: ['enable', 'toggle', 'switch'],
    usage: lang => [lang.get('disableUsage0'), lang.get('disableUsage1')],
    example: ['#general on ping help xp', '#general view'],
    cooldown: 5,
    categoryID: 2,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(channelLanguage.get('botEmbed'));
        if(args.length < 2) return message.channel.send(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        const discordChannel = message.guild.channels.cache.get((args[0].match(/<#(\d{17,19})>/) || [])[1]) || message.guild.channels.cache.get(args[0]);
        if(!discordChannel || !discordChannel.isText()) return message.channel.send(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        switch(args[1]){
            case 'on':
            case 'off': {
                if(!args[2]) return message.channel.send(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                let channelDoc = await channel.findById(discordChannel.id) || new channel({
                    _id: discordChannel.id,
                    guild: message.guild.id,
                });
                if(args[2] === 'all'){
                    channelDoc.ignoreCommands = (args[1] === 'on') ? message.client.commands.map(e => e.name) : [];
                    message.channel.send(channelLanguage.get('disableAll', [args[1], discordChannel]));
                }
                else{
                    args.slice(2).forEach(e => {
                        const command = message.client.commands.get(e) || message.client.commands.find(cmd => (cmd.aliases && cmd.aliases.includes(e)));
                        if(!command || (((args[1] === 'on') && channelDoc.ignoreCommands.includes(command.name)) || ((args[1] === 'off') && !channelDoc.ignoreCommands.includes(command.name)))) return;
                        if(args[1] === 'on') return channelDoc.ignoreCommands.push(command.name);
                        channelDoc.ignoreCommands.splice(channelDoc.ignoreCommands.indexOf(command.name), 1);
                    });
                    message.channel.send(channelLanguage.get('disableSome', [args[1], discordChannel]));
                }
                channelDoc.save();
            }
            break;
            case 'view':{
                let channelDoc = await channel.findById(discordChannel.id);
                if(!channelDoc || !channelDoc.ignoreCommands.length) return message.channel.send(channelLanguage.get('noDisabledCmds'));
                const embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor(channelLanguage.get('disabledEmbedAuthor'), message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }))
                    .setDescription(channelLanguage.get('disabledEmbedDesc', [discordChannel]))
                    .setTimestamp()
                    .addField(channelLanguage.get('disabledField'), channelDoc.ignoreCommands.map(e => `\`${e}\``).join(' '));
                message.channel.send(embed);
            }
            break;
            default: message.channel.send(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        }
    },
};