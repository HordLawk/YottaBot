const {MessageEmbed, Permissions, version} = require('discord.js');

module.exports = {
    active: true,
    name: 'info',
    description: () => 'Shows detailed information about the bot',
    aliases: ['botinfo', 'about'],
    cooldown: 5,
    categoryID: 1,
    execute: async function(message){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
        const invite = await message.client.generateInvite({permissions: Permissions.ALL});
        const embed = new MessageEmbed()
            .setColor(message.guild?.me.displayColor || 0x8000ff)
            .setAuthor('YottaBot information', message.client.user.displayAvatarURL())
            .setDescription(`**[Invite me](${invite})**`)
            .setTimestamp()
            .addField('Version', process.env.npm_package_version, true)
            .addField('Engine', `Node.js ${process.version}`, true)
            .addField('Library', `discord.js v${version}`, true)
            .addField('Developer', message.client.configs.owner.tag, true)
            .addField('Last login', `<t:${Math.floor((Date.now() - message.client.uptime) / 1000)}:R>`, true)
            .addField('RAM usage', `${(process.memoryUsage().heapUsed / 1048576).toFixed(2)} MB`, true)
            .addField('Support server', `[discord.gg/${message.client.configs.support}](https://discord.gg/${message.client.configs.support})`, true)
            .addField('Git repository', '[github.com/HordLawk/YottaBot](https://github.com/HordLawk/YottaBot)', true);
        message.channel.send(embed);
    },
};