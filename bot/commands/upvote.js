const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'upvote',
    description: lang => lang.get('upvoteDescription'),
    aliases: ['vote'],
    cooldown: 5,
    categoryID: 5,
    execute: async function(message){
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
        const embed = new MessageEmbed()
            .setColor(message.guild?.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('upvoteEmbedDescription', [message.client.user.id]));
        message.reply({embeds: [embed]});
    }
}