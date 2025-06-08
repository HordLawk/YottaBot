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

const {EmbedBuilder, PermissionsBitField, version} = require('discord.js');
const configs = require('../configs');

module.exports = {
    active: true,
    name: 'info',
    description: () => 'Shows detailed information about the bot',
    aliases: ['botinfo', 'about', 'stats'],
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
        const invite = message.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: configs.permissions,
        });
        const embed = new EmbedBuilder()
            .setColor(message.guild?.members.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('infoEmbedAuthor'),
                iconURL: message.client.user.displayAvatarURL(),
            })
            .setDescription(channelLanguage.get('infoEmbedDescription', [invite]))
            .setTimestamp()
            .addField(channelLanguage.get('infoEmbedVersionTitle'), process.env.npm_package_version, true)
            .addField(
                channelLanguage.get('infoEmbedEngineTitle'),
                channelLanguage.get(
                    'infoEmbedEngineValue',
                    [process.version]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedLibraryTitle'),
                channelLanguage.get(
                    'infoEmbedLibraryValue',
                    [version]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedDeveloperTitle'),
                channelLanguage.get(
                    'infoEmbedDeveloperValue',
                    [
                        message.client.application.owner.tag,
                        message.client.application.owner.id
                    ]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedUptimeTitle'),
                channelLanguage.get(
                    'infoEmbedUptimeValue',
                    [Date.now() - message.client.uptime]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedRAMTitle'),
                channelLanguage.get(
                    'infoEmbedRAMValue',
                    [process.memoryUsage.rss()]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedSupportTitle'),
                channelLanguage.get(
                    'infoEmbedSupportValue',
                    [configs.support]
                ),
                true
            )
            .addField(channelLanguage.get('infoEmbedRepoTitle'), channelLanguage.get('infoEmbedRepoValue'), true)
            .addField(channelLanguage.get('infoEmbedPrivacyTitle'), channelLanguage.get('infoEmbedPrivacyValue'), true);
        message.reply({embeds: [embed]});
    },
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        const invite = interaction.client.generateInvite({
            scopes: ['bot', 'applications.commands'],
            permissions: configs.permissions,
        });
        const embed = new EmbedBuilder()
            .setColor(interaction.guild?.members.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('infoEmbedAuthor'),
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setDescription(channelLanguage.get('infoEmbedDescription', [invite]))
            .setTimestamp()
            .addField(channelLanguage.get('infoEmbedVersionTitle'), process.env.npm_package_version, true)
            .addField(
                channelLanguage.get('infoEmbedEngineTitle'),
                channelLanguage.get(
                    'infoEmbedEngineValue',
                    [process.version]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedLibraryTitle'),
                channelLanguage.get(
                    'infoEmbedLibraryValue',
                    [version]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedDeveloperTitle'),
                channelLanguage.get(
                    'infoEmbedDeveloperValue',
                    [
                        interaction.client.application.owner.tag,
                        interaction.client.application.owner.id
                    ]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedUptimeTitle'),
                channelLanguage.get(
                    'infoEmbedUptimeValue',
                    [Date.now() - interaction.client.uptime]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedRAMTitle'),
                channelLanguage.get(
                    'infoEmbedRAMValue',
                    [process.memoryUsage.rss()]
                ),
                true
            )
            .addField(
                channelLanguage.get('infoEmbedSupportTitle'),
                channelLanguage.get(
                    'infoEmbedSupportValue',
                    [configs.support]
                ),
                true
            )
            .addField(channelLanguage.get('infoEmbedRepoTitle'), channelLanguage.get('infoEmbedRepoValue'), true)
            .addField(channelLanguage.get('infoEmbedPrivacyTitle'), channelLanguage.get('infoEmbedPrivacyValue'), true);
        await interaction.reply({embeds: [embed]});
    },
};