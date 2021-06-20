const {MessageEmbed} = require('discord.js');

module.exports = {
    name: 'guildCreate',
    execute: async guild => {
        if(process.env.NODE_ENV === 'development') return;
        var content = '';
        if(guild.me.permissions.has('MANAGE_SERVER')){
            let integrations = await guild.fetchIntegrations({includeApplications: true});
            let adder = integrations.find(e => (e.application.id === guild.client.user.id)).user;
            content = `Added by: ${adder} (${adder.tag})\n`;
            await adder.send(`Greetings ${adder}! Thank you for adding me to **${guild.name}**. Since I am a highly customizable bot, I recommend that you start by having a look at \`${guild.client.guildData.get(guild.id)?.prefix || 'y!'}help configs\` and setting up command permissions with \`${guild.client.guildData.get(guild.id)?.prefix || 'y!'}help perm\`, otherwise, some of them might have too restrictive default permissions, like the \`mute\` command, which by default is only allowed to users with the Manage Roles permission`).catch(() => null);
        }
        const embed = new MessageEmbed()
            .setColor(0x00ff00)
            .setAuthor('Joined Guild', guild.iconURL({dynamic: true}))
            .setDescription(`${content}Member count: ${guild.memberCount}\nID: ${guild.id}\nName: ${guild.name}\nOwner: <@${guild.ownerID}>\nRegion: ${guild.region}\nFeatures:\`\`\`${guild.features.join('\n')}\`\`\``);
        await guild.client.channels.cache.get(guild.client.configs.guildlog).send(embed);
        guild.client.channels.cache.get(guild.client.configs.guildlog).setTopic(guild.client.guilds.size);
    },
};