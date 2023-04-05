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

const {
    PermissionsBitField,
    ApplicationCommandOptionType,
    TextInputStyle,
    ComponentType,
    EmbedBuilder,
} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'reason',
    description: lang => lang.get('reasonDescription'),
    aliases: ['editreason'],
    usage: lang => [lang.get('reasonUsage')],
    example: ['7 is actually a spammer not a scammer'],
    cooldown: 5,
    categoryID: 3,
    args: true,
    perm: PermissionsBitField.Flags.ModerateMembers,
    guildOnly: true,
    execute: async function(message, args){
        const {channelLanguage} = message;
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        if(
            !args[1]
            ||
            isNaN(parseInt(args[0], 10))
            ||
            !isFinite(parseInt(args[0], 10))
            ||
            (parseInt(args[0], 10) < 0)
        ){
            return await message.reply(
                channelLanguage.get('invArgsSlash', {usages: utils.slashCommandUsages(this.name, message.client)}),
            );
        }
        const log = require('../../schemas/log.js');
        const current = await log.findOne({
            id: parseInt(args[0], 10),
            guild: message.guild.id,
        });
        if(!current) return message.reply(channelLanguage.get('invCase'));
        const member = current.executor && await message.guild.members.fetch(current.executor).catch(() => null);
        if(
            member
            &&
            (current.executor !== message.author.id)
            &&
            (
                (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0)
                ||
                (message.guild.ownerId === member.id)
            )
        ) return message.reply(channelLanguage.get('youCantEditCase'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        current.reason = reason;
        await current.save();
        await message.reply(channelLanguage.get('reasonEditSuccess'));
        const discordChannel = message.guild.channels.cache.get(
            message.client.guildData.get(message.guild.id).modlogs[current.type]
        );
        if(
            !discordChannel
            ||
            !discordChannel.viewable
            ||
            !discordChannel
                .permissionsFor(message.guild.members.me)
                .has(PermissionsBitField.Flags.EmbedLinks)
            ||
            !discordChannel
                .permissionsFor(message.guild.members.me)
                .has(PermissionsBitField.Flags.SendMessages)
        ) return;
        const msg = await discordChannel.messages.fetch({message: current.logMessage}).catch(() => null);
        if(!msg || !msg.editable || !msg.embeds.length) return;
        const embed = new EmbedBuilder(msg.embeds[0].toJSON());
        embed.setFields([{
            name: channelLanguage.get('reasonEmbedTargetTitle'),
            value: channelLanguage.get('reasonEmbedTargetValue', [current.target]),
            inline: true,
        }]);
        if(current.executor) embed.addField(
            channelLanguage.get('reasonEmbedExecutorTitle'),
            channelLanguage.get(
                'reasonEmbedExecutorValue',
                [current.executor]
            ),
            true
        );
        if(current.duration){
            let duration = Math.round((current.duration.getTime() - current.timeStamp.getTime()) / 60000);
            let d = Math.floor(duration / 1440);
            let h = Math.floor((duration % 1440) / 60);
            let m = Math.floor(duration % 60);
            embed.addField(
                channelLanguage.get('reasonEmbedDurationTitle'),
                channelLanguage.get(
                    'reasonEmbedDurationValue',
                    [
                        d,
                        h,
                        m,
                        Math.floor(current.duration.getTime() / 1000),
                    ]
                ),
                true
            );
        }
        embed.addField(channelLanguage.get('reasonEmbedReasonTitle'), reason);
        await msg.edit({embeds: [embed]});
    },
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const log = require('../../schemas/log.js');
        const current = await log.findOne({
            id: args.case_id,
            guild: interaction.guild.id,
        });
        if(!current) return await interaction.reply({
            content: channelLanguage.get('invCase'),
            ephemeral: true,
        });
        const member = current.executor && await interaction.guild.members.fetch(current.executor).catch(() => null);
        if(
            member
            &&
            (current.executor !== interaction.user.id)
            &&
            (
                (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0)
                ||
                (interaction.guild.ownerId === member.id)
            )
        ) return await interaction.reply({
            content: channelLanguage.get('youCantEditCase'),
            ephemeral: true,
        });
        await interaction.showModal({
            customId: `modalEdit${interaction.id}`,
            title: channelLanguage.get('editReasonModalTitle'),
            components: [{
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.TextInput,
                    customId: 'reason',
                    label: channelLanguage.get('editReasonModalReasonLabel'),
                    required: true,
                    style: TextInputStyle.Paragraph,
                    maxLength: 500,
                    value: current.reason,
                }],
            }],
        });
        const i = await interaction.awaitModalSubmit({
            filter: int => (int.user.id === interaction.user.id) && (int.customId === `modalEdit${interaction.id}`),
            time: 600_000,
        }).catch(() => null);
        if(!i) return await interaction.followUp({
            content: channelLanguage.get('modalTimeOut'),
            ephemeral: true,
        });
        current.reason = i.fields.getTextInputValue('reason');
        await current.save();
        await i.reply({
            content: channelLanguage.get('reasonEditSuccess'),
            ephemeral: true,
        });
        const discordChannel = interaction.guild.channels.cache.get(
            interaction.client.guildData.get(interaction.guild.id).modlogs[current.type]
        );
        if(
            !discordChannel
            ||
            !discordChannel.viewable
            ||
            !discordChannel
                .permissionsFor(interaction.guild.members.me)
                .has(PermissionsBitField.Flags.EmbedLinks)
            ||
            !discordChannel
                .permissionsFor(interaction.guild.members.me)
                .has(PermissionsBitField.Flags.SendMessages)
        ) return;
        const msg = await discordChannel.messages.fetch({message: current.logMessage}).catch(() => null);
        if(!msg?.editable || !msg.embeds.length) return;
        const embed = new EmbedBuilder(msg.embeds[0].toJSON());
        embed.setFields([{
            name: channelLanguage.get('reasonEmbedTargetTitle'),
            value: channelLanguage.get('reasonEmbedTargetValue', [current.target]),
            inline: true,
        }]);
        if(current.executor) embed.addField(
            channelLanguage.get('reasonEmbedExecutorTitle'),
            channelLanguage.get(
                'reasonEmbedExecutorValue',
                [current.executor]
            ),
            true
        );
        if(current.duration){
            let duration = Math.round((current.duration.getTime() - current.timeStamp.getTime()) / 60000);
            let d = Math.floor(duration / 1440);
            let h = Math.floor((duration % 1440) / 60);
            let m = Math.floor(duration % 60);
            embed.addField(
                channelLanguage.get('reasonEmbedDurationTitle'),
                channelLanguage.get(
                    'reasonEmbedDurationValue',
                    [
                        d,
                        h,
                        m,
                        Math.floor(current.duration.getTime() / 1000),
                    ]
                ),
                true
            );
        }
        embed.addField(channelLanguage.get('reasonEmbedReasonTitle'), current.reason);
        await msg.edit({embeds: [embed]});
    },
    slashOptions: [{
        type: ApplicationCommandOptionType.Integer,
        name: 'case_id',
        nameLocalizations: utils.getStringLocales('reasonOptioncase_idLocalisedName'),
        description: 'The ID of the case to edit the reason of',
        descriptionLocalizations: utils.getStringLocales('reasonOptioncase_idLocalisedDesc'),
        required: true,
        minValue: 0,
    }],
};