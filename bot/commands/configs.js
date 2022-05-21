const guild = require('../../schemas/guild.js');
const {MessageEmbed, Permissions} = require('discord.js');
const locale = require('../../locale');

const getLocalisedName = name => locale.filter((_, i) => (i !== 'en')).reduce((acc, e) => (e.get(`${name}LocalisedName`) ? {...acc, [e.code]: e.get(`${name}LocalisedName`)} : acc), {});

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
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
    execute: async function(message, args){
        const {channelLanguage} = message;
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
                        if(!args[3] || args.slice(3, 7).some(e => !['warn', 'mute', 'kick', 'ban'].includes(e))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        let discordChannel = message.guild.channels.cache.get(args[2].match(/^(?:<#)?(\d{17,19})>?$/)?.[1]);
                        if(!discordChannel || !discordChannel.isText()) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.viewable) return message.reply(channelLanguage.get('sendMessages'));
                        if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
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
                    default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                }
            }
            break;
            case 'beta': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {beta: (message.client.guildData.get(message.guild.id).beta = (args[1] === 'on'))}});
                message.reply(channelLanguage.get('betaSuccess', [args[1] === 'on']));
            }
            break;
            case 'massbanprotection': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                if((args[1] === 'on') && args[2] && (isNaN(parseInt(args[2], 10)) || !isFinite(parseInt(args[2], 10)) || (parseInt(args[2], 10) < 1))) return message.reply(channelLanguage.get('invMassBanProtectionAmount'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {antiMassBan: (message.client.guildData.get(message.guild.id).antiMassBan = ((args[1] === 'on') ? (parseInt(args[2], 10) || 15) : null))}});
                message.reply(channelLanguage.get('massBanProtectionSuccess', [args[1]]));
            }
            break;
            case 'globalbans': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {globalBan: (message.client.guildData.get(message.guild.id).globalBan = (args[1] === 'on'))}});
                message.reply(channelLanguage.get('globalbanSuccess', [args[1]]));
            }
            break;
            case 'view': {
                if(!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('configsEmbedAuthor'),
                        iconURL: message.guild.iconURL({
                            size: 4096,
                            dynamic: true,
                        }),
                    })
                    .setDescription(channelLanguage.get('configsEmbedDesc', [message.client.guildData.get(message.guild.id).prefix, message.client.guildData.get(message.guild.id).language, message.client.guildData.get(message.guild.id).logAttachments, message.client.guildData.get(message.guild.id).modlogs, message.client.guildData.get(message.guild.id).pruneBan, message.client.guildData.get(message.guild.id).antiMassBan, message.client.guildData.get(message.guild.id).globalBan, message.client.guildData.get(message.guild.id).beta]))
                    .setTimestamp();
                message.reply({embeds: [embed]});
            }
            break;
            default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        }
    },
    languageSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!locale.has(args.language)) return interaction.reply({
            content: channelLanguage.get('lang404'),
            ephemeral: true,
        });
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
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {logAttachments: args.enable}});
        interaction.client.guildData.get(interaction.guild.id).logAttachments = args.enable;
    },
    moderationlogsSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!interaction.guild.me.permissionsIn(args.modlog_channel).has(Permissions.FLAGS.SEND_MESSAGES) || !args.modlog_channel.viewable) return interaction.reply({
            content: channelLanguage.get('sendMessages'),
            ephemeral: true,
        });
        if(!interaction.guild.me.permissionsIn(args.modlog_channel).has(Permissions.FLAGS.EMBED_LINKS)) return interaction.reply({
            content: channelLanguage.get('botEmbed'),
            ephemeral: true,
        });
        const guildDoc = await guild.findByIdAndUpdate(interaction.guild.id, {$set: {[`modlogs.${args.action_type}`]: args.modlog_channel.id}}, {new: true});
        interaction.client.guildData.get(interaction.guild.id).modlogs = guildDoc.modlogs;
        await interaction.reply(channelLanguage.get('modLogsSetSuccess', [[args.action_type], args.modlog_channel]));
    },
    moderationclearonbanSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {pruneBan: args.days}});
        interaction.client.guildData.get(interaction.guild.id).pruneBan = args.days;
        await interaction.reply(channelLanguage.get('clearOnBanDaysSetSuccess', [args.days]));
    },
    moderationmassbanprotectionSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {antiMassBan: (interaction.client.guildData.get(interaction.guild.id).antiMassBan = (args.enable ? (args.max_bans || 15) : null))}});
        await interaction.reply(channelLanguage.get('massBanProtectionSuccess', [args.enable]));
    },
    moderationglobalbansSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {globalBan: (interaction.client.guildData.get(interaction.guild.id).globalBan = args.enable)}});
        await interaction.reply(channelLanguage.get('globalbanSuccess', [args.enable]));
    },
    betaSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {beta: (interaction.client.guildData.get(interaction.guild.id).beta = args.enable)}});
        await interaction.reply(channelLanguage.get('betaSuccess', [args.enable]));
    },
    infoSlash: async interaction => {
        const {channelLanguage} = interaction;
        const embed = new MessageEmbed()
            .setColor(interaction.guild.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('configsEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('configsEmbedDesc', [interaction.client.guildData.get(interaction.guild.id).prefix, interaction.client.guildData.get(interaction.guild.id).language, interaction.client.guildData.get(interaction.guild.id).logAttachments, interaction.client.guildData.get(interaction.guild.id).modlogs, interaction.client.guildData.get(interaction.guild.id).pruneBan, interaction.client.guildData.get(interaction.guild.id).antiMassBan, interaction.client.guildData.get(interaction.guild.id).globalBan, interaction.client.guildData.get(interaction.guild.id).beta]))
            .setTimestamp();
        await interaction.reply({embeds: [embed]});
    },
    slashOptions: [
        {
            type: 'SUB_COMMAND',
            name: 'language',
            description: 'Sets the server default language',
            options: [{
                type: 'STRING',
                name: 'language',
                description: 'The language to set as default',
                required: true,
                autocomplete: true,
            }],
        },
        {
            type: 'SUB_COMMAND',
            name: 'logattachments',
            description: 'Sets whether deleted messages attachments should be attached to the log message or not',
            options: [{
                type: 'BOOLEAN',
                name: 'enable',
                description: 'Whether to enable deleted messages attachments being attached to the log messages',
                required: true,
            }]
        },
        {
            type: 'SUB_COMMAND_GROUP',
            name: 'moderation',
            description: 'Manages moderation settings',
            options: [
                {
                    type: 'SUB_COMMAND',
                    name: 'logs',
                    description: 'Manages logs for moderation actions',
                    options: [
                        {
                            type: 'CHANNEL',
                            name: 'modlog_channel',
                            description: 'The channel to log moderation actions in',
                            required: true,
                            channelTypes: ['GUILD_TEXT'],
                        },
                        {
                            type: 'STRING',
                            name: 'action_type',
                            description: 'The type of moderation action to be logged in the chosen channel',
                            required: true,
                            choices: [
                                {
                                    name: 'Warns',
                                    name_localizations: getLocalisedName('warnChoice'),
                                    value: 'warn',
                                },
                                {
                                    name: 'Mutes',
                                    name_localizations: getLocalisedName('muteChoice'),
                                    value: 'mute',
                                },
                                {
                                    name: 'Kicks',
                                    name_localizations: getLocalisedName('kickChoice'),
                                    value: 'kick',
                                },
                                {
                                    name: 'Bans',
                                    name_localizations: getLocalisedName('banChoice'),
                                    value: 'ban',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'SUB_COMMAND',
                    name: 'clearonban',
                    description: 'Manages message pruning on bans issued through YottaBot',
                    options: [{
                        type: 'INTEGER',
                        name: 'days',
                        description: 'How many days of messages to clear when banning an user or 0 if no messages should be cleared',
                        minValue: 0,
                        maxValue: 7,
                        required: true,
                    }],
                },
                {
                    type: 'SUB_COMMAND',
                    name: 'massbanprotection',
                    description: 'Manages the mass ban protection system',
                    options: [
                        {
                            type: 'BOOLEAN',
                            name: 'enable',
                            description: 'Whether to enable the mass ban protection',
                            required: true,
                        },
                        {
                            type: 'INTEGER',
                            name: 'max_bans',
                            description: 'The maximum amount of bans allowed per moderator per 10 seconds',
                            required: false,
                            minValue: 1,
                        },
                    ],
                },
                {
                    type: 'SUB_COMMAND',
                    name: 'globalbans',
                    description: 'Manages the global ban system',
                    options: [{
                        type: 'BOOLEAN',
                        name: 'enable',
                        description: 'Whether to enable the global ban system',
                        required: true,
                    }],
                },
            ],
        },
        {
            type: 'SUB_COMMAND',
            name: 'beta',
            description: 'Sets the server beta status',
            options: [{
                type: 'BOOLEAN',
                name: 'enable',
                description: 'Whether enable beta features in the current server',
                required: true,
            }],
        },
        {
            type: 'SUB_COMMAND',
            name: 'info',
            description: 'Lists the current server bot configs',
        },
    ],
    languageAutocomplete: {
        language: (interaction, value) => interaction.respond(locale.filter(e => e.name.startsWith(value)).map((e, i) => ({
            name: e.name,
            value: i,
        }))),
    },
};