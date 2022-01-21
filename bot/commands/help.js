const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'help',
    description: lang => lang.get('helpDescription'),
    aliases: ['cmds', 'commands'],
    usage: lang => [lang.get('helpUsage')],
    example: ['ping'],
    cooldown: 5,
    categoryID: 1,
    execute: async (message, args) => {
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.channel.send(channelLanguage.get('botEmbed'));
        const prefix = message.guild ? message.client.guildData.get(message.guild.id).prefix : message.client.configs.defaultPrefix;
        let embed;
        if(!args.length){
            let perms = await message.client.generateInvite({
                scopes: ['bot'],
                permissions: Permissions.ALL,
            });
            embed = new MessageEmbed()
                .setColor(message.guild ? (message.guild.me.displayColor || 0x8000ff) : 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('helpEmbedTitle'),
                    iconURL: message.client.user.avatarURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(channelLanguage.get('helpEmbedDescription', [message.client.configs.support, perms, prefix, message.client.user.id]))
                .setFooter({text: channelLanguage.get('helpEmbedFooter', [message.client.commands.filter(command => !command.dev).size])})
                .setTimestamp();
            let categories = message.client.commands.filter(cmd => !cmd.dev).reduce((arr, cmd) => (arr[cmd.categoryID] = [...(arr[cmd.categoryID] || []), cmd], arr), []);
            categories.forEach((e, i) => embed.addField(channelLanguage.get(`category${i}`), e.map(cmd => `\`${cmd.name}\``).join(' ')));
            return message.channel.send({embeds: [embed]});
        }
        const name = args[0];
        const command = message.client.commands.get(name) || message.client.commands.find(c => (c.aliases && c.aliases.includes(name)));
        if(!command || command.dev) return message.channel.send(channelLanguage.get('invalidCommand'));
        embed = new MessageEmbed()
            .setColor(message.guild ? (message.guild.me.displayColor || 0x8000ff) : 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('helpCommandEmbedTitle', [command.name]),
                iconURL: message.client.user.avatarURL({
                    size: 4096,
                    dynamic: true,
                }),
            })
            .setDescription(command.description(channelLanguage))
            .setFooter({text: channelLanguage.get('helpCommandEmbedFooter')})
            .setTimestamp();
        if(command.usage) embed.addField(channelLanguage.get('syntax'), `${command.usage(channelLanguage).map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`);
        if(command.example) embed.addField(channelLanguage.get('example'), `${command.example.map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`);
        if(command.aliases) embed.addField(channelLanguage.get('aliases'), command.aliases.map(a => `\`${a}\``).join(' '));
        if(command.perm) embed.addField(channelLanguage.get('permissionLevel'), channelLanguage.get(command.perm), true);
        embed.addField('Cooldown', channelLanguage.get('helpCommandCooldown', [command.cooldown]), true);
        message.channel.send({embeds: [embed]});
    },
};