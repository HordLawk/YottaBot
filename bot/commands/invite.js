const {PermissionsBitField, EmbedBuilder} = require('discord.js');
const configs = require('../configs.js');

module.exports = {
    active: true,
    name: 'invite',
    description: lang => lang.get('inviteDescription'),
    cooldown: 5,
    categoryID: 1,
    execute: async message => {
        const {channelLanguage} = message;
        if(
            message.guild
            &&
            !message.guild.members.me
                .permissionsIn(message.channel)
                .has(PermissionsBitField.Flags.EmbedLinks)
        ) return message.reply(channelLanguage.get('botEmbed'));
        const url = message.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: configs.permissions,
        });
        const embed = new EmbedBuilder()
            .setColor(message.guild?.members.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('inviteEmbedDescription', [url]));
        message.reply({embeds: [embed]});
    },
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        const url = await interaction.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: configs.permissions,
        });
        const embed = new EmbedBuilder()
            .setColor(interaction.guild?.members.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('inviteEmbedDescription', [url]));
        await interaction.reply({embeds: [embed]});
    },
}