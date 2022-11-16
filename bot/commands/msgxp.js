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

const {EmbedBuilder, PermissionsBitField, ButtonStyle, ComponentType} = require('discord.js');
const configs = require('../configs.js');
const { handleComponentError } = require('../utils.js');

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
                message.reply(channelLanguage.get('xpEnable', [args[1]]));
            }
            break;
            case 'stack': {
                if(!['on', 'off'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {dontStack: (args[1] === 'off')}});
                message.client.guildData.get(message.guild.id).dontStack = (args[1] === 'off');
                message.reply(channelLanguage.get('xpStack', [args[1]]));
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
                        if(discordRole.position >= message.member.roles.highest.position) message.reply(channelLanguage.get('memberManageRole'));
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
};