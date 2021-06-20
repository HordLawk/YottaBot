const {MessageEmbed} = require('discord.js');

module.exports = {
    name: 'guildDelete',
    execute: async guild => {
        if(process.env.NODE_ENV === 'development') return;
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setAuthor('Left Guild', guild.iconURL({dynamic: true}))
            .setDescription(`Member count: ${guild.memberCount}\nID: ${guild.id}\nName: ${guild.name}\nOwner: <@${guild.ownerID}>\nRegion: ${guild.region}\nFeatures:\`\`\`${guild.features.join('\n')}\`\`\``);
        await guild.client.channels.cache.get(guild.client.configs.guildlog).send(embed);
        guild.client.channels.cache.get(guild.client.configs.guildlog).setTopic(guild.client.guilds.size);
    },
};