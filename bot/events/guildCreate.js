const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    name: 'guildCreate',
    execute: async guild => {
        if(process.env.NODE_ENV === 'development') return;
        var content = '';
        if(guild.me.permissions.has(Permissions.FLAGS.MANAGE_GUILD)){
            let integrations = await guild.fetchIntegrations({includeApplications: true});
            let adder = integrations.find(e => (e.application.id === guild.client.user.id))?.user;
            if(adder){
                content = `Added by: ${adder} (${adder.tag})\n`;
                let dmEmbed = new MessageEmbed()
                    .setColor(0x8000ff)
                    .setDescription(guild.client.langs[guild.client.guildData.get(guild.id)?.language ?? (guild.preferredLocale === 'pt-BR') ? 'pt' : 'en'].get('dmBotAdder', [adder, guild.name, guild.client.guildData.get(guild.id)?.prefix ?? 'y!', guild.client.configs.support]));
                await adder.send({embeds: [dmEmbed]}).catch(() => null);
            }
        }
        const embed = new MessageEmbed()
            .setColor(0x00ff00)
            .setAuthor({
                name: 'Joined Guild',
                iconURL: guild.iconURL({dynamic: true}),
            })
            .setDescription(`${content}Member count: ${guild.memberCount}\nID: ${guild.id}\nName: ${guild.name}\nOwner: <@${guild.ownerId}>\nLocale: ${guild.preferredLocale}\nFeatures:\`\`\`${guild.features.join('\n')}\`\`\``);
        await guild.client.channels.cache.get(guild.client.configs.guildlog).send({embeds: [embed]});
        guild.client.channels.cache.get(guild.client.configs.guildlog).setTopic(guild.client.guilds.cache.size);
    },
};