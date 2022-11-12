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
const { slashCommandUsages } = require('../utils.js');

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
    perm: PermissionsBitField.Flags.Administrator,
    guildOnly: true,
    premium: true,
    execute: async function(message, args){
        const {channelLanguage} = message;
        const channel = require('../../schemas/channel.js');
        const guild = require('../../schemas/guild.js');
        switch(args[0]){
            case 'enable': {
                if(
                    isNaN(parseInt(args[1], 10))
                    ||
                    !isFinite(parseInt(args[1], 10))
                    ||
                    (parseInt(args[1], 10) < 1)
                    ||
                    (parseInt(args[1], 10) > 59)
                ) return message.reply(channelLanguage.get('invCooldown'));
                await guild.findByIdAndUpdate(
                    message.guild.id,
                    {
                        $set: {
                            voiceXpCooldown: (
                                message.client.guildData.get(message.guild.id).voiceXpCooldown = parseInt(args[1], 10)
                            ),
                        },
                    }
                );
                message.reply(
                    channelLanguage.get(
                        'voicexpEnableSuccess',
                        [message.client.guildData.get(message.guild.id).voiceXpCooldown]
                    )
                );
            }
            break;
            case 'disable': {
                await guild.findByIdAndUpdate(
                    message.guild.id,
                    {$unset: {voiceXpCooldown: (message.client.guildData.get(message.guild.id).voiceXpCooldown = null)}}
                );
                message.reply(channelLanguage.get('voicexpDisableSuccess'));
            }
            break;
            case 'ignore': {
                if(!['add', 'remove'].includes(args[1])){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: slashCommandUsages(this.name, message.client, 'ignore')},
                        ),
                    );
                }
                let discordChannel = message.guild.channels.cache.get(args[2].match(/^(?:<#)?(\d{17,19})>?$/)?.[1]);
                if(
                    !discordChannel
                    ||
                    (discordChannel.type !== ChannelType.GuildVoice)
                ){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: slashCommandUsages(this.name, message.client, 'ignore')},
                        ),
                    );
                }
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
                if(
                    !message.guild.members.me
                        .permissionsIn(message.channel)
                        .has(PermissionsBitField.Flags.EmbedLinks)
                ) return message.reply(channelLanguage.get('botEmbed'));
                let embed = new EmbedBuilder()
                    .setColor(message.guild.members.me.displayColor ?? 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('voiceXpEmbedAuthor'),
                        iconURL: message.guild.iconURL({dynamic: true}),
                    })
                    .setDescription(
                        channelLanguage.get(
                            'voiceXpEmbedDesc',
                            [message.client.guildData.get(message.guild.id).voiceXpCooldown]
                        )
                    )
                    .setTimestamp();
                let channels = await channel.find({
                    _id: {$in: message.guild.channels.cache.filter(e => (e.type === ChannelType.GuildVoice)).map(e => e.id)},
                    guild: message.guild.id,
                    ignoreXp: true,
                });
                if(channels.length) embed.addField(
                    channelLanguage.get('voiceXpIgnoredChannels'),
                    channels
                        .map(e => `<#${e._id}>`)
                        .join(' ')
                );
                message.reply({embeds: [embed]});
            }
            break;
            default: {
                await message.reply(
                    channelLanguage.get('invArgsSlash', {usages: slashCommandUsages(this.name, message.client)}),
                );
            }
        }
    },
    enableSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(
            interaction.guild.id,
            {
                $set: {
                    voiceXpCooldown: (
                        interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown = args.minutes
                    ),
                },
            }
        );
        await interaction.reply(
            channelLanguage.get(
                'voicexpEnableSuccess',
                [interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown]
            )
        );
    },
    disableSlash: async interaction => {
        const {channelLanguage} = interaction;
        const guild = require('../../schemas/guild.js');
        await guild.findByIdAndUpdate(
            interaction.guild.id,
            {$unset: {voiceXpCooldown: (interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown = null)}}
        );
        await interaction.reply(channelLanguage.get('voicexpDisableSuccess'));
    },
    ignoreSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const channel = require('../../schemas/channel.js');
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
        const {channelLanguage} = interaction;
        const embed = new EmbedBuilder()
            .setColor(interaction.guild.members.me.displayColor ?? 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('voiceXpEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setDescription(
                channelLanguage.get(
                    'voiceXpEmbedDesc',
                    [interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown]
                )
            )
            .setTimestamp();
        const channel = require('../../schemas/channel.js');
        const channels = await channel.find({
            _id: {$in: interaction.guild.channels.cache.filter(e => (e.type === ChannelType.GuildVoice)).map(e => e.id)},
            guild: interaction.guild.id,
            ignoreXp: true,
        });
        if(channels.length) embed.addField(
            channelLanguage.get('voiceXpIgnoredChannels'),
            channels
                .map(e => `<#${e._id}>`)
                .join(' ')
        );
        await interaction.reply({embeds: [embed]});
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'enable',
            description: 'Enables xp earnings in voice channels',
            options: [{
                type: ApplicationCommandOptionType.Integer,
                name: 'minutes',
                description: 'How many minutes an user should stay in a voice channel to earn 1 xp',
                required: true,
                minValue: 1,
                maxValue: 59,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'disable',
            description: 'Disables xp earnings in voice channels',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'ignore',
            description: 'Users won\'t earn xp in these voice channels',
            options: [
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'add',
                    description: 'Whether to add or remove a channel from the ignored list',
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'channel',
                    description: 'The channel to be added or removed from the ignored list',
                    required: true,
                    channelTypes: [ChannelType.GuildVoice],
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            description: 'Shows details about the xp earning in voice channels system',
        },
    ],
};