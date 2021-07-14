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
            .setAuthor(message.client.langs[channelLanguage].get('infoEmbedAuthor'), message.client.user.displayAvatarURL())
            .setDescription(message.client.langs[channelLanguage].get('infoEmbedDescription', [invite]))
            .setTimestamp()
            .addField(message.client.langs[channelLanguage].get('infoEmbedVersionTitle'), process.env.npm_package_version, true)
            .addField(message.client.langs[channelLanguage].get('infoEmbedEngineTitle'), message.client.langs[channelLanguage].get('infoEmbedEngineValue', [process.version]), true)
            .addField(message.client.langs[channelLanguage].get('infoEmbedLibraryTitle'), message.client.langs[channelLanguage].get('infoEmbedLibraryValue', [version]), true)
            .addField(message.client.langs[channelLanguage].get('infoEmbedDeveloperTitle'), message.client.configs.owner.tag, true)
            .addField(message.client.langs[channelLanguage].get('infoEmbedUptimeTitle'), message.client.langs[channelLanguage].get('infoEmbedUptimeValue', [Date.now() - message.client.uptime]), true)
            .addField(message.client.langs[channelLanguage].get('infoEmbedRAMTitle'), message.client.langs[channelLanguage].get('infoEmbedRAMValue', [process.memoryUsage().heapUsed]), true)
            .addField(message.client.langs[channelLanguage].get('infoEmbedSupportTitle'), message.client.langs[channelLanguage].get('infoEmbedSupportValue', [message.client.configs.support]), true)
            .addField(message.client.langs[channelLanguage].get('infoEmbedRepoTitle'), message.client.langs[channelLanguage].get('infoEmbedRepoValue'), true);
        message.channel.send(embed);
    },
};