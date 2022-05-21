const role = require('../../schemas/role.js');
const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {Permissions, MessageEmbed} = require('discord.js');

module.exports = {
    name: 'MESSAGE_COMPONENT',
    execute: async interaction => {
        const banid = interaction.customId.match(/^banjoined(\d{17,19})$/)?.[1];
        if(banid){
            const channelLanguage = interaction.client.langs[interaction.client.guildData.get(interaction.guild.id).language];
            if(!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)){
                const roles = await role.find({
                    guild: interaction.guild.id,
                    roleID: {$in: interaction.member.roles.cache.map(e => e.id)},
                    "commandPermissions._id": 'ban',
                });
                if((!roles.length && !interaction.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) || (roles.length && roles.some(e => !e.commandPermissions.id('ban').allow) && !roles.some(e => e.commandPermissions.id('ban').allow))) return await interaction.reply({
                    content: channelLanguage.get('forbidden'),
                    ephemeral: true,
                });
            }
            const user = await interaction.client.users.fetch(banid).catch(() => null);
            if(!user) throw new Error('User not found');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if(member){
                if(!member.bannable) return await interaction.reply({
                    content: channelLanguage.get('cantBan'),
                    ephemeral: true,
                });
                if(interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return await interaction.reply({
                    content: channelLanguage.get('youCantBan'),
                    ephemeral: true,
                });
                await member.send(channelLanguage.get('dmBanned', [interaction.guild.name])).catch(() => null);
            }
            else{
                const ban = await interaction.guild.bans.fetch(user.id).catch(() => null);
                if(ban) return await interaction.reply({
                    content: channelLanguage.get('alreadyBanned'),
                    ephemeral: true,
                });
            }
            const newban = await interaction.guild.members.ban(user.id, {
                reason: channelLanguage.get('banReason', [interaction.user.tag]),
                days: interaction.client.guildData.get(interaction.guild.id).pruneBan,
            }).catch(() => null);
            if(!newban) return await interaction.reply({
                content: channelLanguage.get('cantBan'),
                ephemeral: true,
            });
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
            const reply = await interaction.reply({
                content: channelLanguage.get('memberBanSuccess', [current.id]),
                ephemeral: true,
                fetchReply: true,
            });
            const discordChannel = interaction.guild.channels.cache.get(interaction.client.guildData.get(interaction.guild.id).modlogs.ban);
            let banLogMsg;
            let banLogEmbed;
            if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(interaction.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) && discordChannel.permissionsFor(interaction.guild.me).has(Permissions.FLAGS.EMBED_LINKS)){
                banLogEmbed = new MessageEmbed()
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
                type: 'BUTTON',
                label: channelLanguage.get('undo'),
                customId: 'undo',
                style: 'DANGER',
                emoji: '↩️',
            };
            const buttonEdit = {
                type: 'BUTTON',
                label: channelLanguage.get('editReason'),
                customId: 'edit',
                style: 'PRIMARY',
                emoji: '✏️',
            };
            const components = [{
                type: 'ACTION_ROW',
                components: [buttonEdit, buttonUndo],
            }];
            await interaction.editReply({components});
            const collectorUndo = reply.createMessageComponentCollector({
                filter: componentInteraction => ((componentInteraction.user.id === interaction.user.id) && (componentInteraction.customId === 'undo')),
                idle: 10000,
                max: 1,
                componentType: 'BUTTON',
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
                if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(interaction.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(interaction.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
                const embedUnban = new MessageEmbed()
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
            })(i).catch(err => interaction.client.handlers.button(err, i)))
            collectorUndo.on('end', async () => {
                if(!reply.editable) return;
                buttonUndo.disabled = true;
                await interaction.editReply({components});
            });
            const collectorEdit = reply.createMessageComponentCollector({
                filter: componentInteraction => ((componentInteraction.user.id === interaction.user.id) && (componentInteraction.customId === 'edit')),
                time: 60_000,
                componentType: 'BUTTON',
            });
            collectorEdit.on('collect', i => (async () => {
                await i.showModal({
                    customId: `modalEdit${i.id}`,
                    title: channelLanguage.get('editReasonModalTitle'),
                    components: [{
                        type: 'ACTION_ROW',
                        components: [{
                            type: 'TEXT_INPUT',
                            customId: 'reason',
                            label: channelLanguage.get('editReasonModalReasonLabel'),
                            required: true,
                            style: 'PARAGRAPH',
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
                const reasonIndex = banLogEmbed.fields.findIndex(e => (e.name === channelLanguage.get('banEmbedReasonTitle')));
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
            })().catch(err => interaction.client.handlers.button(err, i)));
            collectorEdit.on('end', async () => {
                if(!reply.editable) return;
                buttonEdit.disabled = true;
                await interaction.editReply({components});
            });
        }
    },
};