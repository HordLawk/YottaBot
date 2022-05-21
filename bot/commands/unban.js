const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');
const locale = require('../../locale');

const getStringLocales = key => [...locale.values()].reduce((acc, e) => e.get(key) ? {...acc, [e.code]: e.get(key)} : acc, {});

module.exports = {
    active: true,
    name: 'unban',
    description: lang => lang.get('unbanDescription'),
    usage: lang => [lang.get('unbanUsage')],
    example: ['@LordHawk apologised'],
    cooldown: 5,
    categoryID: 3,
    args: true,
    guildOnly: true,
    perm: Permissions.FLAGS.BAN_MEMBERS,
    execute: async (message, args) => {
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.reply(channelLanguage.get('invUser'));
        const ban = await message.guild.bans.fetch(id).catch(() => null);
        if(!ban) return message.reply(channelLanguage.get('invBanned'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        if(!message.guild.me.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) return message.reply(channelLanguage.get('cantUnban'));
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'ban',
            target: ban.user.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
            removal: true,
        });
        await current.save();
        await message.guild.members.unban(ban.user.id, channelLanguage.get('unbanAuditReason', [message.author.tag, reason]));
        const reply = await message.reply(channelLanguage.get('unbanSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) && discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.EMBED_LINKS)){
            embed = new MessageEmbed()
                .setColor(0x00ff00)
                .setAuthor({
                    name: channelLanguage.get('unbanEmbedAuthor', [message.author.tag, ban.user.tag]),
                    iconURL: ban.user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('unbanEmbedDescription', [message.url]))
                .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [ban.user]), true)
                .addField(channelLanguage.get('unbanEmbedExecutorTitle'), message.author.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('unbanEmbedFooter', [current.id]),
                    iconURL: message.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('unbanEmbedReasonTitle'), reason);
            if(current.image) embed.setImage(current.image);
            msg = await discordChannel.send({embeds: [embed]});
            current.logMessage = msg.id;
            await current.save();
        }
        const buttonEdit = {
            type: 'BUTTON',
            label: channelLanguage.get('editReason'),
            customId: 'edit',
            style: 'PRIMARY',
            emoji: '✏️',
        };
        const components = [{
            type: 'ACTION_ROW',
            components: [buttonEdit],
        }];
        await reply.edit({components});
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => ((componentInteraction.user.id === message.author.id) && (componentInteraction.customId === 'edit')),
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
            const reasonIndex = embed.fields.findIndex(e => (e.name === channelLanguage.get('unbanEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('unbanEmbedReasonTitle'),
                value: current.reason,
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
        const {channelLanguage} = interaction;
        const ban = await interaction.guild.bans.fetch(args.target).catch(() => null);
        if(!ban) return await interaction.reply({
            content: channelLanguage.get('invBanned'),
            ephemeral: true,
        });
        await interaction.showModal({
            customId: `modalReason${interaction.id}`,
            title: channelLanguage.get('setReasonModalTitle'),
            components: [{
                type: 'ACTION_ROW',
                components: [{
                    type: 'TEXT_INPUT',
                    customId: 'reason',
                    label: channelLanguage.get('setReasonModalReasonLabel'),
                    style: 'PARAGRAPH',
                    maxLength: 500,
                    placeholder: channelLanguage.get('optionalInput'),
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
        if(!interaction.guild.me.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) return await i.reply({
            content: channelLanguage.get('cantUnban'),
            ephemeral: true,
        });
        const guildDoc = await guild.findByIdAndUpdate(interaction.guild.id, {$inc: {counterLogs: 1}});
        interaction.client.guildData.get(interaction.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: interaction.guild.id,
            type: 'ban',
            target: args.target,
            executor: interaction.user.id,
            timeStamp: Date.now(),
            reason,
            removal: true,
        });
        await current.save();
        await interaction.guild.members.unban(ban.user, channelLanguage.get('unbanAuditReason', [interaction.user.tag, reason]));
        const reply = await i.reply({
            content: channelLanguage.get('unbanSuccess', [current.id]),
            fetchReply: true,
        });
        current.actionMessage = reply.url;
        await current.save();
        const discordChannel = interaction.guild.channels.cache.get(interaction.client.guildData.get(interaction.guild.id).modlogs.ban);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(interaction.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) && discordChannel.permissionsFor(interaction.guild.me).has(Permissions.FLAGS.EMBED_LINKS)){
            embed = new MessageEmbed()
                .setColor(0x00ff00)
                .setAuthor({
                    name: channelLanguage.get('unbanEmbedAuthor', [interaction.user.tag, ban.user.tag]),
                    iconURL: ban.user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('unbanEmbedDescription', [reply.url]))
                .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [ban.user]), true)
                .addField(channelLanguage.get('unbanEmbedExecutorTitle'), interaction.user.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('unbanEmbedFooter', [current.id]),
                    iconURL: interaction.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('unbanEmbedReasonTitle'), reason);
            msg = await discordChannel.send({embeds: [embed]});
            current.logMessage = msg.id;
            await current.save();
        }
        const buttonEdit = {
            type: 'BUTTON',
            label: channelLanguage.get('editReason'),
            customId: 'edit',
            style: 'PRIMARY',
            emoji: '✏️',
        };
        const components = [{
            type: 'ACTION_ROW',
            components: [buttonEdit],
        }];
        await i.editReply({components});
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => ((componentInteraction.user.id === interaction.user.id) && (componentInteraction.customId === 'edit')),
            time: 60_000,
            componentType: 'BUTTON',
        });
        collectorEdit.on('collect', int => (async () => {
            await int.showModal({
                customId: `modalEdit${int.id}`,
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
            const inte = await int.awaitModalSubmit({
                filter: inte => (inte.user.id === interaction.user.id) && (inte.customId === `modalEdit${int.id}`),
                time: 600_000,
            }).catch(() => null);
            if(!inte) return await int.followUp({
                content: channelLanguage.get('modalTimeOut'),
                ephemeral: true,
            });
            current.reason = inte.fields.getTextInputValue('reason');
            await current.save();
            await inte.reply({
                content: channelLanguage.get('modalEditSuccess'),
                ephemeral: true,
            });
            if(!msg?.editable) return;
            const reasonIndex = embed.fields.findIndex(e => (e.name === channelLanguage.get('unbanEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('unbanEmbedReasonTitle'),
                value: current.reason,
            };
            if(reasonIndex === -1){
                embed.addFields(reasonField);
            }
            else{
                embed.spliceFields(reasonIndex, 1, reasonField);
            }
            await msg.edit({embeds: [embed]});
        })().catch(err => interaction.client.handlers.button(err, int)));
        collectorEdit.on('end', async () => {
            if(!reply.editable) return;
            buttonEdit.disabled = true;
            await i.editReply({components});
        });
    },
    slashOptions: [{
        type: 'STRING',
        name: 'target_id',
        nameLocalizations: getStringLocales('unbanOptiontargetLocalisedName'),
        description: 'The ID of the user to unban',
        descriptionLocalizations: getStringLocales('unbanOptiontargetLocalisedDesc'),
        required: true,
        autocomplete: true,
    }],
    commandAutocomplete: {
        target: (interaction, value) => interaction.respond(interaction.guild.bans.cache.filter(e => e.user.tag.toLowerCase().startsWith(value.toLowerCase())).first(25).map(e => ({
            name: e.user.tag,
            value: e.user.id,
        }))),
    },
};