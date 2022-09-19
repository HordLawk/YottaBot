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
    name: 'unmute',
    description: lang => lang.get('unmuteDescription'),
    usage: lang => [lang.get('unmuteUsage')],
    example: ['@LordHawk#0001 bribed me'],
    cooldown: 5,
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
        if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply(channelLanguage.get('youCantUnmute'));
        if(!member.moderatable) return message.reply(channelLanguage.get('iCantMute'));
        const log = require('../../schemas/log.js');
        const mute = await log.findOneAndUpdate({
            guild: message.guild.id,
            target: id,
            ongoing: true,
            type: 'mute',
        }, {$set: {ongoing: false}});
        if(!mute) return message.reply(channelLanguage.get('invMuted'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'mute',
            target: member.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
            removal: true,
        });
        await current.save();
        await member.timeout(null, current.reason);
        const reply = await message.reply(channelLanguage.get('unmuteSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.mute);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages) && discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)){
            embed = new EmbedBuilder()
                .setColor(0x0000ff)
                .setAuthor({
                    name: channelLanguage.get('unmuteEmbedAuthor', [message.author.tag, member.user.tag]),
                    iconURL: member.user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('unmuteEmbedDescription', [message.url]))
                .addField(channelLanguage.get('unmuteEmbedTargetTitle'), channelLanguage.get('unmuteEmbedTargetValue', [member.id]), true)
                .addField(channelLanguage.get('unmuteEmbedExecutorTitle'), message.author.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('unmuteEmbedFooter', [current.id]),
                    iconURL: message.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('unmuteEmbedReasonTitle'), reason);
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
            const reasonIndex = embed.data.fields.findIndex(e => (e.name === channelLanguage.get('unmuteEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('unmuteEmbedReasonTitle'),
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
        if(interaction.member.roles.highest.comparePositionTo(args.target.member.roles.highest) <= 0) return await interaction.reply({
            content: channelLanguage.get('youCantUnmute'),
            ephemeral: true,
        });
        if(!args.target.member.moderatable) return await interaction.reply({
            content: channelLanguage.get('iCantMute'),
            ephemeral: true,
        });
        const log = require('../../schemas/log.js');
        const mute = await log.findOneAndUpdate({
            guild: interaction.guild.id,
            target: args.target.id,
            ongoing: true,
            type: 'mute',
        }, {$set: {ongoing: false}});
        if(!mute) return await interaction.reply({
            content: channelLanguage.get('invMuted'),
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
        const current = new log({
            id: guildDoc.counterLogs,
            guild: interaction.guild.id,
            type: 'mute',
            target: args.target.id,
            executor: interaction.user.id,
            timeStamp: Date.now(),
            reason,
            removal: true,
        });
        await current.save();
        await args.target.member.timeout(null, current.reason);
        const reply = await i.reply({
            content: channelLanguage.get('unmuteSuccess', [current.id]),
            fetchReply: true,
        });
        current.actionMessage = reply.url;
        await current.save();
        const discordChannel = interaction.guild.channels.cache.get(interaction.client.guildData.get(interaction.guild.id).modlogs.mute);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages) && discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)){
            embed = new EmbedBuilder()
                .setColor(0x0000ff)
                .setAuthor({
                    name: channelLanguage.get('unmuteEmbedAuthor', [interaction.user.tag, args.target.tag]),
                    iconURL: args.target.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('unmuteEmbedDescription', [reply.url]))
                .addField(channelLanguage.get('unmuteEmbedTargetTitle'), channelLanguage.get('unmuteEmbedTargetValue', [args.target.id]), true)
                .addField(channelLanguage.get('unmuteEmbedExecutorTitle'), interaction.user.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('unmuteEmbedFooter', [current.id]),
                    iconURL: interaction.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('unmuteEmbedReasonTitle'), reason);
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
            })
            current.reason = inte.fields.getTextInputValue('reason');
            await current.save();
            await inte.reply({
                content: channelLanguage.get('modalEditSuccess'),
                ephemeral: true,
            });
            if(!msg?.editable) return;
            const reasonIndex = embed.data.fields.findIndex(e => (e.name === channelLanguage.get('unmuteEmbedReasonTitle')));
            const reasonField = {
                name: channelLanguage.get('unmuteEmbedReasonTitle'),
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
            await reply.edit({components});
        });
    },
    slashOptions: [{
        type: ApplicationCommandOptionType.User,
        name: 'target',
        nameLocalizations: utils.getStringLocales('unmuteOptiontargetLocalisedName'),
        description: 'The user to unmute',
        descriptionLocalizations: utils.getStringLocales('unmuteOptiontargetLocalisedDesc'),
        required: true,
    }],
};