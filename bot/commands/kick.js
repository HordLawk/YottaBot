const {MessageEmbed, Permissions} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'kick',
    description: lang => lang.get('kickDescription'),
    aliases: ['k'],
    usage: lang => [lang.get('kickUsage')],
    example: ['@LordHawk#0001 come back when you stop being annoying'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: Permissions.FLAGS.KICK_MEMBERS,
    guildOnly: true,
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.reply(channelLanguage.get('invMember'));
        if(!member.kickable) return message.reply(channelLanguage.get('cantKick'));
        if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0){
            return message.reply(channelLanguage.get('youCantKick'));
        }
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const log = require('../../schemas/log.js');
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'kick',
            target: member.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
        });
        await current.save();
        await member.kick(channelLanguage.get('kickAuditReason', [message.author.tag, reason]));
        const reply = await message.reply(channelLanguage.get('kickSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(
            message.client.guildData.get(message.guild.id).modlogs.kick
        );
        let msg;
        let embed;
        if(
            discordChannel
            &&
            discordChannel.viewable
            &&
            discordChannel
                .permissionsFor(message.guild.me)
                .has(Permissions.FLAGS.SEND_MESSAGES)
            &&
            discordChannel
                .permissionsFor(message.guild.me)
                .has(Permissions.FLAGS.EMBED_LINKS)
        ){
            embed = new MessageEmbed()
                .setColor(0xffbf00)
                .setAuthor({
                    name: channelLanguage.get('kickEmbedAuthor', [message.author.tag, member.user.tag]),
                    iconURL: member.user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('kickEmbedDescription', [message.url]))
                .addField(
                    channelLanguage.get('kickEmbedTargetTitle'),
                    channelLanguage.get(
                        'kickEmbedTargetValue',
                        [
                            member,
                            member.id,
                        ]
                    ),
                    true
                )
                .addField(channelLanguage.get('kickEmbedExecutorTitle'), message.author.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('kickEmbedFooter', [current.id]),
                    iconURL: message.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('kickEmbedReasonTitle'), reason);
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
            filter: componentInteraction => (
                (componentInteraction.user.id === message.author.id)
                &&
                (componentInteraction.customId === 'edit')
            ),
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
            const reasonIndex = embed.fields.findIndex(e => (e.name === channelLanguage.get('kickEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('kickEmbedReasonTitle'),
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
        if(!args.target.member) return await interaction.reply({
            content: channelLanguage.get('invMember'),
            ephemeral: true,
        });
        if(!args.target.member.kickable) return await interaction.reply({
            content: channelLanguage.get('cantKick'),
            ephemeral: true,
        });
        if(interaction.member.roles.highest.comparePositionTo(args.target.member.roles.highest) <= 0){
            return await interaction.reply({
                content: channelLanguage.get('youCantKick'),
                ephemeral: true,
            });
        }
        let reason;
        let lastInteraction = interaction;
        if(args.with_reason){
            await interaction.showModal({
                customId: `modalReason${interaction.id}`,
                title: channelLanguage.get('setReasonModalTitle'),
                components: [{
                    type: 'ACTION_ROW',
                    components: [{
                        type: 'TEXT_INPUT',
                        customId: 'reason',
                        label: channelLanguage.get('setReasonModalReasonLabel'),
                        required: true,
                        style: 'PARAGRAPH',
                        maxLength: 500,
                    }],
                }],
            });
            const i = await interaction.awaitModalSubmit({
                filter: int => (
                    (int.user.id === interaction.user.id)
                    &&
                    (int.customId === `modalReason${interaction.id}`)
                ),
                time: 600_000,
            }).catch(() => null);
            if(!i) return await interaction.followUp({
                content: channelLanguage.get('modalTimeOut'),
                ephemeral: true,
            });
            reason = i.fields.getTextInputValue('reason');
            lastInteraction = i;
        }
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(lastInteraction.guild.id, {$inc: {counterLogs: 1}});
        lastInteraction.client.guildData.get(lastInteraction.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const log = require('../../schemas/log.js');
        const current = new log({
            id: guildDoc.counterLogs,
            guild: lastInteraction.guild.id,
            type: 'kick',
            target: args.target.id,
            executor: lastInteraction.user.id,
            timeStamp: Date.now(),
            reason,
        });
        await current.save();
        await args.target.member.kick(channelLanguage.get('kickAuditReason', [lastInteraction.user.tag, reason]));
        const reply = await lastInteraction.reply({
            content: channelLanguage.get('kickSuccess', [current.id]),
            fetchReply: true,
        });
        current.actionMessage = reply.url;
        await current.save();
        const discordChannel = lastInteraction.guild.channels.cache.get(
            lastInteraction.client.guildData.get(lastInteraction.guild.id).modlogs.kick
        );
        let msg;
        let embed;
        if(
            discordChannel
            &&
            discordChannel.viewable
            &&
            discordChannel
                .permissionsFor(lastInteraction.guild.me)
                .has(Permissions.FLAGS.SEND_MESSAGES)
            &&
            discordChannel
                .permissionsFor(lastInteraction.guild.me)
                .has(Permissions.FLAGS.EMBED_LINKS)
        ){
            embed = new MessageEmbed()
                .setColor(0xffbf00)
                .setAuthor({
                    name: channelLanguage.get('kickEmbedAuthor', [lastInteraction.user.tag, args.target.tag]),
                    iconURL: args.target.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('kickEmbedDescription', [reply.url]))
                .addField(
                    channelLanguage.get('kickEmbedTargetTitle'),
                    channelLanguage.get(
                        'kickEmbedTargetValue',
                        [
                            args.target,
                            args.target.id,
                        ]
                    ),
                    true
                )
                .addField(channelLanguage.get('kickEmbedExecutorTitle'), lastInteraction.user.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('kickEmbedFooter', [current.id]),
                    iconURL: lastInteraction.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('kickEmbedReasonTitle'), reason);
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
        await lastInteraction.editReply({components});
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => (
                (componentInteraction.user.id === lastInteraction.user.id)
                &&
                (componentInteraction.customId === 'edit')
            ),
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
            const reasonIndex = embed.fields.findIndex(e => (e.name === channelLanguage.get('kickEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('kickEmbedReasonTitle'),
                value: current.reason,
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
            await interaction.editReply({components});
        });
    },
    slashOptions: [
        {
            type: 'USER',
            name: 'target',
            nameLocalizations: utils.getStringLocales('kickOptiontargetLocalisedName'),
            description: 'The user to kick',
            descriptionLocalizations: utils.getStringLocales('kickOptiontargetLocalisedDesc'),
            required: true,
        },
        {
            type: 'BOOLEAN',
            name: 'with_reason',
            nameLocalizations: utils.getStringLocales('kickOptionwith_reasonLocalisedName'),
            description: 'Whether to prompt a modal asking for the ban reason',
            descriptionLocalizations: utils.getStringLocales('kickOptionwith_reasonLocalisedDesc'),
            required: false,
        },
    ],
};