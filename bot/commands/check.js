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

const {
    EmbedBuilder,
    PermissionsBitField,
    ApplicationCommandOptionType,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'check',
    description: lang => lang.get('checkDescription'),
    aliases: ['modlogs', 'chk'],
    usage: lang => [lang.get('checkUsage')],
    example: ['@LordHawk#0001 mute 15d12h30m30s'],
    cooldown: 5,
    categoryID: 3,
    args: true,
    guilOnly: true,
    execute: async function(message, args){
        const {channelLanguage} = message;
        if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
        if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.AddReactions)) return message.reply(channelLanguage.get('botReactions'));
        const usages = utils.slashCommandUsages(this.name, message.client);
        if(!['all', 'warn', 'mute', 'kick', 'ban'].includes(args[1])){
            return message.reply(channelLanguage.get('invArgsSlash', {usages}));
        }
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.reply(channelLanguage.get('invArgsSlash', {usages}));
        const filter = args[2] ? (Date.now() - (((parseInt(args[2].match(/(\d+)d/)?.[1], 10) * 86400000) || 0) + ((parseInt(args[2].match(/(\d+)h/)?.[1], 10) * 3600000) || 0) + ((parseInt(args[2].match(/(\d+)m/)?.[1], 10) * 60000) || 0) + ((parseInt(args[2].match(/(\d+)s/)?.[1], 10) * 1000) || 0))) : 0;
        const log = require('../../schemas/log.js');
        const logDocs = await log.find({
            guild: message.guild.id,
            target: id,
            type: (args[1] === 'all') ? {$ne: args[1]} : {$eq: args[1]},
            timeStamp: {$gte: filter},
        }).sort({timeStamp: -1});
        if(!logDocs.length) return message.reply(channelLanguage.get('invLogs'));
        const discordMember = await message.guild.members.fetch(id).catch(() => null);
        const discordUser = discordMember?.user ?? await message.client.users.fetch(id).catch(() => null);
        const formatDuration = (ms) => {
            let d = Math.floor(ms / 1440);
            let h = Math.floor((ms % 1440) / 60);
            let m = Math.floor(ms % 60);
            return [d, h, m];
        }
        const pageSize = 10;
        const embed = new EmbedBuilder()
            .setColor(discordMember?.displayColor ?? message.guild.members.me.displayColor ?? 0x8000ff)
            .setAuthor({
                name: discordUser?.tag ?? channelLanguage.get('checkEmbedAuthor'),
                iconURL: discordUser?.displayAvatarURL({dynamic: true}),
            })
            .setTimestamp()
            .setFooter({text: channelLanguage.get('checkEmbedFooter', [logDocs.length])})
            .setDescription(`${['all', 'warn'].includes(args[1]) ? `Warns: \`${logDocs.filter(e => (e.type === 'warn')).length}\`\n` : ''}${['all', 'mute'].includes(args[1]) ? `Mutes/Timeouts: \`${logDocs.filter(e => ((e.type === 'mute') && !e.removal)).length}\`\nUnmutes: \`${logDocs.filter(e => ((e.type === 'mute') && e.removal)).length}\`\n` : ''}${['all', 'kick'].includes(args[1]) ? `Kicks: \`${logDocs.filter(e => (e.type === 'kick')).length}\`\n` : ''}${['all', 'ban'].includes(args[1]) ? `Bans: \`${logDocs.filter(e => ((e.type === 'ban') && !e.removal)).length}\`\nUnbans: \`${logDocs.filter(e => ((e.type === 'ban') && e.removal)).length}\`\n` : ''}`)
            .addFields(logDocs.slice(0, pageSize).map(e => ({
                name: channelLanguage.get('checkEmbedCaseTitle', [e.id]),
                value: channelLanguage.get('checkEmbedCaseValueTarget', [e, e.duration && formatDuration(Math.round((e.duration.getTime() - e.timeStamp.getTime()) / 60000))]),
            })));
        const buttonPrevious = {
            type: ComponentType.Button,
            label: channelLanguage.get('previous'),
            style: ButtonStyle.Primary,
            emoji: '⬅',
            customId: 'previous',
            disabled: true,
        };
        const buttonNext = {
            type: ComponentType.Button,
            label: channelLanguage.get('next'),
            style: ButtonStyle.Primary,
            emoji: '➡',
            customId: 'next',
            disabled: (logDocs.length <= pageSize),
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonPrevious, buttonNext],
        }];
        const msg = await message.reply({embeds: [embed], components});
        if(logDocs.length <= pageSize) return;
        const col = msg.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === message.author.id),
            time: 600000,
            componentType: ComponentType.Button,
        });
        let page = 0;
        col.on('collect', button => (async button => {
            if(button.customId === 'next'){
                if(!logDocs.slice((page + 1) * pageSize).length) return;
                page++;
            }
            else{
                if(!page) return;
                page--;
            }
            embed.setFields(logDocs.slice(page * pageSize, (page + 1) * pageSize).map(e => ({
                name: channelLanguage.get('checkEmbedCaseTitle', [e.id]),
                value: channelLanguage.get('checkEmbedCaseValueTarget', [e, e.duration && formatDuration(Math.floor((e.duration.getTime() - e.timeStamp.getTime()) / 60000))]),
            })));
            buttonPrevious.disabled = !page;
            buttonNext.disabled = !logDocs.slice((page + 1) * pageSize).length;
            await button.update({embeds: [embed], components});
        })(button).catch(async err => await utils.handleComponentError(err, button)));
        col.on('end', async () => {
            if(!msg.editable) return;
            buttonNext.disabled = buttonPrevious.disabled = true;
            await msg.edit({embeds: [embed], components});
        });
    },
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(interaction.isUserContextMenuCommand()){
            args = {user: (interaction.targetUser.member = interaction.targetMember, interaction.targetUser)};
        }
        const filter = args.time_range ? (Date.now() - (args.time_range * 1000)) : 0;
        const log = require('../../schemas/log.js');
        const query = {
            guild: interaction.guild.id,
            timeStamp: {$gte: filter},
        };
        if(args.case_type) query.type = {$eq: args.case_type};
        query[args.executor ? 'executor' : 'target'] = args.user.id;
        const logDocs = await log.find(query).sort({timeStamp: -1});
        if(!logDocs.length) return interaction.reply({
            content: channelLanguage.get('invLogs'),
            ephemeral: true,
        });
        const formatDuration = (ms) => {
            let d = Math.floor(ms / 1440);
            let h = Math.floor((ms % 1440) / 60);
            let m = Math.floor(ms % 60);
            return [d, h, m];
        }
        const pageSize = 10;
        const fieldString = `checkEmbedCaseValue${args.executor ? 'Executor' : 'Target'}`;
        let description = (
            (!args.case_type || (args.case_type === 'warn'))
            ? `Warns: \`${logDocs.filter(e => (e.type === 'warn')).length}\`\n`
            : ''
        );
        if(!args.case_type || (args.case_type === 'mute')){
            description += (
                `Mutes/Timeouts: \`${logDocs.filter(e => ((e.type === 'mute') && !e.removal)).length}\`\n` +
                `Unmutes: \`${logDocs.filter(e => ((e.type === 'mute') && e.removal)).length}\`\n`
            );
        }
        if(!args.case_type || (args.case_type === 'kick')){
            description += `Kicks: \`${logDocs.filter(e => (e.type === 'kick')).length}\`\n`;
        }
        if(!args.case_type || (args.case_type === 'ban')){
            description += (
                `Bans: \`${logDocs.filter(e => ((e.type === 'ban') && !e.removal)).length}\`\n` +
                `Unbans: \`${logDocs.filter(e => ((e.type === 'ban') && e.removal)).length}\`\n`
            );
        }
        const embed = new EmbedBuilder()
            .setColor(args.user.member?.displayColor ?? interaction.guild.members.me.displayColor ?? 0x8000ff)
            .setAuthor({
                name: args.user?.tag ?? channelLanguage.get('checkEmbedAuthor'),
                iconURL: args.user?.displayAvatarURL({dynamic: true}),
            })
            .setTimestamp()
            .setFooter({text: channelLanguage.get('checkEmbedFooter', [logDocs.length])})
            .setDescription(description)
            .addFields(logDocs.slice(0, pageSize).map(e => ({
                name: channelLanguage.get('checkEmbedCaseTitle', [e.id]),
                value: channelLanguage.get(fieldString, [e, e.duration && formatDuration(Math.round((e.duration.getTime() - e.timeStamp.getTime()) / 60000))]),
            })));
        const buttonPrevious = {
            type: ComponentType.Button,
            label: channelLanguage.get('previous'),
            style: ButtonStyle.Primary,
            emoji: '⬅',
            customId: 'previous',
            disabled: true,
        };
        const buttonNext = {
            type: ComponentType.Button,
            label: channelLanguage.get('next'),
            style: ButtonStyle.Primary,
            emoji: '➡',
            customId: 'next',
            disabled: (logDocs.length <= pageSize),
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonPrevious, buttonNext],
        }];
        const msg = await interaction.reply({
            embeds: [embed],
            components,
            fetchReply: true,
            ephemeral: true,
        });
        if(logDocs.length <= pageSize) return;
        const col = msg.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
            time: 600000,
            componentType: ComponentType.Button,
        });
        let page = 0;
        col.on('collect', button => (async button => {
            if(button.customId === 'next'){
                if(!logDocs.slice((page + 1) * pageSize).length) return;
                page++;
            }
            else{
                if(!page) return;
                page--;
            }
            embed.setFields(logDocs.slice(page * pageSize, (page + 1) * pageSize).map(e => ({
                name: channelLanguage.get('checkEmbedCaseTitle', [e.id]),
                value: channelLanguage.get(fieldString, [e, e.duration && formatDuration(Math.round((e.duration.getTime() - e.timeStamp.getTime()) / (60 * 1_000)))]),
            })));
            buttonPrevious.disabled = !page;
            buttonNext.disabled = (!logDocs.slice((page + 1) * pageSize).length);
            await button.update({embeds: [embed], components});
        })(button).catch(async err => await utils.handleComponentError(err, button)));
        col.on('end', async () => {
            buttonNext.disabled = buttonPrevious.disabled = true;
            await interaction.editReply({embeds: [embed], components});
        });
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'The user to have its cases checked',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'case_type',
            description: 'The type of the cases to be checked',
            required: false,
            choices: [
                {
                    name: 'Warn cases',
                    value: 'warn',
                },
                {
                    name: 'Mute/Timeout cases',
                    value: 'mute',
                },
                {
                    name: 'Kick cases',
                    value: 'kick',
                },
                {
                    name: 'Ban cases',
                    value: 'ban',
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'time_range',
            nameLocalizations: utils.getStringLocales('checkOptiontime_rangeLocalisedName'),
            description: 'Until how long ago should the cases be from',
            descriptionLocalizations: utils.getStringLocales('checkOptiontime_rangeLocalisedDesc'),
            required: false,
            autocomplete: true,
            minValue: 1,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'executor',
            description: 'Whether the selected user should be the executor of the desired cases',
            required: false,
        },
    ],
    contextName: 'Check cases',
    commandAutocomplete: {
        time_range: (interaction, value, locale) => {
            if(!value) return interaction.respond([]);
            const realValue = parseInt(value, 10);
            interaction.respond(utils.timeSpanChoices(realValue, locale));
        }
    },
};