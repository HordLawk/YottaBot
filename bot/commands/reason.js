const {Permissions} = require('discord.js');
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
    perm: Permissions.FLAGS.MODERATE_MEMBERS,
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
        ) return message.reply(
            channelLanguage.get(
                'invArgs',
                [
                    message.client.guildData.get(message.guild.id).prefix,
                    this.name,
                    this.usage(channelLanguage),
                ]
            )
        );
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
                .permissionsFor(message.guild.me)
                .has(Permissions.FLAGS.EMBED_LINKS)
            ||
            !discordChannel
                .permissionsFor(message.guild.me)
                .has(Permissions.FLAGS.SEND_MESSAGES)
        ) return;
        const msg = await discordChannel.messages.fetch(current.logMessage).catch(() => null);
        if(!msg || !msg.editable || !msg.embeds.length) return;
        const embed = msg.embeds[0];
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
                type: 'ACTION_ROW',
                components: [{
                    type: 'TEXT_INPUT',
                    customId: 'reason',
                    label: channelLanguage.get('editReasonModalReasonLabel'),
                    required: true,
                    style: 'PARAGRAPH',
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
                .permissionsFor(interaction.guild.me)
                .has(Permissions.FLAGS.EMBED_LINKS)
            ||
            !discordChannel
                .permissionsFor(interaction.guild.me)
                .has(Permissions.FLAGS.SEND_MESSAGES)
        ) return;
        const msg = await discordChannel.messages.fetch(current.logMessage).catch(() => null);
        if(!msg?.editable || !msg.embeds.length) return;
        const embed = msg.embeds[0];
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
        type: 'INTEGER',
        name: 'case_id',
        nameLocalizations: utils.getStringLocales('reasonOptioncase_idLocalisedName'),
        description: 'The ID of the case to edit the reason of',
        descriptionLocalizations: utils.getStringLocales('reasonOptioncase_idLocalisedDesc'),
        required: true,
        minValue: 0,
    }],
};