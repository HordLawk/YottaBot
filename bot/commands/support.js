const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'support',
    description: lang => lang.get('supportDescription'),
    cooldown: 5,
    categoryID: 1,
    execute: async function(message){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
        const embed = new MessageEmbed()
            .setColor(message.guild?.me.displayColor || 0x8000ff)
            .setDescription(message.client.langs[channelLanguage].get('supportEmbedDescription', [message.client.configs.support]));
        message.channel.send(embed);
    }
}