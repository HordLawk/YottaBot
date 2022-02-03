const {MessageEmbed, Permissions, version} = require('discord.js');

module.exports = {
    active: true,
    name: 'info',
    description: () => 'Shows detailed information about the bot',
    aliases: ['botinfo', 'about', 'stats'],
    cooldown: 5,
    categoryID: 1,
    execute: async message => {
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
        const invite = await message.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: Permissions.ALL,
        });
        const embed = new MessageEmbed()
            .setColor(message.guild?.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('infoEmbedAuthor'),
                iconURL: message.client.user.displayAvatarURL(),
            })
            .setDescription(channelLanguage.get('infoEmbedDescription', [invite]))
            .setTimestamp()
            .addField(channelLanguage.get('infoEmbedVersionTitle'), process.env.npm_package_version, true)
            .addField(channelLanguage.get('infoEmbedEngineTitle'), channelLanguage.get('infoEmbedEngineValue', [process.version]), true)
            .addField(channelLanguage.get('infoEmbedLibraryTitle'), channelLanguage.get('infoEmbedLibraryValue', [version]), true)
            .addField(channelLanguage.get('infoEmbedDeveloperTitle'), channelLanguage.get('infoEmbedDeveloperValue', [message.client.application.owner.tag, message.client.application.owner.id]), true)
            .addField(channelLanguage.get('infoEmbedUptimeTitle'), channelLanguage.get('infoEmbedUptimeValue', [Date.now() - message.client.uptime]), true)
            .addField(channelLanguage.get('infoEmbedRAMTitle'), channelLanguage.get('infoEmbedRAMValue', [process.memoryUsage().heapUsed]), true)
            .addField(channelLanguage.get('infoEmbedSupportTitle'), channelLanguage.get('infoEmbedSupportValue', [message.client.configs.support]), true)
            .addField(channelLanguage.get('infoEmbedRepoTitle'), channelLanguage.get('infoEmbedRepoValue'), true)
            .addField(channelLanguage.get('infoEmbedPrivacyTitle'), channelLanguage.get('infoEmbedPrivacyValue'), true);
        message.reply({embeds: [embed]});
    },
    executeSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        const invite = await interaction.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: Permissions.ALL,
        });
        const embed = new MessageEmbed()
            .setColor(interaction.guild?.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('infoEmbedAuthor'),
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setDescription(channelLanguage.get('infoEmbedDescription', [invite]))
            .setTimestamp()
            .addField(channelLanguage.get('infoEmbedVersionTitle'), process.env.npm_package_version, true)
            .addField(channelLanguage.get('infoEmbedEngineTitle'), channelLanguage.get('infoEmbedEngineValue', [process.version]), true)
            .addField(channelLanguage.get('infoEmbedLibraryTitle'), channelLanguage.get('infoEmbedLibraryValue', [version]), true)
            .addField(channelLanguage.get('infoEmbedDeveloperTitle'), channelLanguage.get('infoEmbedDeveloperValue', [interaction.client.application.owner.tag, interaction.client.application.owner.id]), true)
            .addField(channelLanguage.get('infoEmbedUptimeTitle'), channelLanguage.get('infoEmbedUptimeValue', [Date.now() - interaction.client.uptime]), true)
            .addField(channelLanguage.get('infoEmbedRAMTitle'), channelLanguage.get('infoEmbedRAMValue', [process.memoryUsage().heapUsed]), true)
            .addField(channelLanguage.get('infoEmbedSupportTitle'), channelLanguage.get('infoEmbedSupportValue', [interaction.client.configs.support]), true)
            .addField(channelLanguage.get('infoEmbedRepoTitle'), channelLanguage.get('infoEmbedRepoValue'), true)
            .addField(channelLanguage.get('infoEmbedPrivacyTitle'), channelLanguage.get('infoEmbedPrivacyValue'), true);
        interaction.reply({embeds: [embed]});
    },
};