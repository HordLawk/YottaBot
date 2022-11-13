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
const configs = require('../configs');
const { slashCommandUsages } = require('../utils');

const actionOptionMapper = filter => ((interaction, value, locale) => interaction.respond((filter ? configs.actions.filter(filter) : configs.actions).map((_, i) => ({
    name: locale.get(`${i}ActionName`),
    value: i,
})).filter(e => e.name.toLowerCase().startsWith(value.toLowerCase()))));

module.exports = {
    active: true,
    name: 'actionlogs',
    description: lang => lang.get('actionlogsDescription'),
    aliases: ['logs'],
    usage: lang => [lang.get('actionlogsUsage0'), lang.get('actionlogsUsage1'), 'remove <delmsg/prune/editmsg/memberjoin/memberleave/voiceconnect/voicedisconnect/voicemove>', lang.get('actionlogsUsage2'), lang.get('actionlogsUsage3'), lang.get('actionlogsUsage4'), lang.get('actionlogsUsage5'), 'view'],
    example: ['defaultchannel #logs', 'set delmsg #deleted-messages', 'remove delmsg', 'ignore channel add #staff delmsg', 'ignore channel view #staff', 'ignore role remove @Mods all', 'ignore role view @Mods'],
    cooldown: 5,
    categoryID: 2,
    args: true,
    perm: PermissionsBitField.Flags.Administrator,
    guildOnly: true,
    execute: async function(message, args){
        const {channelLanguage} = message;
        const channel = require('../../schemas/channel.js');
        const role = require('../../schemas/role.js');
        const guild = require('../../schemas/guild.js');
        switch(args[0]){
            case 'defaultchannel': {
                if(!args[1]){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: slashCommandUsages(this.name, message.client, 'default')},
                        ),
                    );
                }
                let discordChannel = message.guild.channels.cache.get((args[1].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                if(!discordChannel || !discordChannel.isTextBased()){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: slashCommandUsages(this.name, message.client, 'default')},
                        ),
                    );
                }
                if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.ManageWebhooks)) return message.reply(channelLanguage.get('botWebhooks'));
                let hook = await discordChannel.createWebhook({
                    avatar: message.client.user.avatarURL({size: 4096}),
                    reason: channelLanguage.get('newDefaultHookReason'),
                    name: message.client.user.username,
                });
                let oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                if(oldHook && message.guild.members.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelId)).has(PermissionsBitField.Flags.ManageWebhooks)) await oldHook.delete(channelLanguage.get('oldDefaultHookReason'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {
                    defaultLogsHookID: hook.id,
                    defaultLogsHookToken: hook.token,
                }});
                message.client.guildData.get(message.guild.id).defaultLogsHookID = hook.id;
                message.client.guildData.get(message.guild.id).defaultLogsHookToken = hook.token;
                await message.reply(channelLanguage.get('newDefaultLog', [discordChannel]));
            }
            break;
            case 'set': {
                if((args.length < 3) || !configs.actions.has(args[1])){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: slashCommandUsages(this.name, message.client, 'actions', 'set')},
                        ),
                    );
                }
                if(args[2] === 'default'){
                    let hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                    if(!hook) return message.reply(channelLanguage.get('noDefaultLog'));
                    let oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                    if(oldHook && message.guild.members.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelId)).has(PermissionsBitField.Flags.ManageWebhooks)) await oldHook.delete(channelLanguage.get('oldHookReason', [channelLanguage.get(`action${args[1]}`)]));
                    let guildDoc = await guild.findById(message.guild.id);
                    if(!guildDoc.actionlogs.id(args[1])){
                        guildDoc.actionlogs.push({_id: args[1]});
                    }
                    else{
                        guildDoc.actionlogs.id(args[1]).hookID = null;
                        guildDoc.actionlogs.id(args[1]).hookToken = null;
                    }
                    await guildDoc.save();
                    message.client.guildData.get(message.guild.id).actionlogs = guildDoc.actionlogs;
                    message.reply(channelLanguage.get('newDefaultLogSuccess'));
                }
                else{
                    let discordChannel = message.guild.channels.cache.get((args[2].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                    if(!discordChannel || !discordChannel.isTextBased()){
                        return await message.reply(
                            channelLanguage.get(
                                'invArgsSlash',
                                {usages: slashCommandUsages(this.name, message.client, 'actions', 'set')},
                            ),
                        );
                    }
                    if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.ManageWebhooks)) return message.reply(channelLanguage.get('botWebhooks'));
                    let hook = await discordChannel.createWebhook({
                        avatar: message.client.user.avatarURL({size: 4096}),
                        reason: channelLanguage.get('newHookReason', [channelLanguage.get(`${args[1]}ActionName`)]),
                        name: message.client.user.username,
                    });
                    let oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                    if(oldHook && message.guild.members.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelId)).has(PermissionsBitField.Flags.ManageWebhooks)) await oldHook.delete(channelLanguage.get('oldHookReason', [args[1]]));
                    let guildDoc = await guild.findById(message.guild.id);
                    if(!guildDoc.actionlogs.id(args[1])){
                        guildDoc.actionlogs.push({
                            _id: args[1],
                            hookID: hook.id,
                            hookToken: hook.token,
                        });
                    }
                    else{
                        guildDoc.actionlogs.id(args[1]).hookID = hook.id;
                        guildDoc.actionlogs.id(args[1]).hookToken = hook.token;
                    }
                    await guildDoc.save();
                    message.client.guildData.get(message.guild.id).actionlogs = guildDoc.actionlogs;
                    message.reply(channelLanguage.get('newLogSuccess', [discordChannel]));
                }
            }
            break;
            case 'remove': {
                if(!args[1] || !configs.actions.has(args[1])){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: slashCommandUsages(this.name, message.client, 'actions', 'remove')},
                        ),
                    );
                }
                let oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                if(oldHook && message.guild.members.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelId)).has(PermissionsBitField.Flags.ManageWebhooks)) await oldHook.delete(channelLanguage.get('oldHookReason', [args[1]]));
                let guildDoc = await guild.findById(message.guild.id);
                if(guildDoc.actionlogs.id(args[1])){
                    guildDoc.actionlogs.id(args[1]).remove();
                    await guildDoc.save();
                    message.client.guildData.get(message.guild.id).actionlogs = guildDoc.actionlogs;
                }
                message.reply(channelLanguage.get('removeLogSuccess'));
            }
            break;
            case 'ignore': {
                if(!['channel', 'role'].includes(args[1]) || (args.length < 4)){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {
                                usages: (
                                    `${slashCommandUsages(this.name, message.client, 'ignoredchannels')}\n` +
                                    slashCommandUsages(this.name, message.client, 'ignoredroles')
                                ),
                            },
                        ),
                    );
                }
                switch(args[2]){
                    case 'view': {
                        if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
                        if(args[1] === 'channel'){
                            let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                            if(!discordChannel){
                                return await message.reply(
                                    channelLanguage.get(
                                        'invArgsSlash',
                                        {
                                            usages: slashCommandUsages(
                                                this.name,
                                                message.client,
                                                `ignoredchannels`,
                                                'info',
                                            ),
                                        },
                                    ),
                                );
                            }
                            let channelDoc = await channel.findById(discordChannel.id);
                            if(!channelDoc || !channelDoc.ignoreActions.length) return message.reply(channelLanguage.get('noIgnoredActionsChannel'));
                            let embed = new EmbedBuilder()
                                .setColor(message.guild.members.me.displayColor || 0x8000ff)
                                .setAuthor({
                                    name: channelLanguage.get('ignoredActionsChannelEmbedAuthor'),
                                    iconURL: message.guild.iconURL({
                                        size: 4096,
                                        dynamic: true,
                                    }),
                                })
                                .setDescription(channelLanguage.get('ignoredActionsChannelEmbedDesc', [discordChannel]))
                                .setTimestamp()
                                .setFooter({text: channelLanguage.get('ignoredActionsEmbedFooter', [channelDoc.ignoreActions.length])})
                                .addField(channelLanguage.get('ignoredActionsEmbedActionsTitle'), channelDoc.ignoreActions.map(e => channelLanguage.get(`${e}ActionName`)).join('\n'));
                            message.reply({embeds: [embed]});
                        }
                        else{
                            let roleName = message.content.toLowerCase().replace(/^(?:\S+\s+){4}/, '');
                            let discordRole = message.guild.roles.cache.get(args[3].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                            if(!discordRole || (discordRole.id === message.guild.id)){
                                return await message.reply(
                                    channelLanguage.get(
                                        'invArgsSlash',
                                        {usages: slashCommandUsages(this.name, message.client, 'ignoredroles', 'info')},
                                    ),
                                );
                            }
                            let roleDoc = await role.findOne({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                ignoreActions: {$ne: []},
                            });
                            if(!roleDoc) return message.reply(channelLanguage.get('noIgnoredActionsRole'));
                            let embed = new EmbedBuilder()
                                .setColor(message.guild.members.me.displayColor || 0x8000ff)
                                .setAuthor({
                                    name: channelLanguage.get('ignoredActionsRoleEmbedAuthor'),
                                    iconURL: message.guild.iconURL({
                                        size: 4096,
                                        dynamic: true,
                                    }),
                                })
                                .setDescription(channelLanguage.get('ignoredActionsRoleEmbedDesc', [discordRole]))
                                .setTimestamp()
                                .setFooter({text: channelLanguage.get('ignoredActionsEmbedFooter', [roleDoc.ignoreActions.length])})
                                .addField(channelLanguage.get('ignoredActionsEmbedActionsTitle'), roleDoc.ignoreActions.map(e => channelLanguage.get(`${e}ActionName`)).join('\n'));
                            message.reply({embeds: [embed]});
                        }
                    }
                    break;
                    case 'add':
                    case 'remove': {
                        if(!args[4]){
                            return await message.reply(
                                channelLanguage.get(
                                    'invArgsSlash',
                                    {
                                        usages: slashCommandUsages(
                                            this.name,
                                            message.client,
                                            (args[1] === 'channel') ? 'ignoredchannels' : 'ignoredroles',
                                            args[2],
                                        ),
                                    },
                                ),
                            );
                        }
                        if(args[4] === 'all'){
                            if(args[1] === 'channel'){
                                let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                                if(!discordChannel){
                                    return await message.reply(
                                        channelLanguage.get(
                                            'invArgsSlash',
                                            {
                                                usages: slashCommandUsages(
                                                    this.name,
                                                    message.client,
                                                    'ignoredchannels',
                                                    args[2],
                                                ),
                                            },
                                        ),
                                    );
                                }
                                if(args[2] === 'add'){
                                    await channel.findOneAndUpdate({
                                        _id: discordChannel.id,
                                        guild: message.guild.id,
                                    }, {$set: {ignoreActions: [...configs.actions.filter(e => e.ignorableChannels).keys()]}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.reply(channelLanguage.get('allActionsIgnoredChannelSuccess', [discordChannel]));
                                }
                                else{
                                    await channel.findByIdAndUpdate(discordChannel.id, {$set: {ignoreActions: []}});
                                    message.reply(channelLanguage.get('noActionsIgnoredChannelSuccess', [discordChannel]));
                                }
                            }
                            else{
                                let roleName = message.content.toLowerCase().replace(/^(?:\S+\s+){4}/, '');
                                let discordRole = message.guild.roles.cache.get(args[3].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                                if(!discordRole || (discordRole.id === message.guild.id)){
                                    return await message.reply(
                                        channelLanguage.get(
                                            'invArgsSlash',
                                            {
                                                usages: slashCommandUsages(
                                                    this.name,
                                                    message.client,
                                                    'ignoredroles',
                                                    args[2],
                                                ),
                                            },
                                        ),
                                    );
                                }
                                if(args[2] === 'add'){
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$set: {ignoreActions: [...configs.actions.filter(e => e.ignorableRoles).keys()]}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.reply(channelLanguage.get('allActionsIgnoredRoleSuccess', [discordRole.name]));
                                }
                                else{
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$set: {ignoreActions: []}});
                                    message.reply(channelLanguage.get('noActionsIgnoredRoleSuccess', [discordRole.name]));
                                }
                            }
                        }
                        else{
                            if(args[1] === 'channel'){
                                if(!configs.actions.filter(e => e.ignorableChannels).has(args[4])){
                                    return await message.reply(
                                        channelLanguage.get(
                                            'invArgsSlash',
                                            {
                                                usages: slashCommandUsages(
                                                    this.name,
                                                    message.client,
                                                    'ignoredchannels',
                                                    args[2],
                                                ),
                                            },
                                        ),
                                    );
                                }
                                let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                                if(!discordChannel){
                                    return await message.reply(
                                        channelLanguage.get(
                                            'invArgsSlash',
                                            {
                                                usages: slashCommandUsages(
                                                    this.name,
                                                    message.client,
                                                    'ignoredchannels',
                                                    args[2],
                                                ),
                                            },
                                        ),
                                    );
                                }
                                if(args[2] === 'add'){
                                    await channel.findOneAndUpdate({
                                        _id: discordChannel.id,
                                        guild: message.guild.id,
                                    }, {$addToSet: {ignoreActions: args[4]}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.reply(channelLanguage.get('actionIgnoredChannelSuccess', [channelLanguage.get(`${args[4]}ActionName`), discordChannel]));
                                }
                                else{
                                    await channel.findByIdAndUpdate(discordChannel.id, {$pull: {ignoreActions: args[4]}});
                                    message.reply(channelLanguage.get('actionNotIgnoredChannelSuccess', [channelLanguage.get(`${args[4]}ActionName`), discordChannel]));
                                }
                            }
                            else{
                                if(!configs.actions.filter(e => e.ignorableRoles).has(args[4])){
                                    return await message.reply(
                                        channelLanguage.get(
                                            'invArgsSlash',
                                            {
                                                usages: slashCommandUsages(
                                                    this.name,
                                                    message.client,
                                                    'ignoredroles',
                                                    args[2],
                                                ),
                                            },
                                        ),
                                    );
                                }
                                let roleName = message.content.toLowerCase().replace(/^(?:\S+\s+){4}/, '');
                                let discordRole = message.guild.roles.cache.get(args[3].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                                if(!discordRole || (discordRole.id === message.guild.id)){
                                    return await message.reply(
                                        channelLanguage.get(
                                            'invArgsSlash',
                                            {
                                                usages: slashCommandUsages(
                                                    this.name,
                                                    message.client,
                                                    'ignoredroles',
                                                    args[2],
                                                ),
                                            },
                                        ),
                                    );
                                }
                                if(args[2] === 'add'){
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$addToSet: {ignoreActions: args[4]}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.reply(channelLanguage.get('actionIgnoredRoleSuccess', [channelLanguage.get(`${args[4]}ActionName`), discordRole.name]));
                                }
                                else{
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$pull: {ignoreActions: args[4]}});
                                    message.reply(channelLanguage.get('actionNotIgnoredRoleSuccess', [channelLanguage.get(`${args[4]}ActionName`), discordRole.name]));
                                }
                            }
                        }
                    }
                    break;
                    default: {
                        await message.reply(
                            channelLanguage.get(
                                'invArgsSlash',
                                {
                                    usages: slashCommandUsages(
                                        this.name,
                                        message.client,
                                        (args[1] === 'channel') ? 'ignoredchannels' : 'ignoredroles',
                                    ),
                                },
                            ),
                        );
                    }
                }
            }
            break;
            case 'view': {
                if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
                let hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                let embed = new EmbedBuilder()
                    .setColor(message.guild.members.me.displayColor || 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('logsViewEmbedAuthor'),
                        iconURL: message.guild.iconURL({
                            size: 4096,
                            dynamic: true,
                        }),
                    })
                    .setDescription(channelLanguage.get('logsViewEmbedDesc', [hook?.channelId]))
                    .setTimestamp();
                let activeLogs = [];
                for(actionlog of message.client.guildData.get(message.guild.id).actionlogs){
                    if(!actionlog.hookID){
                        activeLogs.push({id: actionlog._id});
                        continue;
                    }
                    let actionHook = await message.client.fetchWebhook(actionlog.hookID, actionlog.hookToken).catch(() => null);
                    if(actionHook) activeLogs.push({
                        id: actionlog._id,
                        channelID: actionHook.channelId,
                    });
                }
                if(activeLogs.length){
                    embed.addField(channelLanguage.get('logsViewEmbedActionsTitle'), activeLogs.map(e => channelLanguage.get('logsViewEmbedActions', [channelLanguage.get(`action${e.id}`), e.channelID])).join('\n'));
                }
                let channels = await channel.find({
                    _id: {$in: message.client.channels.cache.map(e => e.id)},
                    guild: message.guild.id,
                    ignoreActions: {$ne: []},
                });
                if(channels.length) embed.addField(channelLanguage.get('logsViewEmbedIgnoredChannelsTitle'), channels.map(e => `<#${e._id}> - \`${(e.ignoreActions.length === configs.actions.size) ? channelLanguage.get('logsViewEmbedIgnoredAll') : channelLanguage.get('logsViewEmbedIgnoredSome')}\``).join('\n'));
                let roles = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                    ignoreActions: {$ne: []},
                });
                if(roles.length) embed.addField(channelLanguage.get('logsViewEmbedIgnoredRolesTitle'), roles.map(e => `<@&${e.roleID}> - \`${(e.ignoreActions.length === configs.actions.size) ? channelLanguage.get('logsViewEmbedIgnoredAll') : channelLanguage.get('logsViewEmbedIgnoredSome')}\``).join('\n'));
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
    defaultSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!interaction.guild.members.me.permissionsIn(args.channel).has(PermissionsBitField.Flags.ManageWebhooks)) return interaction.reply({
            content: channelLanguage.get('botWebhooks'),
            ephemeral: true,
        });
        const hook = await args.channel.createWebhook({
            avatar: interaction.client.user.avatarURL(),
            reason: channelLanguage.get('newDefaultHookReason'),
            name: interaction.client.user.username,
        });
        const oldHook = await interaction.client.fetchWebhook(interaction.client.guildData.get(interaction.guild.id).defaultLogsHookID, interaction.client.guildData.get(interaction.guild.id).defaultLogsHookToken).catch(() => null);
        if(oldHook && interaction.guild.members.me.permissionsIn(interaction.guild.channels.cache.get(oldHook.channelId)).has(PermissionsBitField.Flags.ManageWebhooks)) await oldHook.delete(channelLanguage.get('oldDefaultHookReason'));
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(interaction.guild.id, {$set: {
            defaultLogsHookID: hook.id,
            defaultLogsHookToken: hook.token,
        }}, {new: true});
        interaction.client.guildData.set(interaction.guild.id, guildDoc);
        await interaction.reply(channelLanguage.get('newDefaultLog', [args.channel]));
    },
    actionssetSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!configs.actions.has(args.action)) return interaction.reply({
            content: channelLanguage.get('invAction'),
            ephemeral: true,
        });
        const guild = require('../../schemas/guild.js');
        if(args.log_channel){
            if(
                !interaction.guild.members.me
                    .permissionsIn(args.log_channel)
                    .has(PermissionsBitField.Flags.ManageWebhooks)
            ) return await interaction.reply({
                content: channelLanguage.get('botWebhooks'),
                ephemeral: true,
            });
            await interaction.deferReply();
            const hook = await args.log_channel.createWebhook({
                avatar: interaction.client.user.avatarURL(),
                reason: channelLanguage.get('newHookReason', [channelLanguage.get(`${args[1]}ActionName`)]),
                name: interaction.client.user.username,
            });
            const oldHook = await interaction.client.fetchWebhook(interaction.client.guildData.get(interaction.guild.id).actionlogs.id(args.action)?.hookID, interaction.client.guildData.get(interaction.guild.id).actionlogs.id(args.action)?.hookToken).catch(() => null);
            if(oldHook && interaction.guild.members.me.permissionsIn(interaction.guild.channels.cache.get(oldHook.channelId)).has(PermissionsBitField.Flags.ManageWebhooks)) await oldHook.delete(channelLanguage.get('oldHookReason', [args.action]));
            const guildDoc = await guild.findById(interaction.guild.id);
            if(!guildDoc.actionlogs.id(args.action)){
                guildDoc.actionlogs.push({
                    _id: args.action,
                    hookID: hook.id,
                    hookToken: hook.token,
                });
            }
            else{
                guildDoc.actionlogs.id(args.action).hookID = hook.id;
                guildDoc.actionlogs.id(args.action).hookToken = hook.token;
            }
            await guildDoc.save();
            interaction.client.guildData.get(interaction.guild.id).actionlogs = guildDoc.actionlogs;
            await interaction.editReply(channelLanguage.get('newLogSuccess', [args.log_channel]));
        }
        else{
            const hook = await interaction.client.fetchWebhook(interaction.client.guildData.get(interaction.guild.id).defaultLogsHookID, interaction.client.guildData.get(interaction.guild.id).defaultLogsHookToken).catch(() => null);
            if(!hook) return await interaction.reply({
                content: channelLanguage.get('noDefaultLog'),
                ephemeral: true,
            });
            const oldHook = await interaction.client.fetchWebhook(interaction.client.guildData.get(interaction.guild.id).actionlogs.id(args.action)?.hookID, interaction.client.guildData.get(interaction.guild.id).actionlogs.id(args.action)?.hookToken).catch(() => null);
            if(oldHook && interaction.guild.members.me.permissionsIn(interaction.guild.channels.cache.get(oldHook.channelId)).has(PermissionsBitField.Flags.ManageWebhooks)) await oldHook.delete(channelLanguage.get('oldHookReason', [channelLanguage.get(`action${args.action}`)]));
            const guildDoc = await guild.findById(interaction.guild.id);
            if(!guildDoc.actionlogs.id(args.action)){
                guildDoc.actionlogs.push({_id: args.action});
            }
            else{
                guildDoc.actionlogs.id(args.action).hookID = null;
                guildDoc.actionlogs.id(args.action).hookToken = null;
            }
            await guildDoc.save();
            interaction.client.guildData.get(interaction.guild.id).actionlogs = guildDoc.actionlogs;
            await interaction.editReply(channelLanguage.get('newDefaultLogSuccess'));
        }
    },
    actionsremoveSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!configs.actions.has(args.action)) return interaction.reply({
            content: channelLanguage.get('invAction'),
            ephemeral: true,
        });
        const oldHook = await interaction.client.fetchWebhook(interaction.client.guildData.get(interaction.guild.id).actionlogs.id(args.action)?.hookID, interaction.client.guildData.get(interaction.guild.id).actionlogs.id(args.action)?.hookToken).catch(() => null);
        if(oldHook && interaction.guild.members.me.permissionsIn(interaction.guild.channels.cache.get(oldHook.channelId)).has(PermissionsBitField.Flags.ManageWebhooks)) await oldHook.delete(channelLanguage.get('oldHookReason', [args.action]));
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findById(interaction.guild.id);
        if(guildDoc.actionlogs.id(args.action)){
            guildDoc.actionlogs.id(args.action).remove();
            await guildDoc.save();
            interaction.client.guildData.get(interaction.guild.id).actionlogs = guildDoc.actionlogs;
        }
        await interaction.reply(channelLanguage.get('removeLogSuccess'));
    },
    ignoredchannelsaddSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const channel = require('../../schemas/channel.js');
        if(args.action){
            if(!configs.actions.filter(e => e.ignorableChannels).has(args.action)) return interaction.reply({
                content: channelLanguage.get('invAction'),
                ephemeral: true,
            });
            await channel.findOneAndUpdate({
                _id: args.channel.id,
                guild: interaction.guild.id,
            }, {$addToSet: {ignoreActions: args.action}}, {
                upsert: true,
                setDefaultsOnInsert: true,
            });
            await interaction.reply(channelLanguage.get('actionIgnoredChannelSuccess', [channelLanguage.get(`${args.action}ActionName`), args.channel]));
        }
        else{
            await channel.findOneAndUpdate({
                _id: args.channel.id,
                guild: interaction.guild.id,
            }, {$set: {ignoreActions: [...configs.actions.filter(e => e.ignorableChannels).keys()]}}, {
                upsert: true,
                setDefaultsOnInsert: true,
            });
            await interaction.reply(channelLanguage.get('allActionsIgnoredChannelSuccess', [args.channel]));
        }
    },
    ignoredchannelsremoveSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const channel = require('../../schemas/channel.js');
        if(args.action){
            if(!configs.actions.filter(e => e.ignorableChannels).has(args.action)) return interaction.reply({
                content: channelLanguage.get('invAction'),
                ephemeral: true,
            });
            await channel.findByIdAndUpdate(args.channel.id, {$pull: {ignoreActions: args.action}});
            await interaction.reply(channelLanguage.get('actionNotIgnoredChannelSuccess', [channelLanguage.get(`${args.action}ActionName`), args.channel]));
        }
        else{
            await channel.findByIdAndUpdate(args.channel.id, {$set: {ignoreActions: []}});
            await interaction.reply(channelLanguage.get('noActionsIgnoredChannelSuccess', [args.channel]));
        }
    },
    ignoredchannelsinfoSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const channel = require('../../schemas/channel.js');
        const channelDoc = await channel.findById(args.channel.id);
        if(!channelDoc || !channelDoc.ignoreActions.length) return interaction.reply({
            content: channelLanguage.get('noIgnoredActionsChannel'),
            ephemeral: true,
        });
        const embed = new EmbedBuilder()
            .setColor(interaction.guild.members.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('ignoredActionsChannelEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('ignoredActionsChannelEmbedDesc', [args.channel]))
            .setTimestamp()
            .setFooter({text: channelLanguage.get('ignoredActionsEmbedFooter', [channelDoc.ignoreActions.length])})
            .addField(channelLanguage.get('ignoredActionsEmbedActionsTitle'), channelDoc.ignoreActions.map(e => channelLanguage.get(`${e}ActionName`)).join('\n'));
        await interaction.reply({embeds: [embed]});
    },
    ignoredrolesaddSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(args.role.id === interaction.guild.id) return interaction.reply({
            content: channelLanguage.get('cantIgnoreEveryone'),
            ephemeral: true,
        });
        const role = require('../../schemas/role.js');
        if(args.action){
            if(!configs.actions.filter(e => e.ignorableRoles).has(args.action)) return interaction.reply({
                content: channelLanguage.get('invAction'),
                ephemeral: true,
            });
            await role.findOneAndUpdate({
                roleID: args.role.id,
                guild: interaction.guild.id,
            }, {$addToSet: {ignoreActions: args.action}}, {
                upsert: true,
                setDefaultsOnInsert: true,
            });
            await interaction.reply(channelLanguage.get('actionIgnoredRoleSuccess', [channelLanguage.get(`${args.action}ActionName`), args.role.name]));
        }
        else{
            await role.findOneAndUpdate({
                roleID: args.role.id,
                guild: interaction.guild.id,
            }, {$set: {ignoreActions: [...configs.actions.filter(e => e.ignorableRoles).keys()]}}, {
                upsert: true,
                setDefaultsOnInsert: true,
            });
            await interaction.reply(channelLanguage.get('allActionsIgnoredRoleSuccess', [args.role.name]));
        }
    },
    ignoredrolesremoveSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(args.role.id === interaction.guild.id) return interaction.reply({
            content: channelLanguage.get('cantIgnoreEveryone'),
            ephemeral: true,
        });
        const role = require('../../schemas/role.js');
        if(args.action){
            if(!configs.actions.filter(e => e.ignorableRoles).has(args.action)) return interaction.reply({
                content: channelLanguage.get('invAction'),
                ephemeral: true,
            });
            await role.findOneAndUpdate({
                roleID: args.role.id,
                guild: interaction.guild.id,
            }, {$pull: {ignoreActions: args.action}});
            await interaction.reply(channelLanguage.get('actionNotIgnoredRoleSuccess', [channelLanguage.get(`${args.action}ActionName`), args.role.name]));
        }
        else{
            await role.findOneAndUpdate({
                roleID: args.role.id,
                guild: interaction.guild.id,
            }, {$set: {ignoreActions: []}});
            await interaction.reply(channelLanguage.get('noActionsIgnoredRoleSuccess', [args.role.name]));
        }
    },
    ignoredrolesinfoSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const role = require('../../schemas/role.js');
        const roleDoc = await role.findOne({
            guild: interaction.guild.id,
            roleID: args.role.id,
            ignoreActions: {$ne: []},
        });
        if(!roleDoc) return interaction.reply({
            content: channelLanguage.get('noIgnoredActionsRole'),
            ephemeral: true,
        });
        const embed = new EmbedBuilder()
            .setColor(interaction.guild.members.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('ignoredActionsRoleEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('ignoredActionsRoleEmbedDesc', [args.role]))
            .setTimestamp()
            .setFooter({text: channelLanguage.get('ignoredActionsEmbedFooter', [roleDoc.ignoreActions.length])})
            .addField(channelLanguage.get('ignoredActionsEmbedActionsTitle'), roleDoc.ignoreActions.map(e => channelLanguage.get(`${e}ActionName`)).join('\n'));
        await interaction.reply({embeds: [embed]});
    },
    infoSlash: async interaction => {
        const {channelLanguage} = interaction;
        const hook = await interaction.client.fetchWebhook(interaction.client.guildData.get(interaction.guild.id).defaultLogsHookID, interaction.client.guildData.get(interaction.guild.id).defaultLogsHookToken).catch(() => null);
        const embed = new EmbedBuilder()
            .setColor(interaction.guild.members.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('logsViewEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setDescription(channelLanguage.get('logsViewEmbedDesc', [hook?.channelId]))
            .setTimestamp();
        const activeLogs = [];
        for(let actionlog of interaction.client.guildData.get(interaction.guild.id).actionlogs){
            if(!actionlog.hookID){
                activeLogs.push({id: actionlog._id});
                continue;
            }
            let actionHook = await interaction.client.fetchWebhook(actionlog.hookID, actionlog.hookToken).catch(() => null);
            if(actionHook) activeLogs.push({
                id: actionlog._id,
                channelID: actionHook.channelId,
            });
        }
        if(activeLogs.length){
            embed.addField(channelLanguage.get('logsViewEmbedActionsTitle'), activeLogs.map(e => channelLanguage.get('logsViewEmbedActions', [channelLanguage.get(`action${e.id}`), e.channelID])).join('\n'));
        }
        const channel = require('../../schemas/channel.js');
        const channels = await channel.find({
            _id: {$in: interaction.client.channels.cache.map(e => e.id)},
            guild: interaction.guild.id,
            ignoreActions: {$ne: []},
        });
        if(channels.length) embed.addField(channelLanguage.get('logsViewEmbedIgnoredChannelsTitle'), channels.map(e => `<#${e._id}> - \`${(e.ignoreActions.length === configs.actions.size) ? channelLanguage.get('logsViewEmbedIgnoredAll') : channelLanguage.get('logsViewEmbedIgnoredSome')}\``).join('\n'));
        const role = require('../../schemas/role.js');
        const roles = await role.find({
            guild: interaction.guild.id,
            roleID: {$in: interaction.guild.roles.cache.map(e => e.id)},
            ignoreActions: {$ne: []},
        });
        if(roles.length) embed.addField(channelLanguage.get('logsViewEmbedIgnoredRolesTitle'), roles.map(e => `<@&${e.roleID}> - \`${(e.ignoreActions.length === configs.actions.size) ? channelLanguage.get('logsViewEmbedIgnoredAll') : channelLanguage.get('logsViewEmbedIgnoredSome')}\``).join('\n'));
        await interaction.reply({embeds: [embed]});
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'default',
            description: 'Sets the default channel for logging actions',
            options: [{
                type: ApplicationCommandOptionType.Channel,
                name: 'channel',
                description: 'The channel to be set as the default log channel',
                required: true,
                channelTypes: [ChannelType.GuildText],
            }],
        },
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'actions',
            description: 'Manages action logs',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'set',
                    description: 'Sets actions to be logged',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'action',
                            description: 'The action to be logged',
                            required: true,
                            autocomplete: true,
                        },
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: 'log_channel',
                            description: 'The channel to log the selected action (if not specified uses the default channel)',
                            required: false,
                            channelTypes: [ChannelType.GuildText],
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'remove',
                    description: 'Removes actions from being logged',
                    options: [{
                        type: ApplicationCommandOptionType.String,
                        name: 'action',
                        description: 'The action to be removed from being logged',
                        required: true,
                        autocomplete: true,
                    }],
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'ignoredchannels',
            description: 'Ignores actions from certain channels from being logged',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'add',
                    description: 'Adds to the list of channels in which actions will be ignored from being logged',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: 'channel',
                            description: 'The channel to be added to the list',
                            required: true,
                            channelTypes: [
                                ChannelType.GuildText,
                                ChannelType.GuildNews,
                                ChannelType.GuildNewsThread,
                                ChannelType.GuildPublicThread,
                                ChannelType.GuildPrivateThread,
                                ChannelType.GuildVoice,
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'action',
                            description: 'The action to be ignored',
                            required: false,
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'remove',
                    description: 'Removes from the list of channels in which actions will be ignored from being logged',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: 'channel',
                            description: 'The channel to be removed from the list',
                            required: true,
                            channelTypes: [
                                ChannelType.GuildText,
                                ChannelType.GuildNews,
                                ChannelType.GuildNewsThread,
                                ChannelType.GuildPublicThread,
                                ChannelType.GuildPrivateThread,
                                ChannelType.GuildVoice,
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'action',
                            description: 'The action to start being logged again',
                            required: false,
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'info',
                    description: 'Shows which actions are being ignored in a certain channel',
                    options: [{
                        type: ApplicationCommandOptionType.Channel,
                        name: 'channel',
                        description: 'The channel to show info of',
                        required: true,
                        channelTypes: [
                            ChannelType.GuildText,
                            ChannelType.GuildNews,
                            ChannelType.GuildNewsThread,
                            ChannelType.GuildPublicThread,
                            ChannelType.GuildPrivateThread,
                            ChannelType.GuildVoice,
                        ],
                    }],
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'ignoredroles',
            description: 'Ignores actions from certain roles from being logged',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'add',
                    description: 'Adds to the list of roles from which actions will be ignored from being logged',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Role,
                            name: 'role',
                            description: 'The role to be added to the list',
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'action',
                            description: 'The action to be ignored',
                            required: false,
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'remove',
                    description: 'Removes from the list of roles from which actions will be ignored from being logged',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Role,
                            name: 'role',
                            description: 'The role to be removed from the list',
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'action',
                            description: 'The action to start being logged again',
                            required: false,
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'info',
                    description: 'Shows which actions are being ignored from a certain role',
                    options: [{
                        type: ApplicationCommandOptionType.Role,
                        name: 'role',
                        description: 'The role to show info of',
                        required: true,
                    }],
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            description: 'Shows you general information about which actions are being logged and where from and to',
        },
    ],
    actionssetAutocomplete: {action: actionOptionMapper()},
    actionsremoveAutocomplete: {action: actionOptionMapper()},
    ignoredchannelsaddAutocomplete: {action: actionOptionMapper(e => e.ignorableChannels)},
    ignoredchannelsremoveAutocomplete: {action: actionOptionMapper(e => e.ignorableChannels)},
    ignoredrolesaddAutocomplete: {action: actionOptionMapper(e => e.ignorableRoles)},
    ignoredrolesremoveAutocomplete: {action: actionOptionMapper(e => e.ignorableRoles)},
};