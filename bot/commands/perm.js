const role = require('../../schemas/role.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'perm',
    description: lang => lang.get('permDescription'),
    aliases: ['perms', 'allow', 'deny'],
    usage: lang => [lang.get('permUsage0'), lang.get('permUsage1')],
    example: ['allow Mods warn mute kick ban', 'view Admins'],
    cooldown: 5,
    categoryID: 2,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    execute: async function(message){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
        const args = message.content.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g).slice(1);
        if(args.length < 2) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        const discordRole = message.guild.roles.cache.get((args[1].match(/<@&(\d{17,19})>/) || [])[1]) || message.guild.roles.cache.get(args[1]) || message.guild.roles.cache.find(e => (e.name === args[1].replace(/"/g, ''))) || message.guild.roles.cache.find(e => (e.name.startsWith(args[1].replace(/"/g, ''))));
        if(!discordRole) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        switch(args[0]){
            case 'allow':
            case 'deny': {
                if(!args[2]) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                let roleDoc = await role.findOne({
                    guild: message.guild.id,
                    roleID: discordRole.id,
                }) || new role({
                    guild: message.guild.id,
                    roleID: discordRole.id,
                });
                args.slice(2).forEach(e => {
                    const command = message.client.commands.get(e) || message.client.commands.find(cmd => (cmd.aliases && cmd.aliases.includes(e)));
                    if(!command) return;
                    if(!roleDoc.commandPermissions.id(command.name)) return roleDoc.commandPermissions.push({
                        _id: command.name,
                        allow: (args[0] === 'allow'),
                    });
                    roleDoc.commandPermissions.id(command.name).allow = (args[0] === 'allow');
                });
                await roleDoc.save();
                message.channel.send(message.client.langs[channelLanguage].get('permSuccess', [discordRole.name, args[0]]));
            }
            break;
            case 'default': {
                if(!args[2]) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                let roleDoc = await role.findOne({
                    guild: message.guild.id,
                    roleID: discordRole.id,
                    commandPermissions: {$ne: []},
                });
                if(!roleDoc) return message.channel.send(message.client.langs[channelLanguage].get('noSpecialPerms'));
                args.slice(2).forEach(e => {
                    const command = message.client.commands.get(e) || message.client.commands.find(cmd => (cmd.aliases && cmd.aliases.includes(e)));
                    if(!command) return;
                    const item = roleDoc.commandPermissions.id(command.name);
                    if(!item) return;
                    item.remove();
                });
                await roleDoc.save();
                message.channel.send(message.client.langs[channelLanguage].get('defaultPermsSuccess', [discordRole.name]));
            }
            break;
            case 'view': {
                let roleDoc = await role.findOne({
                    guild: message.guild.id,
                    roleID: discordRole.id,
                    commandPermissions: {$ne: []},
                });
                if(!roleDoc) return message.channel.send(message.client.langs[channelLanguage].get('noSpecialPerms'));
                const embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor(message.client.langs[channelLanguage].get('permsEmbedAuthor'), message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }))
                    .setDescription(message.client.langs[channelLanguage].get('permsEmbedDesc', [discordRole]))
                    .setTimestamp();
                const allowed = roleDoc.commandPermissions.filter(e => e.allow);
                if(allowed.length) embed.addField(message.client.langs[channelLanguage].get('permsAllowed'), allowed.map(e => `\`${e._id}\``).join(' '));
                const denied = roleDoc.commandPermissions.filter(e => !e.allow);
                if(denied.length) embed.addField(message.client.langs[channelLanguage].get('permsDenied'), denied.map(e => `\`${e._id}\``).join(' '));
                message.channel.send(embed);
            }
            break;
            default: message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        }
    },
};