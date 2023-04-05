// Copyright (C) 2023  HordLawk

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

const {EmbedBuilder, PermissionsBitField, ButtonStyle, ComponentType, ApplicationCommandOptionType} = require('discord.js');
const configs = require('../configs.js');
const {handleComponentError, getStringLocales} = require('../utils.js');

module.exports = {
    active: true,
    name: 'msgxp',
    description: lang => lang.get('msgxpDescription'),
    aliases: ['lvlup', 'msgexp', 'messagexp', 'messageexp'],
    usage: lang => [lang.get('msgxpUsage0'), lang.get('msgxpUsage8'), lang.get('msgxpUsage1'), lang.get('msgxpUsage2'), lang.get('msgxpUsage3'), lang.get('msgxpUsage4'), lang.get('msgxpUsage5'), lang.get('msgxpUsage6'), lang.get('msgxpUsage10'), lang.get('msgxpUsage11'), lang.get('msgxpUsage7'), lang.get('msgxpUsage9')],
    example: ['enable on', 'stack off', 'roles add @Active 1440', 'roles remove @Active', 'user add 100 @LordHawk#0001', 'ignore role remove @Mods', 'ignore channel add #spam', 'notify #levelup', 'recommend 16 43368', 'multiplier @VIP 2'],
    cooldown: 5,
    categoryID: 4,
    args: true,
    perm: PermissionsBitField.Flags.Administrator,
    guildOnly: true,
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'enable',
            nameLocalizations: getStringLocales('msgxp_enableLocalisedName'),
            description: 'Whether to enable xp earning in text channels',
            descriptionLocalizations: getStringLocales('msgxp_enableLocalisedDesc'),
            options: [{
                type: ApplicationCommandOptionType.Boolean,
                name: 'enabled',
                nameLocalizations: getStringLocales('msgxp_enableOptionenabledLocalisedName'),
                description: 'True to enable False to disable xp earning in text channels',
                descriptionLocalizations: getStringLocales('msgxp_enableOptionenabledLocalisedDesc'),
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'stackroles',
            nameLocalizations: getStringLocales('msgxp_stackrolesLocalisedName'),
            description: 'Stacks new xp roles instead of removing previous roles when adding higher ranked ones',
            descriptionLocalizations: getStringLocales('msgxp_stackrolesLocalisedDesc'),
            options: [{
                type: ApplicationCommandOptionType.Boolean,
                name: 'enable',
                nameLocalizations: getStringLocales('msgxp_stackrolesOptionenableLocalisedName'),
                description: 'Whether to stack new xp roles or remove previous ones when a higher one is earned',
                descriptionLocalizations: getStringLocales('msgxp_stackrolesOptionenableLocalisedDesc'),
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'roles',
            nameLocalizations: getStringLocales('msgxp_rolesLocalisedName'),
            description: 'Manages the roles that can be achieved by earning xp talking in text or voice channels',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'set',
                    nameLocalizations: getStringLocales('msgxp_roles_setLocalisedName'),
                    description: 'Sets an amount of xp that can be achieve to earn an specified role',
                    descriptionLocalizations: getStringLocales('msgxp_roles_setLocalisedDesc'),
                    options: [
                        {
                            type: ApplicationCommandOptionType.Role,
                            name: 'role',
                            nameLocalizations: getStringLocales('msgxp_roles_setOptionroleLocalisedName'),
                            description: 'The role that can be achieved by earning xp',
                            descriptionLocalizations: getStringLocales('msgxp_roles_setOptionroleLocalisedDesc'),
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'xp',
                            nameLocalizations: getStringLocales('msgxp_roles_setOptionxpLocalisedName'),
                            description: 'The amount of xp needed to achieve the role',
                            descriptionLocalizations: getStringLocales('msgxp_roles_setOptionxpLocalisedDesc'),
                            minValue: 1,
                            required: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'remove',
                    nameLocalizations: getStringLocales('msgxp_roles_removeLocalisedName'),
                    description: 'Removes roles from being achieveable',
                    descriptionLocalizations: getStringLocales('msgxp_roles_removeLocalisedDesc'),
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'xp',
            nameLocalizations: getStringLocales('msgxp_xpLocalisedName'),
            description: 'Manages the xp of one or more users',
            descriptionLocalizations: getStringLocales('msgxp_xpLocalisedDesc'),
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'action',
                    nameLocalizations: getStringLocales('msgxp_xpOptionactionLocalisedName'),
                    description: 'What to do with the user\'s xp',
                    descriptionLocalizations: getStringLocales('msgxp_xpOptionactionLocalisedDesc'),
                    required: true,
                    choices: [
                        {
                            name: 'Add',
                            nameLocalizations: getStringLocales('msgxp_xpOptionactionChoiceADDLocalisedName'),
                            value: 'ADD',
                        },
                        {
                            name: 'Remove',
                            nameLocalizations: getStringLocales('msgxp_xpOptionactionChoiceREMOVELocalisedName'),
                            value: 'REMOVE',
                        },
                        {
                            name: 'Set',
                            nameLocalizations: getStringLocales('msgxp_xpOptionactionChoiceSETLocalisedName'),
                            value: 'SET',
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'value',
                    nameLocalizations: getStringLocales('msgxp_xpOptionvalueLocalisedName'),
                    description: 'The amount of xp to operate',
                    descriptionLocalizations: getStringLocales('msgxp_xpOptionvalueLocalisedDesc'),
                    required: true,
                    minValue: 0,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'ignore',
            nameLocalizations: getStringLocales('msgxp_ignoreLocalisedName'),
            description: 'Choose roles that won\'t be given xp or channels where users won\'t earn xp',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'roles',
                    nameLocalizations: getStringLocales('msgxp_ignore_rolesLocalisedName'),
                    description: 'Manage roles which its members won\'t be given xp',
                    descriptionLocalizations: getStringLocales('msgxp_ignore_rolesLocalisedDesc'),
                    options: [{
                        type: ApplicationCommandOptionType.Boolean,
                        name: 'add',
                        nameLocalizations: getStringLocales('msgxp_ignore_rolesOptionaddLocalisedName'),
                        description: 'True to ignore these roles or False to remove from the list of ignored roles',
                        descriptionLocalizations: getStringLocales('msgxp_ignore_rolesOptionaddLocalisedDesc'),
                        required: true,
                    }],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'channels',
                    nameLocalizations: getStringLocales('msgxp_ignore_channelsLocalisedName'),
                    description: 'Manage channel where members can\'t earn xp',
                    descriptionLocalizations: getStringLocales('msgxp_ignore_channelsLocalisedDesc'),
                    options: [{
                        type: ApplicationCommandOptionType.Boolean,
                        name: 'add',
                        nameLocalizations: getStringLocales('msgxp_ignore_channelsOptionaddLocalisedName'),
                        description: (
                            'True to ignore these channels or False to remove from the list of ignored channels'
                        ),
                        descriptionLocalizations: getStringLocales('msgxp_ignore_channelsOptionaddLocalisedDesc'),
                        required: true,
                    }],
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'notifications',
            nameLocalizations: getStringLocales('msgxp_notificationsLocalisedName'),
            description: 'Choose if and where level up notifications should be sent',
            descriptionLocalizations: getStringLocales('msgxp_notificationsLocalisedDesc'),
            options: [{
                type: ApplicationCommandOptionType.String,
                name: 'mode',
                nameLocalizations: getStringLocales('msgxp_notificationsOptionmodeLocalisedName'),
                description: 'How the channel where level up notifications will be sent should be decided',
                descriptionLocalizations: getStringLocales('msgxp_notificationsOptionmodeLocalisedDesc'),
                required: true,
                choices: [
                    {
                        name: 'Do not send notifications',
                        nameLocalizations: getStringLocales('msgxp_notificationsOptionmodeChoiceNONELocalisedName'),
                        value: 'NONE',
                    },
                    {
                        name: 'The channel where the levelling up occurred',
                        nameLocalizations: getStringLocales('msgxp_notificationsOptionmodeChoiceDEFAULTLocalisedName'),
                        value: 'DEFAULT',
                    },
                    {
                        name: 'DM the member who levelled up',
                        nameLocalizations: getStringLocales('msgxp_notificationsOptionmodeChoiceDMLocalisedName'),
                        value: 'DM',
                    },
                    {
                        name: 'Choose a specific channel',
                        nameLocalizations: getStringLocales('msgxp_notificationsOptionmodeChoiceCHANNELLocalisedName'),
                        value: 'CHANNEL',
                    },
                ],
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'recommendlevels',
            nameLocalizations: getStringLocales('msgxp_recommendlevelsLocalisedName'),
            description: 'Get recommendations for how much xp to set for each level based on your preferences',
            descriptionLocalizations: getStringLocales('msgxp_recommendlevelsLocalisedDesc'),
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'number_of_levels',
                    nameLocalizations: getStringLocales('msgxp_recommendlevelsOptionnumber_of_levelsLocalisedName'),
                    description: 'How many level roles you would like to have in total',
                    descriptionLocalizations: getStringLocales(
                        'msgxp_recommendlevelsOptionnumber_of_levelsLocalisedDesc',
                    ),
                    required: true,
                    minValue: 2,
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'highest_level_xp',
                    nameLocalizations: getStringLocales('msgxp_recommendlevelsOptionhighest_level_xpLocalisedName'),
                    description: 'The approximate amount of xp you would like the highest level role to require',
                    descriptionLocalizations: getStringLocales(
                        'msgxp_recommendlevelsOptionhighest_level_xpLocalisedDesc',
                    ),
                    required: true,
                    minValue: 13,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'multipliers',
            nameLocalizations: getStringLocales('msgxp_multipliersLocalisedName'),
            description: 'Manage xp multipliers for specific roles which you would like to earn more xp',
            descriptionLocalizations: getStringLocales('msgxp_multipliersLocalisedDesc'),
            options: [{
                type: ApplicationCommandOptionType.Number,
                name: 'multiplier_value',
                nameLocalizations: getStringLocales('msgxp_multipliersOptionmultiplier_valueLocalisedName'),
                description: 'By how much to multiply the amount of xp earned by chosen roles',
                descriptionLocalizations: getStringLocales('msgxp_multipliersOptionmultiplier_valueLocalisedDesc'),
                required: true,
                minValue: 1,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            nameLocalizations: getStringLocales('msgxp_infoLocalisedName'),
            description: 'Shows detailed info on the xp system configuration for this server',
            descriptionLocalizations: getStringLocales('msgxp_infoLocalisedDesc'),
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'resetrank',
            nameLocalizations: getStringLocales('msgxp_resetrankLocalisedName'),
            description: 'Resets the xp for all users to 0',
            descriptionLocalizations: getStringLocales('msgxp_resetrankLocalisedDesc'),
        },
    ],
    execute: async function(message, args){
        const {channelLanguage} = message;
        const member = require('../../schemas/member.js');
        const channel = require('../../schemas/channel.js');
        const role = require('../../schemas/role.js');
        const guild = require('../../schemas/guild.js');
        switch(args[0]){
            case 'enable': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {gainExp: (args[1] === 'on')}});
                message.client.guildData.get(message.guild.id).gainExp = (args[1] === 'on');
                await message.reply(channelLanguage.get('xpEnable', {enabled: (args[1] === 'on')}));
            }
            break;
            case 'stack': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {dontStack: (args[1] === 'off')}});
                message.client.guildData.get(message.guild.id).dontStack = (args[1] === 'off');
                await message.reply(channelLanguage.get('xpStack', {enabled: (args[1] === 'on')}));
            }
            break;
            case 'roles': {
                if(!args[2]) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                switch(args[1]){
                    case 'set': {
                        const match = message.content.toLowerCase().match(/^(?:\S+\s+){3}(.+)\s+(\d+)$/);
                        if(!match) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        if(isNaN(parseInt(match[2], 10)) || !isFinite(parseInt(match[2], 10)) || (parseInt(match[2], 10) < 1)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        const roleName = match[1];
                        let discordRole = message.guild.roles.cache.get(args[2].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                        if(!discordRole || (discordRole.id === message.guild.id)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        if(!discordRole.editable || discordRole.managed) return message.reply(channelLanguage.get('manageRole'));
                        if(discordRole.position >= message.member.roles.highest.position){
                            return await message.reply(channelLanguage.get('memberManageRole'));
                        }
                        let roleDocs = await role.find({
                            guild: message.guild.id,
                            roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                            xp: {$ne: null},
                        });
                        if(roleDocs.some(e => (e.xp === parseInt(match[2], 10)))) return message.reply(channelLanguage.get('sameXp'));
                        let oldRole = roleDocs.find(e => (e.roleID === discordRole.id));
                        if(oldRole){
                            oldRole.xp = parseInt(match[2], 10);
                            await oldRole.save();
                        }
                        else{
                            if((roleDocs.length >= 10) && !message.client.guildData.get(message.guild.id).premiumUntil && !message.client.guildData.get(message.guild.id).partner) return message.reply(channelLanguage.get('maxXpRoles'));
                            let newRole = new role({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                xp: parseInt(match[2], 10),
                            });
                            await newRole.save();
                        }
                        message.reply(channelLanguage.get('setXpRole', [discordRole.name, parseInt(match[2], 10)]));
                    }
                    break;
                    case 'remove': {
                        if(args[2] === 'all'){
                            await role.updateMany({
                                guild: message.guild.id,
                                xp: {$ne: null},
                            }, {$set: {xp: null}});
                            message.reply(channelLanguage.get('resetXpRoles'));
                        }
                        else{
                            let roleName = message.content.toLowerCase().replace(/^(?:\S+\s+){3}/, '');
                            let discordRole = message.guild.roles.cache.get(args[2].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                            if(!discordRole || (discordRole.id === message.guild.id)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                            await role.findOneAndUpdate({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                xp: {$ne: null},
                            }, {$set: {xp: null}});
                            message.reply(channelLanguage.get('removeXpRole', [discordRole.name]));
                        }
                    }
                    break;
                    default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                }
            }
            break;
            case 'user': {
                if(!['add', 'remove', 'set'].includes(args[1]) || isNaN(parseInt(args[2], 10)) || !isFinite(parseInt(args[2], 10)) || (parseInt(args[2], 10) < 0)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                let mentions = args.slice(3, 13).join(' ').match(/\b\d{17,19}\b/g);
                if(!mentions) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                let memberDocs = await member.find({
                    guild: message.guild.id,
                    userID: {$in: mentions},
                });
                let members = await message.guild.members.fetch({user: mentions});
                let newMembers = members.map(e => ({
                    guild: message.guild.id,
                    userID: e.id,
                })).filter(e => !memberDocs.some(ee => (ee.userID === e.userID)));
                await member.insertMany(newMembers);
                memberDocs = await member.find({
                    guild: message.guild.id,
                    userID: {$in: mentions},
                });
                let query;
                switch(args[1]){
                    case 'add': query = {$inc: {xp: parseInt(args[2], 10)}};
                    break;
                    case 'remove': query = {$inc: {xp: -(parseInt(args[2], 10))}};
                    break;
                    case 'set': query = {$set: {xp: parseInt(args[2], 10)}};
                    break;
                }
                await member.updateMany({
                    guild: message.guild.id,
                    userID: {$in: memberDocs.map(e => e.userID)},
                }, query);
                if(args[1] === 'remove') await member.updateMany({
                    guild: message.guild.id,
                    xp: {$lt: 0},
                }, {$set: {xp: 0}});
                let roleDocs = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.filter(e => e.editable).map(e => e.id)},
                    xp: {$ne: null},
                }).sort({xp: -1});
                if(roleDocs.length){
                    let discordMemberDocs = await member.find({
                        guild: message.guild.id,
                        userID: {$in: members.map(e => e.id)},
                    })
                    for(let discordMemberDoc of discordMemberDocs) await members.get(discordMemberDoc.userID).roles.set(members.get(discordMemberDoc.userID).roles.cache.filter(e => !roleDocs.some(ee => (e.id === ee.roleID))).map(e => e.id).concat(roleDocs.filter(e => (e.xp <= discordMemberDoc.xp)).slice(0, message.client.guildData.get(message.guild.id).dontStack ? 1 : undefined).map(e => e.roleID)));
                }
                message.reply(channelLanguage.get('setUserXp'));
            }
            break;
            case 'ignore': {
                if(!args[3] || !['role', 'channel'].includes(args[1]) || !['add', 'remove'].includes(args[2])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                if(args[1] === 'role'){
                    let roleName = message.content.toLowerCase().replace(/^(?:\S+\s+){4}/, '');
                    let discordRole = message.guild.roles.cache.get(args[3].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                    if(!discordRole || (discordRole.id === message.guild.id)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                    await role.findOneAndUpdate({
                        guild: message.guild.id,
                        roleID: discordRole.id,
                    }, {$set: {ignoreXp: (args[2] === 'add')}}, {
                        upsert: true,
                        setDefaultsOnInsert: true,
                    });
                    message.reply(channelLanguage.get('xpIgnoreRole', [discordRole.name, args[2]]));
                }
                else{
                    let discordChannel = message.guild.channels.cache.get((args[3].match(/<#(\d{17,19})>/) || [])[1]) || message.guild.channels.cache.get(args[3]);
                    if(!discordChannel || !discordChannel.isTextBased()) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                    await channel.findOneAndUpdate({
                        _id: discordChannel.id,
                        guild: message.guild.id,
                    }, {$set: {ignoreXp: (args[2] === 'add')}}, {
                        upsert: true,
                        setDefaultsOnInsert: true,
                    });
                    message.reply(channelLanguage.get('xpIgnoreChannel', [args[2], discordChannel]));
                }
            }
            break;
            case 'notify': {
                if(!args[1]) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                switch(args[1]){
                    case 'dm':
                    case 'default': {
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: args[1]}});
                        message.client.guildData.get(message.guild.id).xpChannel = args[1];
                        message.reply(channelLanguage.get('notifyDefault', [args[1]]));
                    }
                    break;
                    case 'none': {
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: null}});
                        message.client.guildData.get(message.guild.id).xpChannel = null;
                        message.reply(channelLanguage.get('notifyNone'));
                    }
                    break;
                    default: {
                        let discordChannel = message.guild.channels.cache.get((args[1].match(/<#(\d{17,19})>/) || [])[1]) || message.guild.channels.cache.get(args[1]);
                        if(!discordChannel || !discordChannel.isTextBased()) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.viewable) return message.reply(channelLanguage.get('sendMessages'));
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: discordChannel.id}});
                        message.client.guildData.get(message.guild.id).xpChannel = discordChannel.id;
                        message.reply(channelLanguage.get('notifyChannel', [discordChannel]));
                    }
                }
            }
            break;
            case 'recommend': {
                if(isNaN(parseInt(args[1], 10)) || isNaN(parseInt(args[2], 10)) || !isFinite(parseInt(args[1], 10)) || !isFinite(parseInt(args[2], 10)) || (parseInt(args[1], 10) < 0) || (parseInt(args[2], 10) < 0)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                if(parseInt(args[1], 10) < 2) return message.reply(channelLanguage.get('recommendMinLevels'));
                if(parseInt(args[2], 10) < 13) return message.reply(channelLanguage.get('recommendMinXp'));
                let levels = [];
                for(let i = 0; (levels[levels.length - 1] ?? 0) < (parseInt(args[2], 10) * 20); i++) levels.push((levels[levels.length - 1] ?? 0) + (5 * (i ** 2)) + (50 * i) + 100);
                if((levels[levels.length - 1] - (parseInt(args[2], 10) * 20)) > ((parseInt(args[2], 10) * 20) - levels[levels.length - 2])) levels.pop();
                if(parseInt(args[1], 10) > levels.length) return message.reply(channelLanguage.get('recommendXpNotEnough', [args[2], args[1]]));
                let realLevels = [];
                // Throughout the entirety of this project, the next lines are the only part of it I don't quite undestand what's really happening, thus, they are utterly unoptimized and will continue to be so, as I truly hope I don't need to touch this piece of code ever again.
                let cei = Math.ceil(levels.length / parseInt(args[1], 10));
                let flr = Math.floor(levels.length / parseInt(args[1], 10));
                let dec = (levels.length / parseInt(args[1], 10)) - flr;
                let multCei = parseInt(args[1], 10) * dec;
                let multFlr = parseInt(args[1], 10) * (1 - dec);
                let ceis = (new Array(Math.round(multCei))).fill(cei);
                let flrs = (new Array(Math.round(multFlr))).fill(flr).concat(ceis);
                let index = 0;
                for(let i = 0; i < parseInt(args[1], 10); i++){
                    index += flrs[i];
                    realLevels.push(levels[Math.round(index - 1)]);
                }
                message.reply(channelLanguage.get('recommendSuccess', [realLevels]));
            }
            break;
            case 'multiplier': {
                const match = message.content.toLowerCase().match(/^(?:\S+\s+){2}(.+)\s+(\d+(?:\.\d+)?)$/);
                if(!match) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                if(isNaN(parseFloat(match[2], 10)) || !isFinite(parseFloat(match[2], 10)) || (parseFloat(match[2], 10) < 1)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                const roleName = match[1];
                const discordRole = message.guild.roles.cache.get(args[1].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                if(!discordRole || (discordRole.id === message.guild.id)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                const roleDoc = await role.findOneAndUpdate({
                    guild: message.guild.id,
                    roleID: discordRole.id,
                }, {$set: {xpMultiplier: (Math.round(parseFloat(match[2], 10) * 10)) / 10}}, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                    new: true,
                });
                message.reply(channelLanguage.get('multiplierSuccess', [discordRole, roleDoc.xpMultiplier]));
            }
            break;
            case 'view': {
                if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
                let notifs;
                switch(message.client.guildData.get(message.guild.id).xpChannel){
                    case 'default': notifs = channelLanguage.get('notifyDefaultView');
                    break;
                    case 'dm': notifs = channelLanguage.get('notifyDMView');
                    break;
                    default: notifs = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).xpChannel) || channelLanguage.get('notifyNoneView');
                }
                let embed = new EmbedBuilder()
                    .setColor(message.guild.members.me.displayColor || 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('xpViewEmbedAuthor'),
                        iconURL: message.guild.iconURL({
                            size: 4096,
                            dynamic: true,
                        }),
                    })
                    .setDescription(channelLanguage.get('xpViewEmbedDesc', [message.client.guildData.get(message.guild.id).gainExp, message.client.guildData.get(message.guild.id).dontStack, notifs]))
                    .setTimestamp();
                let roles = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                }).sort({xp: -1});
                const replyData = {};
                if(roles.filter(e => e.xp).length){
                    if((roles.filter(e => e.xp).length > configs.xpRolesLimit) && !message.client.guildData.get(message.guild.id).premiumUntil && !message.client.guildData.get(message.guild.id).partner) replyData.content = channelLanguage.get('disabledPremiumXpRolesNoHL');
                    embed.addField(channelLanguage.get('xpViewRoles'), roles.filter(e => e.xp).map((e, i) => {
                        const roleStr = `\`${(new Array(roles.filter(e => e.xp)[0].xp.toString().length - e.xp.toString().length)).fill(' ').join('')}${e.xp}\` **-** <@&${e.roleID}>`;
                        return (((roles.filter(e => e.xp).length - i) > configs.xpRolesLimit) && !message.client.guildData.get(message.guild.id).premiumUntil && !message.client.guildData.get(message.guild.id).partner) ? `~~${roleStr}~~` : roleStr;
                    }).join('\n'));
                }
                if(roles.filter(e => (e.xpMultiplier && (e.xpMultiplier > 1))).length) embed.addField(channelLanguage.get('xpViewMultipliedRoles'), roles.filter(e => (e.xpMultiplier && (e.xpMultiplier > 1))).map(e => `<@&${e.roleID}> **-** \`${e.xpMultiplier}x\``).join('\n'));
                if(roles.filter(e => e.ignoreXp).length) embed.addField(channelLanguage.get('xpViewIgnoredRoles'), roles.filter(e => e.ignoreXp).map(e => `<@&${e.roleID}>`).join(' '));
                let channels = await channel.find({
                    _id: {$in: message.guild.channels.cache.filter(e => e.isTextBased()).map(e => e.id)},
                    guild: message.guild.id,
                    ignoreXp: true,
                });
                if(channels.length) embed.addField(channelLanguage.get('xpViewIgnoredChannels'), channels.map(e => `<#${e._id}>`).join(' '));
                replyData.embeds = [embed];
                message.reply(replyData);
            }
            break;
            case 'reset': {
                const buttonConfirm = {
                    type: ComponentType.Button,
                    label: channelLanguage.get('confirm'),
                    style: ButtonStyle.Success,
                    emoji: '✅',
                    customId: 'confirm',
                };
                const buttonCancel = {
                    type: ComponentType.Button,
                    label: channelLanguage.get('cancel'),
                    style: ButtonStyle.Danger,
                    emoji: '❌',
                    customId: 'cancel',
                };
                const components = [{
                    type: ComponentType.ActionRow,
                    components: [buttonConfirm, buttonCancel],
                }];
                const reply = await message.reply({
                    content: channelLanguage.get('resetXpConfirm'),
                    components,
                });
                const collector = reply.createMessageComponentCollector({
                    filter: componentInteraction => (componentInteraction.user.id === message.author.id),
                    idle: 10000,
                    max: 1,
                    componentType: ComponentType.Button,
                });
                collector.on('collect', i => (async i => {
                    switch(i.customId){
                        case 'cancel': {
                            await i.reply({content: channelLanguage.get('cancelled')});
                        }
                        break;
                        case 'confirm': {
                            await member.updateMany({
                                guild: message.guild.id,
                                xp: {$ne: 0},
                            }, {$set: {xp: 0}});
                            await i.reply({content: channelLanguage.get('resetXp')});
                        }
                        break;
                    }
                })(i).catch(async err => await handleComponentError(err, i)));
                collector.on('end', async collected => {
                    if(!reply.editable) return;
                    buttonCancel.disabled = buttonConfirm.disabled = true;
                    const msgData = {components};
                    if(!collected.size) msgData.content = channelLanguage.get('timedOut');
                    await reply.edit(msgData);
                });
            }
            break;
            default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        }
    },
    enableSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guildModel = require('../../schemas/guild.js');
        await guildModel.findByIdAndUpdate(
            interaction.guild.id,
            {$set: {gainExp: (interaction.client.guildData.get(interaction.guild.id).gainExp = args.enabled)}},
        );
        await interaction.reply(channelLanguage.get('xpEnable', {enabled: args.enabled}));
    },
    stackrolesSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guildModel = require('../../schemas/guild.js');
        await guildModel.findByIdAndUpdate(
            interaction.guild.id,
            {$set: {dontStack: (interaction.client.guildData.get(interaction.guild.id).dontStack = !args.enable)}},
        );
        await interaction.reply(channelLanguage.get('xpStack', {enabled: args.enable}));
    },
    rolessetSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(args.role.id === interaction.guild.id) return await interaction.reply({
            content: channelLanguage.get('everyoneLevelRoleError'),
            ephemeral: true,
        });
        if(!args.role.editable || args.role.managed) return await interaction.reply({
            content: channelLanguage.get('manageRole'),
            ephemeral: true,
        });
        if(args.role.position >= interaction.member.roles.highest.position) return await interaction.reply({
            content: channelLanguage.get('memberManageRole'),
            ephemeral: true,
        });
        const roleModel = require('../../schemas/role.js');
        const roleDocs = await roleModel.find({
            guild: interaction.guild.id,
            roleID: {$in: [...interaction.guild.roles.cache.keys()]},
            xp: {$ne: null},
        });
        if(roleDocs.some(e => (e.xp === args.xp))) return await interaction.reply({
            content: channelLanguage.get('sameXp'),
            ephemeral: true,
        });
        const oldRole = roleDocs.find(e => (e.roleID === args,role.id));
        if(oldRole){
            oldRole.xp = args.xp;
            await oldRole.save();
        }
        else{
            const guildData = interaction.client.guildData.get(interaction.guild.id);
            if((roleDocs.length >= 10) && !guildData.premiumUntil && !guildData.partner){
                return await interaction.reply({
                    content: channelLanguage.get('maxXpRoles'),
                    ephemeral: true,
                });
            }
            const newRole = new role({
                guild: interaction.guild.id,
                roleID: args.role.id,
                xp: args.xp,
            });
            await newRole.save();
        }
        await interaction.reply(channelLanguage.get('setXpRole', [args.role.name, args.xp]));
    },
    rolesremoveSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        await interaction.reply({
            content: channelLanguage.get('removeXpRolesMenu'),
            components: [{
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.RoleSelect,
                    customId: 'wf:rmlv:0',
                    maxValues: 25,
                }],
            }],
        });
    },
};