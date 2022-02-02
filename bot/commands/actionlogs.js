const {MessageEmbed, Permissions} = require('discord.js');
const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const guild = require('../../schemas/guild.js');

module.exports = {
    active: true,
    name: 'actionlogs',
    description: lang => lang.get('actionlogsDescription'),
    aliases: ['logs'],
    usage: lang => [lang.get('actionlogsUsage0'), lang.get('actionlogsUsage1'), 'remove <delmsg/prune/editmsg>', lang.get('actionlogsUsage2'), lang.get('actionlogsUsage3'), lang.get('actionlogsUsage4'), lang.get('actionlogsUsage5'), 'view'],
    example: ['defaultchannel #logs', 'set delmsg #deleted-messages', 'remove delmsg', 'ignore channel add #staff delmsg', 'ignore channel view #staff', 'ignore role remove @Mods all', 'ignore role view @Mods'],
    cooldown: 5,
    categoryID: 2,
    args: true,
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        switch(args[0]){
            case 'defaultchannel': {
                if(!args[1]) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                let discordChannel = message.guild.channels.cache.get((args[1].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                if(!discordChannel || !discordChannel.isText()) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.MANAGE_WEBHOOKS)) return message.reply(channelLanguage.get('botWebhooks'));
                let hook = await discordChannel.createWebhook(message.client.user.username, {
                    avatar: message.client.user.avatarURL({size: 4096}),
                    reason: channelLanguage.get('newDefaultHookReason'),
                });
                let oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                if(oldHook && message.guild.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelId)).has(Permissions.FLAGS.MANAGE_WEBHOOKS)) await oldHook.delete(channelLanguage.get('oldDefaultHookReason'));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {
                    defaultLogsHookID: hook.id,
                    defaultLogsHookToken: hook.token,
                }});
                message.client.guildData.get(message.guild.id).defaultLogsHookID = hook.id;
                message.client.guildData.get(message.guild.id).defaultLogsHookToken = hook.token;
                message.reply(channelLanguage.get('newDefaultLog', [discordChannel]));
            }
            break;
            case 'set': {
                if((args.length < 3) || !message.client.configs.actions.includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                if(args[2] === 'default'){
                    let hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                    if(!hook) return message.reply(channelLanguage.get('noDefaultLog'));
                    let oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                    if(oldHook && message.guild.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelId)).has(Permissions.FLAGS.MANAGE_WEBHOOKS)) await oldHook.delete(channelLanguage.get('oldHookReason', [channelLanguage.get(`action${args[1]}`)]));
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
                    if(!discordChannel || !discordChannel.isText()) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                    if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.MANAGE_WEBHOOKS)) return message.reply(channelLanguage.get('botWebhooks'));
                    let hook = await discordChannel.createWebhook(message.client.user.username, {
                        avatar: message.client.user.avatarURL({size: 4096}),
                        reason: channelLanguage.get('newHookReason', [channelLanguage.get(`action${args[1]}`)]),
                    });
                    let oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                    if(oldHook && message.guild.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelId)).has(Permissions.FLAGS.MANAGE_WEBHOOKS)) await oldHook.delete(channelLanguage.get('oldHookReason', [args[1]]));
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
                if(!args[1] || !message.client.configs.actions.includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                let oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                if(oldHook && message.guild.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelId)).has(Permissions.FLAGS.MANAGE_WEBHOOKS)) await oldHook.delete(channelLanguage.get('oldHookReason', [args[1]]));
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
                if(!['channel', 'role'].includes(args[1]) || (args.length < 4)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                switch(args[2]){
                    case 'view': {
                        if(!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
                        if(args[1] === 'channel'){
                            let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                            if(!discordChannel) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                            let channelDoc = await channel.findById(discordChannel.id);
                            if(!channelDoc || !channelDoc.ignoreActions.length) return message.reply(channelLanguage.get('noIgnoredActionsChannel'));
                            let embed = new MessageEmbed()
                                .setColor(message.guild.me.displayColor || 0x8000ff)
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
                                .addField(channelLanguage.get('ignoredActionsEmbedActionsTitle'), channelDoc.ignoreActions.map(e => channelLanguage.get(`action${e}`)).join(', '));
                            message.reply({embeds: [embed]});
                        }
                        else{
                            let roleName = message.content.toLowerCase().replace(/^(?:\S+\s+){4}/, '');
                            let discordRole = message.guild.roles.cache.get(args[3].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                            if(!discordRole || (discordRole.id === message.guild.id)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                            let roleDoc = await role.findOne({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                ignoreActions: {$ne: []},
                            });
                            if(!roleDoc) return message.reply(channelLanguage.get('noIgnoredActionsRole'));
                            let embed = new MessageEmbed()
                                .setColor(message.guild.me.displayColor || 0x8000ff)
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
                                .addField(channelLanguage.get('ignoredActionsEmbedActionsTitle'), roleDoc.ignoreActions.map(e => channelLanguage.get(`action${e}`)).join(', '));
                            message.reply({embeds: [embed]});
                        }
                    }
                    break;
                    case 'add':
                    case 'remove': {
                        if(!args[4]) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                        if(args[4] === 'all'){
                            if(args[1] === 'channel'){
                                let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                                if(!discordChannel) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                                if(args[2] === 'add'){
                                    await channel.findOneAndUpdate({
                                        _id: discordChannel.id,
                                        guild: message.guild.id,
                                    }, {$set: {ignoreActions: message.client.configs.actions}}, {
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
                                if(!discordRole || (discordRole.id === message.guild.id)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                                if(args[2] === 'add'){
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$set: {ignoreActions: message.client.configs.actions}}, {
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
                            if(!message.client.configs.actions.includes(args[4])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                            if(args[1] === 'channel'){
                                let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                                if(!discordChannel) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                                if(args[2] === 'add'){
                                    await channel.findOneAndUpdate({
                                        _id: discordChannel.id,
                                        guild: message.guild.id,
                                    }, {$addToSet: {ignoreActions: args[4]}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.reply(channelLanguage.get('actionIgnoredChannelSuccess', [channelLanguage.get(`action${args[4]}`), discordChannel]));
                                }
                                else{
                                    await channel.findByIdAndUpdate(discordChannel.id, {$pull: {ignoreActions: args[4]}});
                                    message.reply(channelLanguage.get('actionNotIgnoredChannelSuccess', [channelLanguage.get(`action${args[4]}`), discordChannel]));
                                }
                            }
                            else{
                                let roleName = message.content.toLowerCase().replace(/^(?:\S+\s+){4}/, '');
                                let discordRole = message.guild.roles.cache.get(args[3].match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(e => (e.name.toLowerCase() === roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().startsWith(roleName)) ?? message.guild.roles.cache.find(e => e.name.toLowerCase().includes(roleName));
                                if(!discordRole || (discordRole.id === message.guild.id)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                                if(args[2] === 'add'){
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$addToSet: {ignoreActions: args[4]}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.reply(channelLanguage.get('actionIgnoredRoleSuccess', [channelLanguage.get(`action${args[4]}`), discordRole.name]));
                                }
                                else{
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$pull: {ignoreActions: args[4]}});
                                    message.reply(channelLanguage.get('actionNotIgnoredRoleSuccess', [channelLanguage.get(`action${args[4]}`), discordRole.name]));
                                }
                            }
                        }
                    }
                    break;
                    default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                }
            }
            break;
            case 'view': {
                if(!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
                let hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
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
                if(channels.length) embed.addField(channelLanguage.get('logsViewEmbedIgnoredChannelsTitle'), channels.map(e => `<#${e._id}> - \`${(e.ignoreActions.length === message.client.configs.actions.length) ? channelLanguage.get('logsViewEmbedIgnoredAll') : channelLanguage.get('logsViewEmbedIgnoredSome')}\``).join('\n'));
                let roles = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                    ignoreActions: {$ne: []},
                });
                if(roles.length) embed.addField(channelLanguage.get('logsViewEmbedIgnoredRolesTitle'), roles.map(e => `<@&${e.roleID}> - \`${(e.ignoreActions.length === message.client.configs.actions.length) ? channelLanguage.get('logsViewEmbedIgnoredAll') : channelLanguage.get('logsViewEmbedIgnoredSome')}\``).join('\n'));
                message.reply({embeds: [embed]});
            }
            break;
            default: message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        }
    },
};