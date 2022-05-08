const guild = require('../../schemas/guild.js');
const channel = require('../../schemas/channel.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'voicexp',
    description: lang => lang.get('voicexpDescription'),
    aliases: ['vcxp'],
    usage: lang => [lang.get('voicexpUsage0'), 'disable', lang.get('voicexpUsage1'), 'view'],
    example: ['enable 10', 'ignore add #!AFK'],
    cooldown: 5,
    categoryID: 4,
    args: true,
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
    premium: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        switch(args[0]){
            case 'enable': {
                if(isNaN(parseInt(args[1], 10)) || !isFinite(parseInt(args[1], 10)) || (parseInt(args[1], 10) < 1) || (parseInt(args[1], 10) > 59)) return message.reply(channelLanguage.get('invCooldown'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {voiceXpCooldown: (message.client.guildData.get(message.guild.id).voiceXpCooldown = parseInt(args[1], 10))}});
                message.reply(channelLanguage.get('voicexpEnableSuccess', [message.client.guildData.get(message.guild.id).voiceXpCooldown]));
            }
            break;
            case 'disable': {
                await guild.findByIdAndUpdate(message.guild.id, {$unset: {voiceXpCooldown: (message.client.guildData.get(message.guild.id).voiceXpCooldown = null)}});
                message.reply(channelLanguage.get('voicexpDisableSuccess'));
            }
            break;
            case 'ignore': {
                if(!['add', 'remove'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                let discordChannel = message.guild.channels.cache.get(args[2].match(/^(?:<#)?(\d{17,19})>?$/)?.[1]);
                if(!discordChannel || (discordChannel.type != 'GUILD_VOICE')) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                await channel.findOneAndUpdate({
                    _id: discordChannel.id,
                    guild: message.guild.id,
                }, {$set: {ignoreXp: (args[1] === 'add')}}, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                });
                message.reply(channelLanguage.get('xpIgnoreChannel', [args[1], discordChannel]));
            }
            break;
            case 'view': {
                if(!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor ?? 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('voiceXpEmbedAuthor'),
                        iconURL: message.guild.iconURL({dynamic: true}),
                    })
                    .setDescription(channelLanguage.get('voiceXpEmbedDesc', [message.client.guildData.get(message.guild.id).voiceXpCooldown]))
                    .setTimestamp();
                let channels = await channel.find({
                    _id: {$in: message.guild.channels.cache.filter(e => (e.type === 'GUILD_VOICE')).map(e => e.id)},
                    guild: message.guild.id,
                    ignoreXp: true,
                });
                if(channels.length) embed.addField(channelLanguage.get('voiceXpIgnoredChannels'), channels.map(e => `<#${e._id}>`).join(' '));
                message.reply({embeds: [embed]});
            }
            break;
            default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        }
    },
    enableSlash: async (interaction, args) => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {voiceXpCooldown: (interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown = args.minutes)}});
        await interaction.reply(channelLanguage.get('voicexpEnableSuccess', [interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown]));
    },
    disableSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        await guild.findByIdAndUpdate(interaction.guild.id, {$unset: {voiceXpCooldown: (interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown = null)}});
        await interaction.reply(channelLanguage.get('voicexpDisableSuccess'));
    },
    ignoreSlash: async (interaction, args) => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        await channel.findOneAndUpdate({
            _id: args.channel.id,
            guild: interaction.guild.id,
        }, {$set: {ignoreXp: args.add}}, {
            upsert: true,
            setDefaultsOnInsert: true,
        });
        await interaction.reply(channelLanguage.get('xpIgnoreChannel', [args.add, args.channel]));
    },
    infoSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        const embed = new MessageEmbed()
            .setColor(interaction.guild.me.displayColor ?? 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('voiceXpEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('voiceXpEmbedDesc', [interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown]))
            .setTimestamp();
        const channels = await channel.find({
            _id: {$in: interaction.guild.channels.cache.filter(e => (e.type === 'GUILD_VOICE')).map(e => e.id)},
            guild: interaction.guild.id,
            ignoreXp: true,
        });
        if(channels.length) embed.addField(channelLanguage.get('voiceXpIgnoredChannels'), channels.map(e => `<#${e._id}>`).join(' '));
        await interaction.reply({embeds: [embed]});
    },
    slashOptions: [
        {
            type: 'SUB_COMMAND',
            name: 'enable',
            description: 'Enables xp earnings in voice channels',
            options: [{
                type: 'INTEGER',
                name: 'minutes',
                description: 'How many minutes an user should stay in a voice channel to earn 1 xp',
                required: true,
                minValue: 1,
                maxValue: 59,
            }],
        },
        {
            type: 'SUB_COMMAND',
            name: 'disable',
            description: 'Disables xp earnings in voice channels',
        },
        {
            type: 'SUB_COMMAND',
            name: 'ignore',
            description: 'Users won\'t earn xp in these voice channels',
            options: [
                {
                    type: 'BOOLEAN',
                    name: 'add',
                    description: 'Whether to add or remove a channel from the ignored list',
                    required: true,
                },
                {
                    type: 'CHANNEL',
                    name: 'channel',
                    description: 'The channel to be added or removed from the ignored list',
                    required: true,
                    channelTypes: ['GUILD_VOICE'],
                },
            ],
        },
        {
            type: 'SUB_COMMAND',
            name: 'info',
            description: 'Shows details about the xp earning in voice channels system',
        },
    ],
};