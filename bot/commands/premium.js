const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'premium',
    description: lang => 'Information on becoming premium',
    cooldown: 5,
    categoryID: 0,
    execute: async message => {
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(message.client.guildData.get(message.guild.id).premium || message.client.guildData.get(message.guild.id).partner) return message.channel.send('This server already has access to premium features');
        if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
        const embed = new MessageEmbed()
            .setColor(message.guild.me.displayColor || 0x8000ff)
            .setDescription(`Automatically buying premium status is not ready yet, if you wish to apply for partnership or pay for premium directly [**join the support server**](https://discord.gg/${message.client.configs.support}) and DM the developers`);
        message.channel.send(embed);
    },
};