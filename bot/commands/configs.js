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

const {EmbedBuilder, PermissionsBitField, ApplicationCommandOptionType, ChannelType} = require('discord.js');
const utils = require('../utils.js');
const locale = require('../../locale');

module.exports = {
    active: true,
    name: 'configs',
    description: lang => lang.get('configsDescription'),
    aliases: ['config', 'settings', 'setting'],
    usage: lang => [lang.get('configsUsage0'), lang.get('configsUsage1'), lang.get('configsUsage2'), 'logattachments <on/off>', lang.get('configsUsage3'), lang.get('configsUsage4'), lang.get('configsUsage5'), 'massbanprotection off', 'globalbans <on/off>', 'beta <on/off>'],
    example: ['prefix !', 'language pt', 'logattachments on', 'mod logs #warn-and-mute-logs warn mute', 'massbanprotection on 20', 'globalbans on'],
    cooldown: 5,
    categoryID: 2,
    args: true,
    perm: PermissionsBitField.Flags.Administrator,
    guildOnly: true,
    execute: async function(message, args){
        const {channelLanguage} = message;
        const guild = require('../../schemas/guild.js');
        switch(args[0]){
            case 'prefix': {
                if(!args[1]) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                if(args[1].length > 10) return message.reply(channelLanguage.get('longPrefix'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {prefix: args[1]}});
                message.client.guildData.get(message.guild.id).prefix = args[1];
                message.reply(channelLanguage.get('newPrefix'));
            }
            break;
            case 'language': {
                if(!locale.has(args[1])) return message.reply(channelLanguage.get('lang404'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {language: args[1]}});
                message.client.guildData.get(message.guild.id).language = args[1];
                message.reply(locale.get(message.client.guildData.get(message.guild.id).language).get('newLang'));
            }
            break;
            case 'logattachments': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('logattachmentsBadArgs'));
                if(args[1] === 'on'){
                    if(!message.client.guildData.get(message.guild.id).actionlogs.id('delmsg')) return message.reply(channelLanguage.get('logattachmentsNoHook'));
                    let hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookID || message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).actionlogs.id('delmsg').hookToken || message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                    if(!hook) return message.reply(channelLanguage.get('logattachmentsNoHook'));
                    await guild.findByIdAndUpdate(message.guild.id, {$set: {logAttachments: true}});
                    message.client.guildData.get(message.guild.id).logAttachments = true;
                    message.reply(channelLanguage.get('logattachmentsOnSuccess'));
                }
                else{
                    await guild.findByIdAndUpdate(message.guild.id, {$set: {logAttachments: false}});
                    message.client.guildData.get(message.guild.id).logAttachments = false;
                    message.reply(channelLanguage.get('logattachmentsOffSuccess'));
                }
            }
            break;
            case 'mod': {
                switch(args[1]){
                    case 'logs': {
                        if(!args[3] || args.slice(3, 7).some(e => !['warn', 'mute', 'kick', 'ban'].includes(e))){
                            return await message.reply(
                                channelLanguage.get(
                                    'invArgsSlash',
                                    {usages: utils.slashCommandUsages(this.name, message.client, 'moderation', 'logs')},
                                ),
                            );
                        }
                        let discordChannel = message.guild.channels.cache.get(args[2].match(/^(?:<#)?(\d{17,19})>?$/)?.[1]);
                        if(!discordChannel || !discordChannel.isTextBased()){
                            return await message.reply(
                                channelLanguage.get(
                                    'invArgsSlash',
                                    {usages: utils.slashCommandUsages(this.name, message.client, 'moderation', 'logs')},
                                ),
                            );
                        }
                        if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.viewable) return message.reply(channelLanguage.get('sendMessages'));
                        if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
                        let guildDoc = await guild.findById(message.guild.id);
                        args.slice(3, 7).forEach(e => (guildDoc.modlogs[e] = discordChannel.id));
                        await guildDoc.save();
                        message.client.guildData.get(message.guild.id).modlogs = guildDoc.modlogs;
                        message.reply(channelLanguage.get('modLogsSetSuccess', [args.slice(3, 7), discordChannel]));
                    }
                    break;
                    case 'clearonban': {
                        if(isNaN(parseInt(args[2], 10)) || !isFinite(parseInt(args[2], 10)) || (parseInt(args[2], 10) < 0) || (parseInt(args[2], 10) > 7)) return message.reply(channelLanguage.get('invClearOnBanDays'));
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {pruneBan: parseInt(args[2], 10)}});
                        message.client.guildData.get(message.guild.id).pruneBan = parseInt(args[2], 10);
                        message.reply(channelLanguage.get('clearOnBanDaysSetSuccess', [message.client.guildData.get(message.guild.id).pruneBan]));
                    }
                    break;
                    default: {
                        await message.reply(
                            channelLanguage.get(
                                'invArgsSlash',
                                {usages: utils.slashCommandUsages(this.name, message.client, 'moderation')},
                            ),
                        );
                    }
                }
            }
            break;
            case 'beta': {
                if(!['on', 'off'].includes(args[1])){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: utils.slashCommandUsages(this.name, message.client, 'beta')},
                        ),
                    );
                }
                await guild.findByIdAndUpdate(message.guild.id, {$set: {beta: (message.client.guildData.get(message.guild.id).beta = (args[1] === 'on'))}});
                message.reply(channelLanguage.get('betaSuccess', [args[1] === 'on']));
            }
            break;
            case 'massbanprotection': {
                if(!['on', 'off'].includes(args[1])){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {
                                usages: utils.slashCommandUsages(
                                    this.name,
                                    message.client,
                                    'moderation',
                                    'massbanprotection',
                                ),
                            },
                        ),
                    );
                }
                if((args[1] === 'on') && args[2] && (isNaN(parseInt(args[2], 10)) || !isFinite(parseInt(args[2], 10)) || (parseInt(args[2], 10) < 1))) return message.reply(channelLanguage.get('invMassBanProtectionAmount'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {antiMassBan: (message.client.guildData.get(message.guild.id).antiMassBan = ((args[1] === 'on') ? (parseInt(args[2], 10) || 15) : null))}});
                message.reply(channelLanguage.get('massBanProtectionSuccess', [args[1]]));
            }
            break;
            case 'globalbans': {
                if(!['on', 'off'].includes(args[1])){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: utils.slashCommandUsages(this.name, message.client, 'moderation', 'globalbans')},
                        ),
                    );
                }
                await guild.findByIdAndUpdate(message.guild.id, {$set: {globalBan: (message.client.guildData.get(message.guild.id).globalBan = (args[1] === 'on'))}});
                message.reply(channelLanguage.get('globalbanSuccess', [args[1]]));
            }
            break;
            case 'view': {
                if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
                let embed = new EmbedBuilder()
                    .setColor(message.guild.members.me.displayColor || 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('configsEmbedAuthor'),
                        iconURL: message.guild.iconURL({
                            size: 4096,
                            dynamic: true,
                        }),
                    })
                    .setDescription(
                        channelLanguage.get(
                            'configsEmbedDesc',
                            [
                                message.client.guildData.get(message.guild.id).prefix,
                                message.client.guildData.get(message.guild.id).language,
                                message.client.guildData.get(message.guild.id).logAttachments,
                                message.client.guildData.get(message.guild.id).modlogs,
                                message.client.guildData.get(message.guild.id).pruneBan,
                                message.client.guildData.get(message.guild.id).antiMassBan,
                                message.client.guildData.get(message.guild.id).globalBan,
                                message.client.guildData.get(message.guild.id).beta,
                                null,
                                (
                                    message.client.guildData.get(message.guild.id).trackInvites
                                    &&
                                    (
                                        message.client.guildData.get(message.guild.id).partner
                                        ||
                                        message.client.guildData.get(message.guild.id).premiumUntil
                                    )
                                ),
                            ],
                        ),
                    )
                    .setTimestamp();
                message.reply({embeds: [embed]});
            }
            break;
            default: {
                await message.reply(
                    channelLanguage.get('invArgsSlash', {usages: utils.slashCommandUsages(this.name, message.client)}),
                );
            }
        }
    },
    languageSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!locale.has(args.language)) return interaction.reply({
            content: channelLanguage.get('lang404'),
            ephemeral: true,
        });
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {language: args.language}});
        interaction.client.guildData.get(interaction.guild.id).language = args.language;
        await interaction.reply(locale.get(args.language).get('newLang'));
    },
    logattachmentsSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(args.enable){
            if(!interaction.client.guildData.get(interaction.guild.id).actionlogs.id('delmsg')) return interaction.reply({
                content: channelLanguage.get('logattachmentsNoHook'),
                ephemeral: true,
            });
            const hook = await interaction.client.fetchWebhook(interaction.client.guildData.get(interaction.guild.id).actionlogs.id('delmsg').hookID || interaction.client.guildData.get(interaction.guild.id).defaultLogsHookID, interaction.client.guildData.get(interaction.guild.id).actionlogs.id('delmsg').hookToken || interaction.client.guildData.get(interaction.guild.id).defaultLogsHookToken).catch(() => null);
            if(!hook) return interaction.reply({
                content: channelLanguage.get('logattachmentsNoHook'),
                ephemeral: true,
            });
            await interaction.reply(channelLanguage.get('logattachmentsOnSuccess'));
        }
        else{
            await interaction.reply(channelLanguage.get('logattachmentsOffSuccess'));
        }
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {logAttachments: args.enable}});
        interaction.client.guildData.get(interaction.guild.id).logAttachments = args.enable;
    },
    moderationlogsSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!interaction.guild.members.me.permissionsIn(args.modlog_channel).has(PermissionsBitField.Flags.SendMessages) || !args.modlog_channel.viewable) return interaction.reply({
            content: channelLanguage.get('sendMessages'),
            ephemeral: true,
        });
        if(!interaction.guild.members.me.permissionsIn(args.modlog_channel).has(PermissionsBitField.Flags.EmbedLinks)) return interaction.reply({
            content: channelLanguage.get('botEmbed'),
            ephemeral: true,
        });
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(interaction.guild.id, {$set: {[`modlogs.${args.action_type}`]: args.modlog_channel.id}}, {new: true});
        interaction.client.guildData.get(interaction.guild.id).modlogs = guildDoc.modlogs;
        await interaction.reply(channelLanguage.get('modLogsSetSuccess', [[args.action_type], args.modlog_channel]));
    },
    moderationclearonbanSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {pruneBan: args.days}});
        interaction.client.guildData.get(interaction.guild.id).pruneBan = args.days;
        await interaction.reply(channelLanguage.get('clearOnBanDaysSetSuccess', [args.days]));
    },
    moderationmassbanprotectionSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {antiMassBan: (interaction.client.guildData.get(interaction.guild.id).antiMassBan = (args.enable ? (args.max_bans || 15) : null))}});
        await interaction.reply(channelLanguage.get('massBanProtectionSuccess', [args.enable]));
    },
    moderationglobalbansSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {globalBan: (interaction.client.guildData.get(interaction.guild.id).globalBan = args.enable)}});
        await interaction.reply(channelLanguage.get('globalbanSuccess', [args.enable]));
    },
    betaSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {beta: (interaction.client.guildData.get(interaction.guild.id).beta = args.enable)}});
        await interaction.reply(channelLanguage.get('betaSuccess', [args.enable]));
    },
    infoSlash: async interaction => {
        const {channelLanguage} = interaction;
        const hook = (
            interaction.client.guildData.get(interaction.guild.id).welcomeHook
            &&
            await interaction.client
                .fetchWebhook(
                    interaction.client.guildData.get(interaction.guild.id).welcomeHook._id,
                    interaction.client.guildData.get(interaction.guild.id).welcomeHook.token,
                )
                .catch(() => null)
        );
        const embed = new EmbedBuilder()
            .setColor(interaction.guild.members.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('configsEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setDescription(
                channelLanguage.get(
                    'configsEmbedDesc',
                    [
                        interaction.client.guildData.get(interaction.guild.id).prefix,
                        interaction.client.guildData.get(interaction.guild.id).language,
                        interaction.client.guildData.get(interaction.guild.id).logAttachments,
                        interaction.client.guildData.get(interaction.guild.id).modlogs,
                        interaction.client.guildData.get(interaction.guild.id).pruneBan,
                        interaction.client.guildData.get(interaction.guild.id).antiMassBan,
                        interaction.client.guildData.get(interaction.guild.id).globalBan,
                        interaction.client.guildData.get(interaction.guild.id).beta,
                        hook?.channelId,
                        (
                            interaction.client.guildData.get(interaction.guild.id).trackInvites
                            &&
                            (
                                interaction.client.guildData.get(interaction.guild.id).partner
                                ||
                                interaction.client.guildData.get(interaction.guild.id).premiumUntil
                            )
                        ),
                    ]
                )
            )
            .setTimestamp();
        await interaction.reply({embeds: [embed]});
    },
    welcomeenableSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!interaction.client.guildData.get(interaction.guild.id).beta) return await interaction.reply({
            content: channelLanguage.get('betaCommand'),
            ephemeral: true,
        });
        if(
            !interaction.guild.members.me
                .permissionsIn(args.channel)
                .has(PermissionsBitField.Flags.ManageWebhooks)
        ) return await interaction.reply({
            content: channelLanguage.get('botWebhooks'),
            ephemeral: true,
        });
        const hook = await args.channel.createWebhook({
            avatar: interaction.client.user.avatarURL(),
            reason: channelLanguage.get('newWelcomeHookReason'),
            name: interaction.client.user.username,
        });
        if(interaction.client.guildData.get(interaction.guild.id).welcomeHook){
            const oldHook = await interaction.client
                .fetchWebhook(
                    interaction.client.guildData.get(interaction.guild.id).welcomeHook._id,
                    interaction.client.guildData.get(interaction.guild.id).welcomeHook.token,
                )
                .catch(() => null);
            if(
                oldHook
                &&
                interaction.guild.members.me
                    .permissionsIn(interaction.guild.channels.cache.get(oldHook.channelId))
                    .has(PermissionsBitField.Flags.ManageWebhooks)
            ) await oldHook.delete(channelLanguage.get('WelcomeOldHookDeletedReason'));
        }
        const guildModel = require('../../schemas/guild.js');
        await guildModel.findByIdAndUpdate(
            interaction.guild.id,
            {$set: {welcomeHook: (interaction.client.guildData.get(interaction.guild.id).welcomeHook = {
                _id: hook.id,
                token: hook.token,
            })}},
        );
        await interaction.reply(channelLanguage.get('welcomEnableSuccess', [args.channel]));
    },
    welcomedisableSlash: async interaction => {
        const {channelLanguage} = interaction;
        if(interaction.client.guildData.get(interaction.guild.id).welcomeHook){
            const oldHook = await interaction.client
                .fetchWebhook(
                    interaction.client.guildData.get(interaction.guild.id).welcomeHook._id,
                    interaction.client.guildData.get(interaction.guild.id).welcomeHook.token,
                )
                .catch(() => null);
            if(
                oldHook
                &&
                interaction.guild.members.me
                    .permissionsIn(interaction.guild.channels.cache.get(oldHook.channelId))
                    .has(PermissionsBitField.Flags.ManageWebhooks)
            ) await oldHook.delete(channelLanguage.get('WelcomeOldHookDeletedReason'));
            const guildModel = require('../../schemas/guild.js');
            await guildModel.findByIdAndUpdate(
                interaction.guild.id,
                {$set: {welcomeHook: (interaction.client.guildData.get(interaction.guild.id).welcomeHook = null)}},
            );
        }
        await interaction.reply(channelLanguage.get('welcomeDisableSuccess'));
    },
    trackinvitesSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guildData = interaction.client.guildData.get(interaction.guild.id);
        if(!guildData.partner && !guildData.premiumUntil) return interaction.reply({
            content: channelLanguage.get('configsTrackInvitesNotPremium'),
            ephemeral: true,
        });
        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.reply({
            content: channelLanguage.get('configsTrackInvitesCantManageGuild'),
            ephemeral: true,
        });
        if(!guildData.actionlogs.id('memberjoin')) return interaction.reply({
            content: channelLanguage.get('configsInviteTrackerJoinlogDisabled'),
            ephemeral: true,
        });
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {trackInvites: (interaction.client.guildData.get(interaction.guild.id).trackInvites = args.enable)}});
        if(!interaction.client.inviteUses.has(interaction.guild.id)){
            await interaction.guild.invites.fetch();
            interaction.client.inviteUses.set(interaction.guild.id, interaction.guild.invites.cache.mapValues(invite => ({
                code: invite.code,
                uses: invite.uses,
                expiresTimestamp: invite.expiresTimestamp,
                inviterId: invite.inviterId,
            })));
        }
        await interaction.reply(channelLanguage.get('configsTrackInvitesSuccess', [args.enable]));
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'language',
            description: 'Sets the server default language',
            options: [{
                type: ApplicationCommandOptionType.String,
                name: 'language',
                description: 'The language to set as default',
                required: true,
                autocomplete: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'logattachments',
            description: 'Sets whether deleted messages attachments should be attached to the log message or not',
            options: [{
                type: ApplicationCommandOptionType.Boolean,
                name: 'enable',
                description: 'Whether to enable deleted messages attachments being attached to the log messages',
                required: true,
            }]
        },
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'moderation',
            description: 'Manages moderation settings',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'logs',
                    description: 'Manages logs for moderation actions',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: 'modlog_channel',
                            description: 'The channel to log moderation actions in',
                            required: true,
                            channelTypes: [
                                ChannelType.GuildText,
                                ChannelType.GuildAnnouncement,
                                ChannelType.AnnouncementThread,
                                ChannelType.GuildVoice,
                                ChannelType.PrivateThread,
                                ChannelType.PublicThread,
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'action_type',
                            description: 'The type of moderation action to be logged in the chosen channel',
                            required: true,
                            choices: [
                                {
                                    name: 'Warns',
                                    name_localizations: utils.getStringLocales('warnChoiceLocalisedName'),
                                    value: 'warn',
                                },
                                {
                                    name: 'Mutes/Timeouts',
                                    name_localizations: utils.getStringLocales('muteChoiceLocalisedName'),
                                    value: 'mute',
                                },
                                {
                                    name: 'Kicks',
                                    name_localizations: utils.getStringLocales('kickChoiceLocalisedName'),
                                    value: 'kick',
                                },
                                {
                                    name: 'Bans',
                                    name_localizations: utils.getStringLocales('banChoiceLocalisedName'),
                                    value: 'ban',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'clearonban',
                    description: 'Manages message pruning on bans issued through YottaBot',
                    options: [{
                        type: ApplicationCommandOptionType.Integer,
                        name: 'days',
                        description: 'How many days of messages to clear when banning an user or 0 if no messages should be cleared',
                        minValue: 0,
                        maxValue: 7,
                        required: true,
                    }],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'massbanprotection',
                    description: 'Manages the mass ban protection system',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'enable',
                            description: 'Whether to enable the mass ban protection',
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'max_bans',
                            description: 'The maximum amount of bans allowed per moderator per 10 seconds',
                            required: false,
                            minValue: 1,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'globalbans',
                    description: 'Manages the global ban system',
                    options: [{
                        type: ApplicationCommandOptionType.Boolean,
                        name: 'enable',
                        description: 'Whether to enable the global ban system',
                        required: true,
                    }],
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'beta',
            description: 'Sets the server beta status',
            options: [{
                type: ApplicationCommandOptionType.Boolean,
                name: 'enable',
                description: 'Whether to enable beta features in the current server',
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            description: 'Lists the current server bot configs',
        },
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'welcome',
            nameLocalizations: utils.getStringLocales('configs_welcomeLocalisedName'),
            description: 'Sets a channel for a welcome message to be sent when a new user joins the server',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'enable',
                    nameLocalizations: utils.getStringLocales('configs_welcome_enableLocalisedName'),
                    description: 'Sets a channel for a welcome message to be sent when a new user joins the server',
                    descriptionLocalizations: utils.getStringLocales('configs_welcome_enableLocalisedDesc'),
                    options: [{
                        type: ApplicationCommandOptionType.Channel,
                        name: 'channel',
                        nameLocalizations: utils.getStringLocales('configs_welcome_enableOptionchannelLocalisedName'),
                        description: 'The channel in which to welcome new members',
                        descriptionLocalizations: utils.getStringLocales(
                            'configs_welcome_enableOptionchannelLocalisedDesc'
                        ),
                        channelTypes: [ChannelType.GuildText, ChannelType.GuildNews],
                        required: true,
                    }],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'disable',
                    nameLocalizations: utils.getStringLocales('configs_welcome_disableLocalisedName'),
                    description: 'Disables welcome messages for new members',
                    descriptionLocalizations: utils.getStringLocales('configs_welcome_disableLocalisedDesc'),
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'trackinvites',
            nameLocalizations: utils.getStringLocales('configs_track_invitesLocalisedName'),
            description: 'Shows which invite code an user used to join the server in the join logs',
            descriptionLocalizations: utils.getStringLocales('configs_track_invitesLocalisedDesc'),
            options: [{
                type: ApplicationCommandOptionType.Boolean,
                name: 'enable',
                nameLocalizations: utils.getStringLocales('configs_track_invitesOptionenableLocalisedName'),
                description: 'Whether to enable invite tracking in the current server',
                descriptionLocalizations: utils.getStringLocales('configs_track_invitesOptionenableLocalisedDesc'),
                required: true,
            }],
        }
    ],
    languageAutocomplete: {
        language: (interaction, value) => interaction.respond(locale.filter(e => e.name.startsWith(value)).map((e, i) => ({
            name: e.name,
            value: i,
        }))),
    },
};