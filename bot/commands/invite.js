const {Permissions, MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'invite',
    description: lang => lang.get('inviteDescription'),
    cooldown: 5,
    categoryID: 1,
    execute: async function(message){
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
        const url = await message.client.generateInvite({
            scopes: ['bot'],
            permissions: Permissions.ALL,
        });
        const embed = new MessageEmbed()
            .setColor(message.guild?.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('inviteEmbedDescription', [url]));
        message.reply({embeds: [embed]});
    }
}