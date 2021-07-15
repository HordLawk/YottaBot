const {MessageEmbed, Permissions, version} = require('discord.js');

module.exports = {
    active: true,
    name: 'info',
    description: () => 'Shows detailed information about the bot',
    aliases: ['botinfo', 'about'],
    cooldown: 5,
    categoryID: 1,
    execute: async function(message){
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(channelLanguage.get('botEmbed'));
        const invite = await message.client.generateInvite({permissions: Permissions.ALL});
        const embed = new MessageEmbed()
            .setColor(message.guild?.me.displayColor || 0x8000ff)
            .setAuthor(channelLanguage.get('infoEmbedAuthor'), message.client.user.displayAvatarURL())
            .setDescription(channelLanguage.get('infoEmbedDescription', [invite]))
            .setTimestamp()
            .addField(channelLanguage.get('infoEmbedVersionTitle'), process.env.npm_package_version, true)
            .addField(channelLanguage.get('infoEmbedEngineTitle'), channelLanguage.get('infoEmbedEngineValue', [process.version]), true)
            .addField(channelLanguage.get('infoEmbedLibraryTitle'), channelLanguage.get('infoEmbedLibraryValue', [version]), true)
            .addField(channelLanguage.get('infoEmbedDeveloperTitle'), message.client.configs.owner.tag, true)
            .addField(channelLanguage.get('infoEmbedUptimeTitle'), channelLanguage.get('infoEmbedUptimeValue', [Date.now() - message.client.uptime]), true)
            .addField(channelLanguage.get('infoEmbedRAMTitle'), channelLanguage.get('infoEmbedRAMValue', [process.memoryUsage().heapUsed]), true)
            .addField(channelLanguage.get('infoEmbedSupportTitle'), channelLanguage.get('infoEmbedSupportValue', [message.client.configs.support]), true)
            .addField(channelLanguage.get('infoEmbedRepoTitle'), channelLanguage.get('infoEmbedRepoValue'), true);
        message.channel.send(embed);
    },
};