const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');

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
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
        if(!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.ADD_REACTIONS)) return message.reply(channelLanguage.get('botReactions'));
        if(!['all', 'warn', 'mute', 'kick', 'ban'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        const filter = args[2] ? (Date.now() - (((parseInt(args[2].match(/(\d+)d/)?.[1], 10) * 86400000) || 0) + ((parseInt(args[2].match(/(\d+)h/)?.[1], 10) * 3600000) || 0) + ((parseInt(args[2].match(/(\d+)m/)?.[1], 10) * 60000) || 0) + ((parseInt(args[2].match(/(\d+)s/)?.[1], 10) * 1000) || 0))) : 0;
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
        const embed = new MessageEmbed()
            .setColor(discordMember?.displayColor ?? message.guild.me.displayColor ?? 0x8000ff)
            .setAuthor({
                name: discordUser?.tag ?? channelLanguage.get('checkEmbedAuthor'),
                iconURL: discordUser?.displayAvatarURL({dynamic: true}),
            })
            .setTimestamp()
            .setFooter({text: channelLanguage.get('checkEmbedFooter', [logDocs.length])})
            .setDescription(`${['all', 'warn'].includes(args[1]) ? `Warns: \`${logDocs.filter(e => (e.type === 'warn')).length}\`\n` : ''}${['all', 'mute'].includes(args[1]) ? `Mutes: \`${logDocs.filter(e => ((e.type === 'mute') && !e.removal)).length}\`\nUnmutes: \`${logDocs.filter(e => ((e.type === 'mute') && e.removal)).length}\`\n` : ''}${['all', 'kick'].includes(args[1]) ? `Kicks: \`${logDocs.filter(e => (e.type === 'kick')).length}\`\n` : ''}${['all', 'ban'].includes(args[1]) ? `Bans: \`${logDocs.filter(e => ((e.type === 'ban') && !e.removal)).length}\`\nUnbans: \`${logDocs.filter(e => ((e.type === 'ban') && e.removal)).length}\`\n` : ''}`)
            .addFields(logDocs.slice(0, pageSize).map(e => ({
                name: channelLanguage.get('checkEmbedCaseTitle', [e.id]),
                value: channelLanguage.get('checkEmbedCaseValueTarget', [e, e.duration && formatDuration(Math.round((e.duration.getTime() - e.timeStamp.getTime()) / 60000))]),
            })));
        const buttonPrevious = {
            type: 'BUTTON',
            label: channelLanguage.get('previous'),
            style: 'PRIMARY',
            emoji: '⬅',
            customId: 'previous',
            disabled: true,
        };
        const buttonNext = {
            type: 'BUTTON',
            label: channelLanguage.get('next'),
            style: 'PRIMARY',
            emoji: '➡',
            customId: 'next',
            disabled: (logDocs.length <= pageSize),
        };
        const components = [{
            type: 'ACTION_ROW',
            components: [buttonPrevious, buttonNext],
        }];
        const msg = await message.reply({embeds: [embed], components});
        if(logDocs.length <= pageSize) return;
        const col = msg.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === message.author.id),
            time: 600000,
            componentType: 'BUTTON',
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
        })(button).catch(err => message.client.handlers.button(err, button)));
        col.on('end', async () => {
            buttonNext.disabled = buttonPrevious.disabled = true;
            await msg.edit({embeds: [embed], components});
        });
    },
    executeSlash: async (interaction, args) => {
        if(interaction.isUserContextMenu()) args = {
            user: (interaction.targetUser.member = interaction.targetMember, interaction.targetUser),
            case_type: 'all',
        };
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(!['all', 'warn', 'mute', 'kick', 'ban'].includes(args.case_type)) throw new Error('Invalid slash command options');
        const filter = (args.time_filter_unit ?? args.time_filter_value) ? (Date.now() - ((args.time_filter_unit ?? 86400000) * (args.time_filter_value ?? 1))) : 0;
        const logDocs = await log.find({
            guild: interaction.guild.id,
            type: (args.case_type === 'all') ? {$ne: args.case_type} : {$eq: args.case_type},
            timeStamp: {$gte: filter},
            ...(args.executor ? {executor: args.user.id} : {target: args.user.id}),
        }).sort({timeStamp: -1});
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
        const embed = new MessageEmbed()
            .setColor(args.user.member?.displayColor ?? interaction.guild.me.displayColor ?? 0x8000ff)
            .setAuthor({
                name: args.user?.tag ?? channelLanguage.get('checkEmbedAuthor'),
                iconURL: args.user?.displayAvatarURL({dynamic: true}),
            })
            .setTimestamp()
            .setFooter({text: channelLanguage.get('checkEmbedFooter', [logDocs.length])})
            .setDescription(`${['all', 'warn'].includes(args.case_type) ? `Warns: \`${logDocs.filter(e => (e.type === 'warn')).length}\`\n` : ''}${['all', 'mute'].includes(args.case_type) ? `Mutes: \`${logDocs.filter(e => ((e.type === 'mute') && !e.removal)).length}\`\nUnmutes: \`${logDocs.filter(e => ((e.type === 'mute') && e.removal)).length}\`\n` : ''}${['all', 'kick'].includes(args.case_type) ? `Kicks: \`${logDocs.filter(e => (e.type === 'kick')).length}\`\n` : ''}${['all', 'ban'].includes(args.case_type) ? `Bans: \`${logDocs.filter(e => ((e.type === 'ban') && !e.removal)).length}\`\nUnbans: \`${logDocs.filter(e => ((e.type === 'ban') && e.removal)).length}\`\n` : ''}`)
            .addFields(logDocs.slice(0, pageSize).map(e => ({
                name: channelLanguage.get('checkEmbedCaseTitle', [e.id]),
                value: channelLanguage.get(fieldString, [e, e.duration && formatDuration(Math.round((e.duration.getTime() - e.timeStamp.getTime()) / 60000))]),
            })));
        const buttonPrevious = {
            type: 'BUTTON',
            label: channelLanguage.get('previous'),
            style: 'PRIMARY',
            emoji: '⬅',
            customId: 'previous',
            disabled: true,
        };
        const buttonNext = {
            type: 'BUTTON',
            label: channelLanguage.get('next'),
            style: 'PRIMARY',
            emoji: '➡',
            customId: 'next',
            disabled: (logDocs.length <= pageSize),
        };
        const components = [{
            type: 'ACTION_ROW',
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
            componentType: 'BUTTON',
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
                value: channelLanguage.get(fieldString, [e, e.duration && formatDuration(e.duration.getTime() - e.timeStamp.getTime())]),
            })));
            buttonPrevious.disabled = !page;
            buttonNext.disabled = (!logDocs.slice((page + 1) * pageSize).length);
            await button.update({embeds: [embed], components});
        })(button).catch(err => interaction.client.handlers.button(err, button)));
        col.on('end', () => {
            buttonNext.disabled = buttonPrevious.disabled = true;
            interaction.editReply({embeds: [embed], components});
        });
    },
    slashOptions: [
        {
            type: 'USER',
            name: 'user',
            description: 'The user to have its cases checked',
            required: true,
        },
        {
            type: 'STRING',
            name: 'case_type',
            description: 'The type of the cases to be checked',
            required: true,
            choices: [
                {
                    name: 'Check cases of all types',
                    value: 'all',
                },
                {
                    name: 'Warn cases',
                    value: 'warn',
                },
                {
                    name: 'Mute cases',
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
            type: 'INTEGER',
            name: 'time_filter_unit',
            description: 'The unit of how much time ago to check for cases. Defaults to days.',
            required: false,
            choices: [
                {
                    name: 'Days',
                    value: 86400000,
                },
                {
                    name: 'Hours',
                    value: 3600000,
                },
                {
                    name: 'Minutes',
                    value: 60000,
                },
                {
                    name: 'Seconds',
                    value: 1000,
                },
            ]
        },
        {
            type: 'NUMBER',
            name: 'time_filter_value',
            description: 'How much of the chosen unit. Defaults to 1.',
            required: false,
        },
        {
            type: 'BOOLEAN',
            name: 'executor',
            description: 'Whether the selected user should be the executor of the desired cases',
            required: false,
        },
    ],
    contextName: 'Check cases',
};