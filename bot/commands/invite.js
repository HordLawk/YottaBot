const {Permissions, MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'invite',
    description: lang => 'Gives you an url to add the bot to your server',
    cooldown: 5,
    categoryID: 0,
    execute: async function(message){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
        const url = await message.client.generateInvite({permissions: Permissions.ALL});
        const embed = new MessageEmbed()
            .setColor(message.guild?.me.displayColor || 0x8000ff)
            .setDescription(`**[Invite](${url})** me to your server!`);
        message.channel.send(embed);
    }
}