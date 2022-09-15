const {
    EmbedBuilder,
    PermissionsBitField,
    ApplicationCommandOptionType,
    TextInputStyle,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'warn',
    description: lang => lang.get('warnDescription'),
    aliases: ['adv', 'advert'],
    usage: lang => [lang.get('warnUsage')],
    example: ['@LordHawk#0001 stop spamming'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: PermissionsBitField.Flags.ModerateMembers,
    guildOnly: true,
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.reply(channelLanguage.get('invMember'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        if(member.user.bot) return message.reply(channelLanguage.get('cantWarnBot'));
        if((message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) || (message.guild.ownerId === member.id)) return message.reply(channelLanguage.get('youCantWarn'));
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const log = require('../../schemas/log.js');
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'warn',
            target: member.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
        });
        await current.save();
        await member.user.send(channelLanguage.get('dmWarned', [message.guild.name, reason])).catch(() => message.reply(channelLanguage.get('warnedBlockedDms')));
        const reply = await message.reply(channelLanguage.get('warnSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.warn);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages) && discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)){
            embed = new EmbedBuilder()
                .setColor(0xffff00)
                .setAuthor({
                    name: channelLanguage.get('warnEmbedAuthor', [message.author.tag, member.user.tag]),
                    iconURL: member.user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('warnEmbedDescription', [message.url]))
                .addField(channelLanguage.get('warnEmbedTargetTitle'), channelLanguage.get('warnEmbedTargetValue', [member]), true)
                .addField(channelLanguage.get('warnEmbedExecutorTitle'), message.author.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('warnEmbedFooter', [current.id]),
                    iconURL: message.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('warnEmbedReasonTitle'), reason);
            if(current.image) embed.setImage(current.image);
            msg = await discordChannel.send({embeds: [embed]});
            current.logMessage = msg.id;
            await current.save();
        }
        const buttonEdit = {
            type: ComponentType.Button,
            label: channelLanguage.get('editReason'),
            customId: 'edit',
            style: ButtonStyle.Primary,
            emoji: '✏️',
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonEdit],
        }];
        await reply.edit({components});
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
            });
            current.reason = int.fields.getTextInputValue('reason');
            await current.save();
            await int.reply({
                content: channelLanguage.get('modalEditSuccess'),
                ephemeral: true,
            });
            if(!msg?.editable) return;
            const reasonIndex = embed.fields.findIndex(e => (e.name === channelLanguage.get('warnEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('warnEmbedReasonTitle'),
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
        if(interaction.isUserContextMenuCommand()){
            args.target = interaction.targetUser;
            args.target.member = interaction.targetMember;
        }
        const {channelLanguage} = interaction;
        if(!args.target.member) return await interaction.reply({
            content: channelLanguage.get('invMember'),
            ephemeral: true,
        });
        if(args.target.bot) return await interaction.reply({
            content: channelLanguage.get('cantWarnBot'),
            ephemeral: true,
        });
        if((interaction.member.roles.highest.comparePositionTo(args.target.member.roles.highest) <= 0) || (interaction.guild.ownerId === args.target.id)) return await interaction.reply({
            content: channelLanguage.get('youCantWarn'),
            ephemeral: true,
        });
        await interaction.showModal({
            customId: `modalReason${interaction.id}`,
            title: channelLanguage.get('setReasonModalTitle'),
            components: [{
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.TextInput,
                    customId: 'reason',
                    label: channelLanguage.get('setReasonModalReasonLabel'),
                    style: TextInputStyle.Paragraph,
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
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(interaction.guild.id, {$inc: {counterLogs: 1}});
        interaction.client.guildData.get(interaction.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const log = require('../../schemas/log.js');
        const current = new log({
            id: guildDoc.counterLogs,
            guild: interaction.guild.id,
            type: 'warn',
            target: args.target.id,
            executor: interaction.user.id,
            timeStamp: Date.now(),
            reason,
        });
        await current.save();
        await args.target.send(channelLanguage.get('dmWarned', [interaction.guild.name, reason])).catch(() => {});
        const reply = await i.reply({
            content: channelLanguage.get('warnSuccess', [current.id]),
            fetchReply: true,
        });
        current.actionMessage = reply.url;
        await current.save();
        const discordChannel = interaction.guild.channels.cache.get(interaction.client.guildData.get(interaction.guild.id).modlogs.warn);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages) && discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)){
            embed = new EmbedBuilder()
                .setColor(0xffff00)
                .setAuthor({
                    name: channelLanguage.get('warnEmbedAuthor', [interaction.user.tag, args.target.tag]),
                    iconURL: args.target.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('warnEmbedDescription', [reply.url]))
                .addField(channelLanguage.get('warnEmbedTargetTitle'), channelLanguage.get('warnEmbedTargetValue', [args.target]), true)
                .addField(channelLanguage.get('warnEmbedExecutorTitle'), interaction.user.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('warnEmbedFooter', [current.id]),
                    iconURL: interaction.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('warnEmbedReasonTitle'), reason);
            msg = await discordChannel.send({embeds: [embed]});
            current.logMessage = msg.id;
            await current.save();
        }
        const buttonEdit = {
            type: ComponentType.Button,
            label: channelLanguage.get('editReason'),
            customId: 'edit',
            style: ButtonStyle.Primary,
            emoji: '✏️',
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonEdit],
        }];
        await i.editReply({components});
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => ((componentInteraction.user.id === interaction.user.id) && (componentInteraction.customId === 'edit')),
            time: 60_000,
            componentType: ComponentType.Button,
        });
        collectorEdit.on('collect', int => (async () => {
            await int.showModal({
                customId: `modalEdit${int.id}`,
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
            const reasonIndex = embed.fields.findIndex(e => (e.name === channelLanguage.get('warnEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('warnEmbedReasonTitle'),
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
        type: ApplicationCommandOptionType.User,
        name: 'target',
        nameLocalizations: utils.getStringLocales('warnOptiontargetLocalisedName'),
        description: 'The user to warn',
        descriptionLocalizations: utils.getStringLocales('warnOptiontargetLOcalisedDesc'),
        required: true,
    }],
    contextName: 'Warn',
};