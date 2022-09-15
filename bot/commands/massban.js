const {
    EmbedBuilder,
    PermissionsBitField,
    ApplicationCommandOptionType,
    TextInputStyle,
    ComponentType,
} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'massban',
    description: lang => lang.get('massbanDescription'),
    aliases: ['mb'],
    usage: lang => [lang.get('massbanUsage')],
    example: ['@LordHawk#0001 @Kamikat#7358 annoying raiders'],
    cooldown: 10,
    categoryID: 3,
    args: true,
    perm: PermissionsBitField.Flags.Administrator,
    guildOnly: true,
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const ids = args.map(e => e.match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1]);
        var reasonStart = ids.indexOf(undefined);
        if(!reasonStart) return message.reply(channelLanguage.get('invUser'));
        if(reasonStart === -1) reasonStart = args.length;
        const reason = message.content.replace(new RegExp(`^(?:\\S+\\s+){${reasonStart}}\\S+\\s*`), '').slice(0, 500);
        var bans = 0;
        var invargs = 0;
        var invusers = 0;
        var banneds = 0;
        const caseLogs = [];
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        const log = require('../../schemas/log.js');
        for(let id of [...(new Set(ids.slice(0, reasonStart)))]){
            let user = await message.client.users.fetch(id).catch(() => null);
            if(!user){
                invargs++;
                continue;
            }
            let member = await message.guild.members.fetch(user.id).catch(() => null);
            if(member && (!member.bannable || (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0))) {
                invusers++;
                continue;
            };
            let ban = await message.guild.bans.fetch(user.id).catch(() => null);
            if(ban) {
                banneds++;
                continue;
            };
            let realban = await message.guild.members.ban(user.id, {
                reason: channelLanguage.get('banReason', [message.author.tag, reason]),
                deleteMessageDays: message.client.guildData.get(message.guild.id).pruneBan,
            }).catch(() => null);
            if(!realban){
                invusers++;
                continue;
            }
            bans++;
            let current = new log({
                id: message.client.guildData.get(message.guild.id).counterLogs++,
                guild: message.guild.id,
                type: 'ban',
                target: user.id,
                executor: message.author.id,
                timeStamp: Date.now(),
                actionMessage: message.url,
                reason: reason || null,
                image: message.attachments.first()?.height && message.attachments.first().url,
            });
            caseLogs.push(current);
            if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)) continue;
            let embed = new EmbedBuilder()
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
            let msg = await discordChannel.send({embeds: [embed]});
            caseLogs[caseLogs.length - 1].logMessage = msg.id;
        }
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(message.guild.id, {$set: {counterLogs: message.client.guildData.get(message.guild.id).counterLogs}});
        await log.insertMany(caseLogs);
        await message.reply(channelLanguage.get('massbanSuccess', [bans, invargs, invusers, banneds]));
    },
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const ids = args.targets.split(/\s+/g).map(e => e.match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1]).filter(e => e);
        if(!ids.length) return await interaction.reply({
            content: channelLanguage.get('massbanNoValidIds'),
            ephemeral: true,
        });
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
        let bans = 0;
        let invargs = 0;
        let invusers = 0;
        let banneds = 0;
        const caseLogs = [];
        const discordChannel = interaction.guild.channels.cache.get(interaction.client.guildData.get(interaction.guild.id).modlogs.ban);
        const reply = await lastInteraction.deferReply({fetchReply: true});
        const log = require('../../schemas/log.js');
        for(const id of [...(new Set(ids))].slice(0, (interaction.client.guildData.get(interaction.guild.id).premiumUntil ?? interaction.client.guildData.get(interaction.guild.id).partner) ? 1000 : 300)){
            const user = await interaction.client.users.fetch(id).catch(() => null);
            if(!user){
                invargs++;
                continue;
            }
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if(member && (!member.bannable || (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0))){
                invusers++;
                continue;
            };
            const ban = await interaction.guild.bans.fetch(user.id).catch(() => null);
            if(ban){
                banneds++;
                continue;
            };
            const realban = await interaction.guild.members.ban(user.id, {
                reason: channelLanguage.get('banReason', [interaction.user.tag, reason]),
                deleteMessageDays: interaction.client.guildData.get(interaction.guild.id).pruneBan,
            }).catch(() => null);
            if(!realban){
                invusers++;
                continue;
            }
            bans++;
            const current = new log({
                id: interaction.client.guildData.get(interaction.guild.id).counterLogs++,
                guild: interaction.guild.id,
                type: 'ban',
                target: user.id,
                executor: interaction.user.id,
                timeStamp: Date.now(),
                actionMessage: reply.url,
                reason,
            });
            caseLogs.push(current);
            if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)) continue;
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setAuthor({
                    name: channelLanguage.get('banEmbedAuthor', [interaction.user.tag, user.tag]),
                    iconURL: user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('banEmbedDescription', [reply.url]))
                .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [user]), true)
                .addField(channelLanguage.get('banEmbedExecutorTitle'), interaction.user.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('banEmbedFooter', [current.id]),
                    iconURL: interaction.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('banEmbedReasonTitle'), reason);
            const msg = await discordChannel.send({embeds: [embed]});
            caseLogs[caseLogs.length - 1].logMessage = msg.id;
        }
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {counterLogs: interaction.client.guildData.get(interaction.guild.id).counterLogs}});
        await log.insertMany(caseLogs);
        await lastInteraction.editReply(channelLanguage.get('massbanSuccess', [bans, invargs, invusers, banneds, interaction.client.guildData.get(interaction.guild.id).premiumUntil ?? interaction.client.guildData.get(interaction.guild.id).partner]));
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'targets',
            nameLocalizations: utils.getStringLocales('massbanOptiontargetsLocalisedName'),
            description: 'Mentions or IDs of the users to ban separated by spaces',
            descriptionLocalizations: utils.getStringLocales('massbanOptiontargetsLocalisedDesc'),
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'with_reason',
            nameLocalizations: utils.getStringLocales('massbanOptionwith_reasonLocalisedName'),
            description: 'Whether to prompt a modal asking for the ban reason',
            descriptionLocalizations: utils.getStringLocales('massbanOptionwith_reasonLocalisedDesc'),
            required: false,
        },
    ],
};