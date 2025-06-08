// Copyright (C) 2025  HordLawk

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const {EmbedBuilder, PermissionsBitField} = require('discord.js');

module.exports = {
    active: false,
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