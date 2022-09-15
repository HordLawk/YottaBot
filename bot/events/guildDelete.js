const {EmbedBuilder} = require('discord.js');
const configs = require('../configs.js');

module.exports = {
    name: 'guildDelete',
    execute: async guild => {
        if(process.env.NODE_ENV === 'development') return;
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setAuthor({
                name: 'Left Guild',
                iconURL: guild.iconURL({dynamic: true}),
            })
            .setDescription(`Member count: ${guild.memberCount}\nID: ${guild.id}\nName: ${guild.name}\nOwner: <@${guild.ownerId}>\nLocale: ${guild.preferredLocale}\nFeatures:\`\`\`${guild.features?.join('\n')}\`\`\``);
        await guild.client.channels.cache.get(configs.guildlog).send({embeds: [embed]});
        guild.client.channels.cache.get(configs.guildlog).setTopic(guild.client.guilds.cache.size);
    },
};