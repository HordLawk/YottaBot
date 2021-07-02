const {MessageEmbed} = require('discord.js');

module.exports = {
    name: 'guildCreate',
    execute: async guild => {
        if(process.env.NODE_ENV === 'development') return;
        var content = '';
        if(guild.me.permissions.has('MANAGE_GUILD')){
            let integrations = await guild.fetchIntegrations({includeApplications: true});
            let adder = integrations.find(e => (e.application.id === guild.client.user.id)).user;
            content = `Added by: ${adder} (${adder.tag})\n`;
            let dmEmbed = new MessageEmbed()
                .setColor(0x8000ff)
                .setDescription(guild.client.langs[guild.client.guildData.get(guild.id)?.language ?? (guild.region === 'brazil') ? 'pt' : 'en'].get('dmBotAdder', [adder, guild.name, guild.client.guildData.get(guild.id)?.prefix ?? 'y!', guild.client.configs.support]))
            await adder.send(dmEmbed).catch(() => null);
        }
        const embed = new MessageEmbed()
            .setColor(0x00ff00)
            .setAuthor('Joined Guild', guild.iconURL({dynamic: true}))
            .setDescription(`${content}Member count: ${guild.memberCount}\nID: ${guild.id}\nName: ${guild.name}\nOwner: <@${guild.ownerID}>\nRegion: ${guild.region}\nFeatures:\`\`\`${guild.features.join('\n')}\`\`\``);
        await guild.client.channels.cache.get(guild.client.configs.guildlog).send(embed);
        guild.client.channels.cache.get(guild.client.configs.guildlog).setTopic(guild.client.guilds.cache.size);
    },
};