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
        const url = interaction.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: configs.permissions,
        });
        const embed = new EmbedBuilder()
            .setColor(interaction.guild?.members.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('inviteEmbedDescription', [url]));
        await interaction.reply({embeds: [embed]});
    },
}