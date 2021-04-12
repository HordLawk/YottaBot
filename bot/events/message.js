const guild = require('../../schemas/guild.js');
const {Collection} = require('discord.js');
module.exports = {
    name: 'message',
    execute: message => {
        if(message.author.bot || ((message.channel.type != 'dm') && !message.guild.me.permissionsIn(message.channel).has('SEND_MESSAGES'))) return;
        let prefix = message.client.configs.defaultPrefix;
        if(message.channel.type != 'dm'){
            if(!message.client.guildData.has(message.guild.id)){
                let guildData = new guild({
                    _id: message.guild.id,
                    language: (message.guild.region == 'brazil') ? 'pt' : 'en'
                });
                guildData.save();
                message.client.guildData.set(guildData._id, guildData);
            }
            prefix = message.client.guildData.get(message.guild.id).prefix;
        }
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(message.mentions.has(message.client.user, {
            ignoreRoles: true,
            ignoreEveryone: true,
        })) return message.channel.send(message.client.langs[channelLanguage].get('mentionHelp'));
        if(!message.content.startsWith(prefix)) return;
        const [commandName, ...args] = message.content.slice(prefix.length).toLowerCase().split(/\s+/g);
        const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => (cmd.aliases && cmd.aliases.includes(commandName)));
        if(!command || (command.dev && (message.author.id != message.client.configs.devid))) return;
        if(message.client.configs.maintenance && (message.author.id != message.client.configs.devid)) return message.channel.send(message.client.langs[channelLanguage].get('maintenance')).catch(() => null);
        if(command.guildOnly && (message.channel.type == 'dm')) return message.channel.send(message.client.langs[channelLanguage].get('guildOnly'));
        if(command.args && !args.length) return message.channel.send(message.client.langs[channelLanguage].get('noArgs', [message.author, prefix, command.name, command.usage]));
        if(!message.client.cooldowns.has(command.name)) message.client.cooldowns.set(command.name, new Collection());
        const now = Date.now();
        const timestamps = message.client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 5) * 1000;
        if(timestamps.has(message.author.id) && (message.author.id != message.client.configs.devid)){
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if(now < expirationTime){
                const timeLeft = (expirationTime - now) / 1000;
                return message.channel.send(message.client.langs[channelLanguage].get('cooldown', [timeLeft.toFixed(1), command.name]));
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        try{
            command.execute(message, args);
        }
        catch(error){
            console.error(error);
            message.channel.send(message.client.langs[channelLanguage].get('error', [command.name]));
            message.client.channels.get(message.client.configs.errorlog).send(`Error: *${error.message}*\nMessage Author: ${message.author}\nMessage Content: *${message.content.replace(/\u002A/g, '\\*').slice(0, Math.floor(2000 - (60 + error.message.length + message.url.length + message.author.toString().length)))}*\nMessage URL: ${message.url}`).catch(console.error);
        }
    },
};