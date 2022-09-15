const {EmbedBuilder, PermissionsBitField} = require('discord.js');

module.exports = {
    active: true,
    name: 'upvote',
    description: lang => lang.get('upvoteDescription'),
    aliases: ['vote'],
    cooldown: 5,
    categoryID: 5,
    execute: async message => {
        const {channelLanguage} = message;
        if(
            message.guild
            &&
            !message.guild.members.me
                .permissionsIn(message.channel)
                .has(PermissionsBitField.Flags.EmbedLinks)
        ) return message.reply(channelLanguage.get('botEmbed'));
        const embed = new EmbedBuilder()
            .setColor(message.guild?.members.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('upvoteEmbedDescription', [message.client.user.id]));
        message.reply({embeds: [embed]});
    },
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        const embed = new EmbedBuilder()
            .setColor(interaction.guild?.members.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('upvoteEmbedDescription', [interaction.client.user.id]));
        await interaction.reply({embeds: [embed]});
    },
}