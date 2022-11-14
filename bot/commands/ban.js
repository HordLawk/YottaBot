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
    EmbedBuilder,
    PermissionsBitField,
    ApplicationCommandOptionType,
    ButtonStyle,
    ComponentType,
    TextInputStyle,
} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'ban',
    description: lang => lang.get('banDescription'),
    aliases: ['b', 'forceban', 'hackban'],
    usage: lang => [lang.get('banUsage')],
    example: ['@LordHawk#0001 spammer'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: PermissionsBitField.Flags.BanMembers,
    guildOnly: true,
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.reply(channelLanguage.get('invUser'));
        const user = await message.client.users.fetch(id).catch(() => null);
        if(!user) return message.reply(channelLanguage.get('invUser'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        const member = await message.guild.members.fetch(user.id).catch(() => null);
        if(member){
            if(!member.bannable) return message.reply(channelLanguage.get('cantBan'));
            if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply(channelLanguage.get('youCantBan'));
            await member.send(channelLanguage.get('dmBanned', [message.guild.name, reason])).catch(() => null);
        }
        else{
            const ban = await message.guild.bans.fetch(user.id).catch(() => null);
            if(ban) return message.reply(channelLanguage.get('alreadyBanned'));
        }
        const newban = await message.guild.members.ban(user.id, {
            reason: channelLanguage.get('banReason', [message.author.tag, reason]),
            deleteMessageSeconds: message.client.guildData.get(message.guild.id).pruneBan * 24 * 60 * 60,
        }).catch(() => null);
        if(!newban) return message.reply(channelLanguage.get('cantBan'));
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const log = require('../../schemas/log.js');
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'ban',
            target: user.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
        });
        await current.save();
        const reply = await message.reply(channelLanguage.get('memberBanSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages) && discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)){
            embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setAuthor({
                    name: channelLanguage.get('banEmbedAuthor', [message.author.tag, user.tag]),
                    iconURL: user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('banEmbedDescription', [message.url]))
                .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [user]), true)
                .addField(channelLanguage.get('banEmbedExecutorTitle'), message.author.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('banEmbedFooter', [current.id]),
                    iconURL: message.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('banEmbedReasonTitle'), reason);
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
            filter: componentInteraction => ((componentInteraction.user.id === message.author.id) && (componentInteraction.customId === 'undo')),
            idle: 10000,
            max: 1,
            componentType: ComponentType.Button,
        });
        collectorUndo.on('collect', i => (async i => {
            await message.guild.members.unban(user.id, channelLanguage.get('unbanAuditReason', [message.author.tag]))
            const guildDocUnban = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
            message.client.guildData.get(message.guild.id).counterLogs = guildDocUnban.counterLogs + 1;
            const currentUnban = new log({
                id: guildDocUnban.counterLogs,
                guild: message.guild.id,
                type: 'ban',
                target: user.id,
                executor: message.author.id,
                timeStamp: Date.now(),
                removal: true,
            });
            await currentUnban.save();
            const action = await i.reply({
                content: channelLanguage.get('unbanSuccess', [currentUnban.id]),
                fetchReply: true,
            });
            currentUnban.actionMessage = action.url;
            await currentUnban.save();
            if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)) return;
            const embedUnban = new EmbedBuilder()
                .setColor(0x00ff00)
                .setAuthor({
                    name: channelLanguage.get('unbanEmbedAuthor', [message.author.tag, user.tag]),
                    iconURL: user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('unbanEmbedDescription', [action.url]))
                .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [user]), true)
                .addField(channelLanguage.get('unbanEmbedExecutorTitle'), message.author.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('unbanEmbedFooter', [currentUnban.id]),
                    iconURL: message.guild.iconURL({dynamic: true}),
                });
            const msgUnban = await discordChannel.send({embeds: [embedUnban]});
            currentUnban.logMessage = msgUnban.id;
            await currentUnban.save();
        })(i).catch(err => message.client.handlers.button(err, i)))
        collectorUndo.on('end', async () => {
            if(!reply.editable) return;
            buttonUndo.disabled = true;
            await reply.edit({components});
        });
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => ((componentInteraction.user.id === message.author.id) && (componentInteraction.customId === 'edit')),
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
            })
            current.reason = int.fields.getTextInputValue('reason');
            await current.save();
            await int.reply({
                content: channelLanguage.get('modalEditSuccess'),
                ephemeral: true,
            });
            if(!msg?.editable) return;
            const reasonIndex = embed.data.fields.findIndex(e => (e.name === channelLanguage.get('banEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('banEmbedReasonTitle'),
                value: current.reason
            };
            if(reasonIndex === -1){
                embed.addFields(reasonField);
            }
            else{
                embed.spliceFields(reasonIndex, 1, reasonField);
            }
            await msg.edit({embeds: [embed]});
        })().catch(err => message.client.handlers.button(err, i)));
        collectorEdit.on('end', async () => {
            if(!reply.editable) return;
            buttonEdit.disabled = true;
            await reply.edit({components});
        });
    },
    executeSlash: async (interaction, args) => {
        let {channelLanguage} = interaction;
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
        if(args.target.member){
            if(!args.target.member.bannable) return await lastInteraction.reply({
                content: channelLanguage.get('cantBan'),
                ephemeral: true,
            });
            if(lastInteraction.member.roles.highest.comparePositionTo(args.target.member.roles.highest) <= 0) return await lastInteraction.reply({
                content: channelLanguage.get('youCantBan'),
                ephemeral: true,
            });
            await args.target.send(channelLanguage.get('dmBanned', [lastInteraction.guild.name, reason])).catch(() => null);
        }
        else{
            const ban = await lastInteraction.guild.bans.fetch(args.target.id).catch(() => null);
            if(ban) return await lastInteraction.reply({
                content: channelLanguage.get('alreadyBanned'),
                ephemeral: true,
            });
        }
        const newban = await lastInteraction.guild.members.ban(args.target.id, {
            reason: channelLanguage.get('banReason', [lastInteraction.user.tag, reason]),
            deleteMessageSeconds: (
                args.prune_days
                ??
                lastInteraction.client.guildData.get(lastInteraction.guild.id).pruneBan
            ) * 24 * 60 * 60,
        }).catch(() => null);
        if(!newban) return await lastInteraction.reply({
            content: channelLanguage.get('cantBan'),
            ephemeral: true,
        });
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(lastInteraction.guild.id, {$inc: {counterLogs: 1}});
        lastInteraction.client.guildData.get(lastInteraction.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const log = require('../../schemas/log.js');
        const current = new log({
            id: guildDoc.counterLogs,
            guild: lastInteraction.guild.id,
            type: 'ban',
            target: args.target.id,
            executor: lastInteraction.user.id,
            timeStamp: Date.now(),
            reason,
        });
        await current.save();
        const reply = await lastInteraction.reply({
            content: channelLanguage.get('memberBanSuccess', [current.id]),
            fetchReply: true,
        });
        current.actionMessage = reply.url;
        await current.save();
        const discordChannel = lastInteraction.guild.channels.cache.get(lastInteraction.client.guildData.get(lastInteraction.guild.id).modlogs.ban);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(lastInteraction.guild.members.me).has(PermissionsBitField.Flags.SendMessages) && discordChannel.permissionsFor(lastInteraction.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)){
            embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setAuthor({
                    name: channelLanguage.get('banEmbedAuthor', [lastInteraction.user.tag, args.target.tag]),
                    iconURL: args.target.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('banEmbedDescription', [reply.url]))
                .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [args.target]), true)
                .addField(channelLanguage.get('banEmbedExecutorTitle'), lastInteraction.user.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('banEmbedFooter', [current.id]),
                    iconURL: lastInteraction.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('banEmbedReasonTitle'), reason)
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
            filter: componentInteraction => ((componentInteraction.user.id === lastInteraction.user.id) && (componentInteraction.customId === 'undo')),
            idle: 10_000,
            max: 1,
            componentType: ComponentType.Button,
        });
        collectorUndo.on('collect', i => (async () => {
            await lastInteraction.guild.members.unban(args.target.id, channelLanguage.get('unbanAuditReason', [lastInteraction.user.tag]))
            const guildDocUnban = await guild.findByIdAndUpdate(lastInteraction.guild.id, {$inc: {counterLogs: 1}});
            lastInteraction.client.guildData.get(lastInteraction.guild.id).counterLogs = guildDocUnban.counterLogs + 1;
            const currentUnban = new log({
                id: guildDocUnban.counterLogs,
                guild: lastInteraction.guild.id,
                type: 'ban',
                target: args.target.id,
                executor: lastInteraction.user.id,
                timeStamp: Date.now(),
                removal: true,
            });
            await currentUnban.save();
            const action = await i.reply({
                content: channelLanguage.get('unbanSuccess', [currentUnban.id]),
                fetchReply: true,
            });
            currentUnban.actionMessage = action.url;
            await currentUnban.save();
            if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(lastInteraction.guild.members.me).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.permissionsFor(lastInteraction.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)) return;
            const embedUnban = new EmbedBuilder()
                .setColor(0x00ff00)
                .setAuthor({
                    name: channelLanguage.get('unbanEmbedAuthor', [lastInteraction.user.tag, args.target.tag]),
                    iconURL: args.target.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('unbanEmbedDescription', [action.url]))
                .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [args.target]), true)
                .addField(channelLanguage.get('unbanEmbedExecutorTitle'), lastInteraction.user.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('unbanEmbedFooter', [currentUnban.id]),
                    iconURL: lastInteraction.guild.iconURL({dynamic: true}),
                });
            const msgUnban = await discordChannel.send({embeds: [embedUnban]});
            currentUnban.logMessage = msgUnban.id;
            await currentUnban.save();
        })().catch(err => lastInteraction.client.handlers.button(err, i)));
        collectorUndo.on('end', async () => {
            if(!reply.editable) return;
            buttonUndo.disabled = true;
            await lastInteraction.editReply({components});
        });
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => ((componentInteraction.user.id === lastInteraction.user.id) && (componentInteraction.customId === 'edit')),
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
                filter: int => (int.user.id === lastInteraction.user.id) && (int.customId === `modalEdit${i.id}`),
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
            const reasonIndex = embed.data.fields.findIndex(e => (e.name === channelLanguage.get('banEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('banEmbedReasonTitle'),
                value: current.reason
            };
            if(reasonIndex === -1){
                embed.addFields(reasonField);
            }
            else{
                embed.spliceFields(reasonIndex, 1, reasonField);
            }
            await msg.edit({embeds: [embed]});
        })().catch(err => lastInteraction.client.handlers.button(err, i)));
        collectorEdit.on('end', async () => {
            if(!reply.editable) return;
            buttonEdit.disabled = true;
            await lastInteraction.editReply({components});
        });
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'target',
            nameLocalizations: utils.getStringLocales('banOptiontargetLocalisedName'),
            description: 'The user to ban',
            descriptionLocalizations: utils.getStringLocales('banOptiontargetLocalisedDesc'),
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'with_reason',
            nameLocalizations: utils.getStringLocales('banOptionwith_reasonLocalisedName'),
            description: 'Whether to prompt a modal asking for the ban reason',
            descriptionLocalizations: utils.getStringLocales('banOptionwith_reasonLocalisedDesc'),
            required: false,
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'prune_days',
            nameLocalizations: utils.getStringLocales('banOptionprune_daysLocalisedName'),
            description: 'Number of days of messages to delete, overrides the default settings for this',
            descriptionLocalizations: utils.getStringLocales('banOptionprune_daysLocalisedDesc'),
            maxValue: 7,
            minValue: 0,
            required: false,
        },
    ],
};