const {MessageEmbed} = require('discord.js');

module.exports = {
    name: 'guildDelete',
    execute: async guild => {
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setAuthor('Left Guild', guild.iconURL({dynamic: true}))
            .setDescription(`Member count: ${guild.memberCount}\nID: ${guild.id}\nName: ${guild.name}\nOwner: ${guild.owner.user} (${guild.owner.user.tag})\nRegion: ${guild.region}\nFeatures:\`\`\`${guild.features.join('\n')}\`\`\``);
        guild.client.channels.cache.get(guild.client.configs.guildlog).send(embed);
    },
};