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

const {EmbedBuilder, PermissionsBitField, TextInputStyle, ButtonStyle, ComponentType, ApplicationCommandOptionType} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'mute',
    description: lang => lang.get('muteDescription'),
    aliases: ['m', 'timeout', 'to'],
    usage: lang => [lang.get('muteUsage')],
    example: ['@LordHawk#0001 1h30m spammer'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: PermissionsBitField.Flags.ModerateMembers,
    guildOnly: true,
    slashOptions: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'target',
            nameLocalizations: utils.getStringLocales('muteOptiontargetLocalisedName'),
            description: 'The member to mute/timeout',
            descriptionLocalizations: utils.getStringLocales('muteOptiontargetLocalisedDesc'),
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'duration',
            nameLocalizations: utils.getStringLocales('muteOptiondurationLocalisedName'),
            description: 'For how long the target member should remain muted',
            descriptionLocalizations: utils.getStringLocales('muteOptiondurationLocalisedDesc'),
            required: true,
            autocomplete: true,
            minValue: 1,
            maxValue: 28 * 24 * 60,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'with_reason',
            nameLocalizations: utils.getStringLocales('muteOptionwith_reasonLocalisedName'),
            description: 'Whether to prompt a modal asking for the mute/timeout reason',
            descriptionLocalizations: utils.getStringLocales('muteOptionwith_reasonLocalisedDesc'),
            required: false,
        },
    ],
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.reply(channelLanguage.get('invMember'));
        if(
            (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0)
            ||
            member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) return message.reply(channelLanguage.get('youCantMute'));
        if(!member.moderatable) return message.reply(channelLanguage.get('iCantMute'));
        const duration = (
            args[1]
            &&
            (
                (
                    (parseInt(args[1].match(/(\d+)d/)?.[1], 10) * 86400000)
                    ||
                    0
                ) + (
                    (parseInt(args[1].match(/(\d+)h/)?.[1], 10) * 3600000)
                    ||
                    0
                ) + (
                    (parseInt(args[1].match(/(\d+)m/)?.[1], 10) * 60000)
                    ||
                    0
                )
            )
        );
        const timeStamp = Date.now();
        if(!duration || (duration > 2419200000)) return message.reply(channelLanguage.get('invMuteDuration'));
        if(member.isCommunicationDisabled()) return message.reply(channelLanguage.get('alreadyMuted'));
        const reason = message.content.replace(/^(?:\S+\s+){2}\S+\s*/, '').slice(0, 500);
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findById(message.guild.id);
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const log = require('../../schemas/log.js');
        const current = new log({
            id: guildDoc.counterLogs++,
            guild: message.guild.id,
            type: 'mute',
            target: member.id,
            executor: message.author.id,
            timeStamp: timeStamp,
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
            ongoing: true,
        });
        await guildDoc.save();
        await current.save();
        await member.timeout(duration, current.reason);
        current.duration = member.communicationDisabledUntil;
        await current.save();
        const reply = await message.reply(channelLanguage.get('muteMemberSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(
            message.client.guildData.get(message.guild.id).modlogs.mute
        );
        let msg;
        let embed;
        if(
            discordChannel
            &&
            discordChannel.viewable
            &&
            discordChannel
                .permissionsFor(message.guild.members.me)
                .has(PermissionsBitField.Flags.SendMessages)
            &&
            discordChannel
                .permissionsFor(message.guild.members.me)
                .has(PermissionsBitField.Flags.EmbedLinks)
        ){
            const d = Math.floor(duration / 86400000);
            const h = Math.floor((duration % 86400000) / 3600000);
            const m = Math.floor((duration % 3600000) / 60000);
            embed = new EmbedBuilder()
                .setTimestamp()
                .setColor(0xff8000)
                .setAuthor({
                    name: channelLanguage.get('muteEmbedAuthor', [message.author.tag, member.user.tag]),
                    iconURL: member.user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('muteEmbedDescription', [message.url]))
                .addField(
                    channelLanguage.get('muteEmbedTargetTitle'),
                    channelLanguage.get(
                        'muteEmbedTargetValue',
                        [member]
                    ),
                    true
                )
                .addField(channelLanguage.get('muteEmbedExecutorTitle'), message.author.toString(), true)
                .addField(
                    channelLanguage.get('muteEmbedDurationTitle'),
                    channelLanguage.get(
                        'muteEmbedDurationValue',
                        [
                            d,
                            h,
                            m,
                            Math.floor(current.duration.getTime() / 1000),
                        ]
                    ),
                    true
                )
                .setFooter({
                    text: channelLanguage.get('muteEmbedFooter', [current.id]),
                    iconURL: message.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('muteEmbedReasonTitle'), reason);
            if(current.image) embed.setImage(current.image);
            msg = await discordChannel.send({embeds: [embed]});
            current.logMessage = msg.id;
            await current.save();
        }
        const buttonUndo = {
            type: ComponentType.Button,
            label: channelLanguage.get('undo'),
            customId: 'undo',
            style: ButtonStyle.Danger,
            emoji: '↩️',
        };
        const buttonEdit = {
            type: ComponentType.Button,
            label: channelLanguage.get('editReason'),
            customId: 'edit',
            style: ButtonStyle.Primary,
            emoji: '✏️',
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonEdit, buttonUndo],
        }];
        await reply.edit({components});
        const collectorUndo = reply.createMessageComponentCollector({
            filter: componentInteraction => (
                (componentInteraction.user.id === message.author.id)
                &&
                (componentInteraction.customId === 'undo')
            ),
            idle: 10000,
            max: 1,
            componentType: ComponentType.Button,
        });
        collectorUndo.on('collect', i => (async i => {
            if(!member.isCommunicationDisabled()) return;
            await log.findByIdAndDelete(current._id);
            await member.timeout(null, channelLanguage.get('muteUndone'));
            await i.update({
                content: channelLanguage.get('muteMemberUndone'),
                components: [],
            });
            if(msg) await msg.delete();
        })(i).catch(async err => await utils.handleComponentError(err, i)));
        collectorUndo.on('end', async () => {
            if(!reply.editable) return;
            buttonUndo.disabled = true;
            await reply.edit({components});
        });
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => (
                (componentInteraction.user.id === message.author.id)
                &&
                (componentInteraction.customId === 'edit')
            ),
            time: 60_000,
            componentType: ComponentType.Button,
        });
        collectorEdit.on('collect', i => (async () => {
            await i.showModal({
                customId: `modalEdit${i.id}`,
                title: channelLanguage.get('editReasonModalTitle'),
                components: [{
                    type: ComponentType.ActionRow,
                    components: [{
                        type: ComponentType.TextInput,
                        customId: 'reason',
                        label: channelLanguage.get('editReasonModalReasonLabel'),
                        required: true,
                        style: TextInputStyle.Paragraph,
                        value: current.reason,
                        maxLength: 500,
                    }],
                }],
            });
            const int = await i.awaitModalSubmit({
                filter: int => (int.user.id === message.author.id) && (int.customId === `modalEdit${i.id}`),
                time: 600_000,
            }).catch(() => null);
            if(!int) return await i.followUp({
                content: channelLanguage.get('modalTimeOut'),
                ephemeral: true,
            });
            current.reason = int.fields.getTextInputValue('reason');
            await current.save();
            await int.reply({
                content: channelLanguage.get('modalEditSuccess'),
                ephemeral: true,
            });
            if(!msg?.editable) return;
            const reasonIndex = embed.data.fields.findIndex(e => (e.name === channelLanguage.get('muteEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('muteEmbedReasonTitle'),
                value: current.reason
            };
            if(reasonIndex === -1){
                embed.addFields(reasonField);
            }
            else{
                embed.spliceFields(reasonIndex, 1, reasonField);
            }
            await msg.edit({embeds: [embed]});
        })().catch(async err => await handleComponentError(err, i)));
        collectorEdit.on('end', async () => {
            if(!reply.editable) return;
            buttonEdit.disabled = true;
            await reply.edit({components});
        });
    },
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        let reason;
        let lastInteraction = interaction;
        if(args.with_reason){
            await interaction.showModal({
                customId: `modalReason${interaction.id}`,
                title: channelLanguage.get('setReasonModalTitle'),
                components: [{
                    type: ComponentType.ActionRow,
                    components: [{
                        type: ComponentType.TextInput,
                        customId: 'reason',
                        label: channelLanguage.get('setReasonModalReasonLabel'),
                        required: true,
                        style: TextInputStyle.Paragraph,
                        maxLength: 500,
                    }],
                }],
            });
            const i = await interaction.awaitModalSubmit({
                filter: int => (int.user.id === interaction.user.id) && (int.customId === `modalReason${interaction.id}`),
                time: 600_000,
            }).catch(() => null);
            if(!i) return await interaction.followUp({
                content: channelLanguage.get('modalTimeOut'),
                ephemeral: true,
            });
            reason = i.fields.getTextInputValue('reason');
            lastInteraction = i;
        }
        if(!args.target.member) return await lastInteraction.reply({
            content: channelLanguage.get('invMember'),
            ephemeral: true,
        });
        if(
            (interaction.member.roles.highest.comparePositionTo(args.target.member.roles.highest) <= 0)
            ||
            args.target.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) return await lastInteraction.reply({
            content: channelLanguage.get('youCantMute'),
            ephemeral: true,
        });
        if(!args.target.member.moderatable) return await lastInteraction.reply({
            content: channelLanguage.get('iCantMute'),
            ephemeral: true,
        });
        const duration = args.duration * 60000;
        const timeStamp = Date.now();
        if(args.target.member.isCommunicationDisabled()) return await lastInteraction.reply({
            content: channelLanguage.get('alreadyMuted'),
            ephemeral: true,
        });
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findById(interaction.guild.id);
        interaction.client.guildData.get(interaction.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const log = require('../../schemas/log.js');
        const current = new log({
            id: guildDoc.counterLogs++,
            guild: interaction.guild.id,
            type: 'mute',
            target: args.target.id,
            executor: interaction.user.id,
            timeStamp: timeStamp,
            reason,
            ongoing: true,
        });
        await guildDoc.save();
        await current.save();
        await args.target.member.timeout(duration, reason);
        current.duration = args.target.member.communicationDisabledUntil;
        await current.save();
        const reply = await lastInteraction.reply({
            content: channelLanguage.get('muteMemberSuccess', [current.id]),
            fetchReply: true,
        });
        current.actionMessage = reply.url;
        await current.save();
        const discordChannel = interaction.guild.channels.cache.get(
            interaction.client.guildData.get(interaction.guild.id).modlogs.mute
        );
        let msg;
        let embed;
        if(
            discordChannel
            &&
            discordChannel.viewable
            &&
            discordChannel
                .permissionsFor(interaction.guild.members.me)
                .has(PermissionsBitField.Flags.SendMessages)
            &&
            discordChannel
                .permissionsFor(interaction.guild.members.me)
                .has(PermissionsBitField.Flags.EmbedLinks)
        ){
            const d = Math.floor(args.duration / 1_440);
            const h = Math.floor((args.duration % 1_440) / 60);
            const m = args.duration % 60;
            embed = new EmbedBuilder()
                .setTimestamp()
                .setColor(0xff8000)
                .setAuthor({
                    name: channelLanguage.get('muteEmbedAuthor', [interaction.user.tag, args.target.tag]),
                    iconURL: args.target.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('muteEmbedDescription', [reply.url]))
                .addField(
                    channelLanguage.get('muteEmbedTargetTitle'),
                    channelLanguage.get(
                        'muteEmbedTargetValue',
                        [args.target]
                    ),
                    true
                )
                .addField(channelLanguage.get('muteEmbedExecutorTitle'), interaction.user.toString(), true)
                .addField(
                    channelLanguage.get('muteEmbedDurationTitle'),
                    channelLanguage.get(
                        'muteEmbedDurationValue',
                        [
                            d,
                            h,
                            m,
                            Math.floor(current.duration.getTime() / 1000),
                        ]
                    ),
                    true
                )
                .setFooter({
                    text: channelLanguage.get('muteEmbedFooter', [current.id]),
                    iconURL: interaction.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('muteEmbedReasonTitle'), reason);
            msg = await discordChannel.send({embeds: [embed]});
            current.logMessage = msg.id;
            await current.save();
        }
        const buttonUndo = {
            type: ComponentType.Button,
            label: channelLanguage.get('undo'),
            customId: 'undo',
            style: ButtonStyle.Danger,
            emoji: '↩️',
        };
        const buttonEdit = {
            type: ComponentType.Button,
            label: channelLanguage.get('editReason'),
            customId: 'edit',
            style: ButtonStyle.Primary,
            emoji: '✏️',
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonEdit, buttonUndo],
        }];
        await lastInteraction.editReply({components});
        const collectorUndo = reply.createMessageComponentCollector({
            filter: componentInteraction => (
                (componentInteraction.user.id === interaction.user.id)
                &&
                (componentInteraction.customId === 'undo')
            ),
            idle: 10_000,
            max: 1,
            componentType: ComponentType.Button,
        });
        collectorUndo.on('collect', i => (async i => {
            if(!args.target.member.isCommunicationDisabled()) return;
            await log.findByIdAndDelete(current._id);
            await args.target.member.timeout(null, channelLanguage.get('muteUndone'));
            await i.update({
                content: channelLanguage.get('muteMemberUndone'),
                components: [],
            });
            if(msg) await msg.delete();
        })(i).catch(async err => await utils.handleComponentError(err, i)));
        collectorUndo.on('end', async () => {
            if(!reply.editable) return;
            buttonUndo.disabled = true;
            await lastInteraction.editReply({components});
        });
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => (
                (componentInteraction.user.id === interaction.user.id)
                &&
                (componentInteraction.customId === 'edit')
            ),
            time: 60_000,
            componentType: ComponentType.Button,
        });
        collectorEdit.on('collect', i => (async () => {
            await i.showModal({
                customId: `modalEdit${i.id}`,
                title: channelLanguage.get('editReasonModalTitle'),
                components: [{
                    type: ComponentType.ActionRow,
                    components: [{
                        type: ComponentType.TextInput,
                        customId: 'reason',
                        label: channelLanguage.get('editReasonModalReasonLabel'),
                        required: true,
                        style: TextInputStyle.Paragraph,
                        value: current.reason,
                        maxLength: 500,
                    }],
                }],
            });
            const int = await i.awaitModalSubmit({
                filter: int => (int.user.id === interaction.user.id) && (int.customId === `modalEdit${i.id}`),
                time: 600_000,
            }).catch(() => null);
            if(!int) return await i.followUp({
                content: channelLanguage.get('modalTimeOut'),
                ephemeral: true,
            });
            current.reason = int.fields.getTextInputValue('reason');
            await current.save();
            await int.reply({
                content: channelLanguage.get('modalEditSuccess'),
                ephemeral: true,
            });
            if(!msg?.editable) return;
            const reasonIndex = embed.data.fields.findIndex(e => (e.name === channelLanguage.get('muteEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('muteEmbedReasonTitle'),
                value: current.reason,
            };
            if(reasonIndex === -1){
                embed.addFields(reasonField);
            }
            else{
                embed.spliceFields(reasonIndex, 1, reasonField);
            }
            await msg.edit({embeds: [embed]});
        })().catch(async err => await utils.handleComponentError(err, i)));
        collectorEdit.on('end', async () => {
            if(!reply.editable) return;
            buttonEdit.disabled = true;
            await lastInteraction.editReply({components});
        });
    },
    commandAutocomplete: {
        duration: (interaction, value, locale) => {
            if(!value) return interaction.respond([
                {
                    name: locale.get('timeAmountMinutes', ['1']),
                    value: 1,
                },
                {
                    name: locale.get('timeAmountMinutes', ['5']),
                    value: 5,
                },
                {
                    name: locale.get('timeAmountMinutes', ['10']),
                    value: 10,
                },
                {
                    name: locale.get('timeAmountMinutes', ['30']),
                    value: 30,
                },
                {
                    name: locale.get('timeAmountHours', ['1']),
                    value: 60,
                },
                {
                    name: locale.get('timeAmountHours', ['2']),
                    value: 2 * 60,
                },
                {
                    name: locale.get('timeAmountHours', ['3']),
                    value: 3 * 60,
                },
                {
                    name: locale.get('timeAmountHours', ['6']),
                    value: 6 * 60,
                },
                {
                    name: locale.get('timeAmountHours', ['12']),
                    value: 12 * 60,
                },
                {
                    name: locale.get('timeAmountDays', ['1']),
                    value: 24 * 60,
                },
                {
                    name: locale.get('timeAmountDays', ['2']),
                    value: 2 * 24 * 60,
                },
                {
                    name: locale.get('timeAmountDays', ['3']),
                    value: 3 * 24 * 60,
                },
                {
                    name: locale.get('timeAmountDays', ['7']),
                    value: 7 * 24 * 60,
                },
            ]);
            const realValue = parseInt(value, 10);
            interaction.respond(utils.timeSpanChoices(realValue, locale, 28 * 24 * 60 * 60, 60));
        },
    },
};