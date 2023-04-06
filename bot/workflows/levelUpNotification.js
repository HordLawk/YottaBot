// Copyright (C) 2023  HordLawk

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

const { PermissionsBitField } = require('discord.js');
const locale = require('../../locale');

module.exports = {
    code: 'lvnotif',
    steps: [async interaction => {
        const channelLanguage = locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en');
        const channel = interaction.channels.first();
        if(
            !interaction.guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)
            ||
            !channel.viewable
        ) return await interaction.reply({
            content: channelLanguage.get('sendMessages'),
            ephemeral: true,
        });
        const guildData = interaction.client.guildData.get(interaction.guild.id);
        guildData.xpChannel = channel.id;
        await guildData.save();
        await interaction.update({
            content: channelLanguage.get('notifyChannel', [channel]),
            components: [],
        });
    }],
};