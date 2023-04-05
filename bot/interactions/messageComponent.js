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

const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {PermissionsBitField, EmbedBuilder, TextInputStyle, ButtonStyle, ComponentType, InteractionType} = require('discord.js');
const locale = require('../../locale');
const { handleComponentError } = require('../utils.js');
const workflows = require('../workflows');

module.exports = {
    type: InteractionType.MessageComponent,
    execute: async interaction => {
        const wfAdress = interaction.customId.split(':');
        if(wfAdress[0] === 'wf') return await workflows.get(wfAdress[1]).steps[wfAdress[2]](interaction);
        const banid = interaction.customId.match(/^banjoined(\d{17,19})$/)?.[1];
        if(banid){
            const channelLanguage = locale.get(interaction.client.guildData.get(interaction.guild.id).language);
            if(!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return await interaction.reply({
                content: channelLanguage.get('forbidden'),
                ephemeral: true,
            });
            const reply = await interaction.deferReply({
                ephemeral: true,
                fetchReply: true,
            });
            const user = await interaction.client.users.fetch(banid).catch(() => null);
            if(!user) throw new Error('User not found');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if(member){
                if(!member.bannable) return await interaction.editReply(channelLanguage.get('cantBan'));
                if(interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0){
                    return await interaction.editReply(channelLanguage.get('youCantBan'));
                }
                await member.send(channelLanguage.get('dmBanned', [interaction.guild.name])).catch(() => null);
            }
            else{
                const ban = await interaction.guild.bans.fetch(user.id).catch(() => null);
                if(ban) return await interaction.editReply(channelLanguage.get('alreadyBanned'));
            }
            const newban = await interaction.guild.members.ban(user.id, {
                reason: channelLanguage.get('banReason', [interaction.user.tag]),
                deleteMessageSeconds: interaction.client.guildData.get(interaction.guild.id).pruneBan * 24 * 60 * 60,
            }).catch(() => null);
            if(!newban) return await interaction.editReply(channelLanguage.get('cantBan'));
            const guildDoc = await guild.findByIdAndUpdate(interaction.guild.id, {$inc: {counterLogs: 1}});
            interaction.client.guildData.get(interaction.guild.id).counterLogs = guildDoc.counterLogs + 1;
            const current = new log({
                id: guildDoc.counterLogs,
                guild: interaction.guild.id,
                type: 'ban',
                target: user.id,
                executor: interaction.user.id,
                timeStamp: Date.now(),
                actionMessage: interaction.message.url,
            });
            await current.save();
            await interaction.editReply(channelLanguage.get('memberBanSuccess', [current.id]));
            const discordChannel = interaction.guild.channels.cache.get(interaction.client.guildData.get(interaction.guild.id).modlogs.ban);
            let banLogMsg;
            let banLogEmbed;
            if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages) && discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)){
                banLogEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setAuthor({
                        name: channelLanguage.get('banEmbedAuthor', [interaction.user.tag, user.tag]),
                        iconURL: user.displayAvatarURL({dynamic: true}),
                    })
                    .setDescription(channelLanguage.get('banEmbedDescription', [interaction.message.url]))
                    .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [user]), true)
                    .addField(channelLanguage.get('banEmbedExecutorTitle'), interaction.user.toString(), true)
                    .setTimestamp()
                    .setFooter({
                        text: channelLanguage.get('banEmbedFooter', [current.id]),
                        iconURL: interaction.guild.iconURL({dynamic: true}),
                    });
                banLogMsg = await discordChannel.send({embeds: [banLogEmbed]});
                current.logMessage = banLogMsg.id;
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
            await interaction.editReply({components});
            const collectorUndo = reply.createMessageComponentCollector({
                filter: componentInteraction => ((componentInteraction.user.id === interaction.user.id) && (componentInteraction.customId === 'undo')),
                idle: 10000,
                max: 1,
                componentType: ComponentType.Button,
            });
            collectorUndo.on('collect', i => (async i => {
                await interaction.guild.members.unban(user.id, channelLanguage.get('unbanAuditReason', [interaction.user.tag]))
                const guildDocUnban = await guild.findByIdAndUpdate(interaction.guild.id, {$inc: {counterLogs: 1}});
                interaction.client.guildData.get(interaction.guild.id).counterLogs = guildDocUnban.counterLogs + 1;
                const currentUnban = new log({
                    id: guildDocUnban.counterLogs,
                    guild: interaction.guild.id,
                    type: 'ban',
                    target: user.id,
                    executor: interaction.user.id,
                    timeStamp: Date.now(),
                    removal: true,
                });
                await currentUnban.save();
                const action = await i.reply({
                    content: channelLanguage.get('unbanSuccess', [currentUnban.id]),
                    ephemeral: true,
                    fetchReply: true,
                });
                currentUnban.actionMessage = action.url;
                await currentUnban.save();
                if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)) return;
                const embedUnban = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setAuthor({
                        name: channelLanguage.get('unbanEmbedAuthor', [interaction.user.tag, user.tag]),
                        iconURL: user.displayAvatarURL({dynamic: true}),
                    })
                    .setDescription(channelLanguage.get('unbanEmbedDescription', [action.url]))
                    .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [user]), true)
                    .addField(channelLanguage.get('unbanEmbedExecutorTitle'), interaction.user.toString(), true)
                    .setTimestamp()
                    .setFooter({
                        text: channelLanguage.get('unbanEmbedFooter', [currentUnban.id]),
                        iconURL: interaction.guild.iconURL({dynamic: true}),
                    });
                const msgUnban = await discordChannel.send({embeds: [embedUnban]});
                currentUnban.logMessage = msgUnban.id;
                await currentUnban.save();
            })(i).catch(async err => await handleComponentError(err, i)))
            collectorUndo.on('end', async () => {
                if(!reply.editable) return;
                buttonUndo.disabled = true;
                await interaction.editReply({components});
            });
            const collectorEdit = reply.createMessageComponentCollector({
                filter: componentInteraction => ((componentInteraction.user.id === interaction.user.id) && (componentInteraction.customId === 'edit')),
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
                if(!banLogMsg?.editable) return;
                const reasonIndex = banLogEmbed.data.fields.findIndex(e => (e.name === channelLanguage.get('banEmbedReasonTitle')));
                const reasonField = {
                    name: channelLanguage.get('banEmbedReasonTitle'),
                    value: current.reason
                };
                if(reasonIndex === -1){
                    banLogEmbed.addFields(reasonField);
                }
                else{
                    banLogEmbed.spliceFields(reasonIndex, 1, reasonField);
                }
                await banLogMsg.edit({embeds: [banLogEmbed]});
            })().catch(async err => await handleComponentError(err, i)));
            collectorEdit.on('end', async () => {
                if(!reply.editable) return;
                buttonEdit.disabled = true;
                await interaction.editReply({components});
            });
        }
    },
};