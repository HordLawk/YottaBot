// Copyright (C) 2022  HordLawk

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

const {PermissionsBitField, EmbedBuilder, ApplicationCommandOptionType} = require('discord.js');
const utils = require('../utils.js');
const configs = require('../configs.js');

module.exports = {
    active: true,
    name: 'notarchive',
    description: lang => lang.get('notarchiveDescription'),
    cooldown: 5,
    categoryID: 2,
    perm: PermissionsBitField.Flags.ManageThreads,
    guildOnly: true,
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'manage',
            nameLocalizations: utils.getStringLocales('notarchive_manageLocalisedName'),
            description: 'Enables or disables the automatic unarchiving of the current thread',
            descriptionLocalizations: utils.getStringLocales('notarchive_manageLocalisedDesc'),
            options: [{
                type: ApplicationCommandOptionType.Boolean,
                name: 'enable',
                nameLocalizations: utils.getStringLocales('notarchive_manageOptionenableLocalisedName'),
                description: 'Whether it should be enabled or disabled',
                descriptionLocalizations: utils.getStringLocales('notarchive_manageOptionenableLocalisedDesc'),
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'list',
            nameLocalizations: utils.getStringLocales('notarchive_listLocalisedName'),
            description: 'Lists threads that are set to never archive in this server',
            descriptionLocalizations: utils.getStringLocales('notarchive_listLocalisedDesc'),
        },
    ],
    manageSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!interaction.channel.isThread()) return await interaction.reply({
            content: channelLanguage.get('channelIsNotThread'),
            ephemeral: true,
        });
        if(
            args.enable
            &&
            !interaction.guild.members.me
                .permissionsIn(interaction.channel)
                .has(PermissionsBitField.Flags.ManageThreads)
        ) return await interaction.reply({
            content: channelLanguage.get('botCantUnarchive'),
            ephemeral: true,
        });
        const channelModel = require('../../schemas/channel.js');
        const threadCount = await channelModel.countDocuments({
            _id: {$in: interaction.guild.channels.cache.map(e => e.id)},
            guild: interaction.guild.id,
            autoUnarchive: true,
        });
        if(threadCount >= configs.notarchiveLimits[+!!(
            interaction.client.guildData.get(interaction.guild.id).premiumUntil
            ||
            interaction.client.guildData.get(interaction.guild.id).partner
        )]) return await interaction.reply({
            content: channelLanguage.get(
                (
                    (
                        interaction.client.guildData.get(interaction.guild.id).premiumUntil
                        ||
                        interaction.client.guildData.get(interaction.guild.id).partner
                    )
                    ? 'tooManyAutoUnarchivesPremium'
                    : 'tooManyAutoUnarchives'
                ),
                [
                    configs.notarchiveLimits[0],
                    configs.notarchiveLimits[1]
                ],
            ),
            ephemeral: true,
        });
        await channelModel.findOneAndUpdate({
            _id: interaction.channel.id,
            guild: interaction.guild.id,
        }, {$set: {autoUnarchive: args.enable}}, {
            upsert: true,
            setDefaultsOnInsert: true,
        });
        await interaction.reply(channelLanguage.get('threadNotArchiveSuccess', [args.enable]));
    },
    listSlash: async interaction => {
        const {channelLanguage} = interaction;
        const channelModel = require('../../schemas/channel.js');
        const threads = await channelModel.find({
            _id: {$in: interaction.guild.channels.cache.map(e => e.id)},
            guild: interaction.guild.id,
            autoUnarchive: true,
        }).sort({createdAt: 1});
        if(!threads.length) return await interaction.reply({
            content: channelLanguage.get('noThreadsWontArchive'),
            ephemeral: true,
        });
        const autoUnarchiveLimits = configs.notarchiveLimits[+!!(
            interaction.client.guildData.get(interaction.guild.id).premiumUntil
            ||
            interaction.client.guildData.get(interaction.guild.id).partner
        )];
        const replyData = {}
        if(threads.length >= autoUnarchiveLimits) replyData.content = channelLanguage.get('disabledExtraNotArchiveds');
        const embed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setAuthor({
                name: channelLanguage.get('notarchiveEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setTimestamp()
            .setDescription(threads.map((e, i) => {
                const chan = interaction.guild.channels.cache.get(e._id);
                if(chan) return (i < autoUnarchiveLimits) ? chan.toString() : `${chan} *(disabled)*`;
            }).filter(e => e).join('\n'));
        replyData.embeds = [embed];
        await interaction.reply(replyData);
    },
};