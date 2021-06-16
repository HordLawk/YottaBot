const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'support',
    description: lang => 'Gives you an invite to the support server',
    cooldown: 5,
    categoryID: 0,
    execute: async function(message){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
        const embed = new MessageEmbed()
            .setColor(message.guild.me.displayColor || 0x8000ff)
            .setDescription(`**[Join](https://discord.gg/${message.client.configs.support})** my support server!`);
        message.channel.send(embed);
    }
}