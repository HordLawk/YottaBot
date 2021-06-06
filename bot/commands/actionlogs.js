const {MessageEmbed} = require('discord.js');
const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const guild = require('../../schemas/guild.js');

module.exports = {
    active: true,
    name: 'actionlogs',
    description: lang => 'Manages action logs for the server',
    aliases: ['logs'],
    usage: lang => ['defaultchannel (channel)', 'set delmsg <(channel)/default>', 'remove delmsg', 'ignore channel <add/remove> (channel) <delmsg/all>', 'ignore channel view (channel)', 'ignore role <add/remove> (role) <delmsg/all/view>', 'ignore role view (role)', 'view'],
    example: ['defaultchannel #logs', 'set delmsg #deleted-messages', 'remove delmsg', 'ignore channel add #staff delmsg', 'ignore channel view #staff', 'ignore role remove @Mods all', 'ignore role view @Mods'],
    cooldown: 5,
    categoryID: 0,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        let oldHook, hook;
        switch(args[0]){
            case 'defaultchannel':
                if(!args[1]) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                let discordChannel = message.guild.channels.cache.get((args[1].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                if(!discordChannel || !discordChannel.isText()) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                if(!message.guild.me.permissionsIn(discordChannel).has('MANAGE_WEBHOOKS')) return message.channel.send(message.client.langs[channelLanguage].get('botWebhooks'));
                hook = await discordChannel.createWebhook(message.client.user.username, {
                    avatar: message.client.user.avatarURL({size: 4096}),
                    reason: 'Default log channel webhook',
                });
                oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                if(oldHook && message.guild.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelID)).has('MANAGE_WEBHOOKS')) await oldHook.delete('Old default log channel webhook');
                await guild.findByIdAndUpdate(message.guild.id, {$set: {
                    defaultLogsHookID: hook.id,
                    defaultLogsHookToken: hook.token,
                }});
                message.client.guildData.get(message.guild.id).defaultLogsHookID = hook.id;
                message.client.guildData.get(message.guild.id).defaultLogsHookToken = hook.token;
                message.channel.send(`Default log channel set to ${discordChannel}`);
                break;
            case 'set':
                if((args.length < 3) || !message.client.configs.actions.includes(args[1])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                if(args[2] === 'default'){
                    hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                    if(!hook) return message.channel.send('Default log channel not defined');
                    oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                    if(oldHook && message.guild.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelID)).has('MANAGE_WEBHOOKS')) await oldHook.delete(`Old ${args[1]} log channel webhook`);
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
                    message.channel.send('This action was set to log in the default log channel');
                }
                else{
                    let discordChannel = message.guild.channels.cache.get((args[2].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                    if(!discordChannel || !discordChannel.isText()) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                    if(!message.guild.me.permissionsIn(discordChannel).has('MANAGE_WEBHOOKS')) return message.channel.send(message.client.langs[channelLanguage].get('botWebhooks'));
                    hook = await discordChannel.createWebhook(message.client.user.username, {
                        avatar: message.client.user.avatarURL({size: 4096}),
                        reason: `${args[1]} log channel webhook`,
                    });
                    oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                    if(oldHook && message.guild.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelID)).has('MANAGE_WEBHOOKS')) await oldHook.delete(`Old ${args[1]} log channel webhook`);
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
                    message.channel.send(`This action was set to log in ${discordChannel}`);
                }
                break;
            case 'remove':
                if(!args[1] || !message.client.configs.actions.includes(args[1]) || !message.client.configs.actions.includes(args[1])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                oldHook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookID, message.client.guildData.get(message.guild.id).actionlogs.id(args[1])?.hookToken).catch(() => null);
                if(oldHook && message.guild.me.permissionsIn(message.guild.channels.cache.get(oldHook.channelID)).has('MANAGE_WEBHOOKS')) await oldHook.delete(`Old ${args[1]} log channel webhook`);
                let guildDoc = await guild.findById(message.guild.id);
                if(guildDoc.actionlogs.id(args[1])){
                    guildDoc.actionlogs.id(args[1]).remove();
                    await guildDoc.save();
                    message.client.guildData.get(message.guild.id).actionlogs = guildDoc.actionlogs;
                }
                message.channel.send('This action won\'t be logged');
                break;
            case 'ignore':
                if(!['channel', 'role'].includes(args[1]) || (args.length < 4)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                switch(args[2]){
                    case 'view':
                        if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
                        if(args[1] === 'channel'){
                            let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                            if(!discordChannel) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                            let channelDoc = await channel.findById(discordChannel.id);
                            if(!channelDoc || !channelDoc.ignoreActions.length) return message.channel.send('No action is being ignored in this channel');
                            let embed = new MessageEmbed()
                                .setColor(message.guild.me.displayColor || 0x8000ff)
                                .setAuthor('Ignored channel', message.guil.iconURL({
                                    size: 4096,
                                    dynamic: true,
                                }))
                                .setDescription(`Channel: ${discordChannel}`)
                                .setTimestamp()
                                .setFooter(`${channelDoc.ignoreActions.length} ignored actions`)
                                .addField('Actions', channelDoc.ignoreActions.map(e => `**${e._id}**`).join(', '));
                            message.channel.send(embed);
                        }
                        else{
                            let discordRole = message.guild.roles.cache.get((args[3].match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(e => ((e.name === message.content.replace(/^(?:\S+\s+){4}/, '')) || e.name.startsWith(message.content.replace(/^(?:\S+\s+){4}/, ''))));
                            if(!discordRole) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                            let roleDoc = await role.findOne({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                ignoreActions: {$ne: []},
                            });
                            if(!roleDoc) return message.channel.send('No actions are being ignored for this role');
                            let embed = new MessageEmbed()
                                .setColor(message.guild.me.displayColor || 0x8000ff)
                                .setAuthor('Ignored role', message.guil.iconURL({
                                    size: 4096,
                                    dynamic: true,
                                }))
                                .setDescription(`Role: ${discordRole}`)
                                .setTimestamp()
                                .setFooter(`${roleDoc.ignoreActions.length} ignored actions`)
                                .addField('Actions', roleDoc.ignoreActions.map(e => `**${e._id}**`).join(', '));
                            message.channel.send(embed);
                        }
                        break;
                    case 'add':
                    case 'remove':
                        if(!args[4]) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        if(args[4] === 'all'){
                            if(args[1] === 'channel'){
                                let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                                if(!discordChannel) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                                if(args[2] === 'add'){
                                    await channel.findOneAndUpdate({
                                        _id: discordChannel.id,
                                        guild: message.guild.id,
                                    }, {$set: {ignoreActions: message.client.configs.actions}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.channel.send(`All actions will be ignored in ${discordChannel}`);
                                }
                                else{
                                    await channel.findByIdAndUpadte(discordChannel.id, {$set: {ignoreActions: []}});
                                    message.channel.send(`No actions will be ignored in ${discordChannel}`);
                                }
                            }
                            else{
                                let discordRole = message.guild.roles.cache.get((args[3].match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(e => ((e.name === message.content.replace(/^(?:\S+\s+){4}/, '')) || e.name.startsWith(message.content.replace(/^(?:\S+\s+){4}/, ''))));
                                if(!discordRole || (discordRole.id === message.guild.id)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                                if(args[2] === 'add'){
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$set: {ignoreActions: message.client.configs.actions}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.channel.send(`All actions will be ignored for **${discordRole.name}**`);
                                }
                                else{
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$set: {ignoreActions: []}});
                                    message.channel.send(`No actions will be ignored for **${discordRole.name}**`);
                                }
                            }
                        }
                        else{
                            if(!message.client.configs.actions.includes(args[4])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                            if(args[1] === 'channel'){
                                let discordChannel = message.guild.channels.cache.get((args[3].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
                                if(!discordChannel) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                                if(args[2] === 'add'){
                                    await channel.findOneAndUpdate({
                                        _id: discordChannel.id,
                                        guild: message.guild.id,
                                    }, {$addToSet: {ignoreActions: args[4]}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.channel.send(`${args[4]} will be ignored in ${discordChannel}`);
                                }
                                else{
                                    await channel.findByIdAndUpdate(discordChannel.id, {$pull: {ignoreActions: {$eq: args[4]}}});
                                    message.channel.send(`${args[4]} won't be ignored in ${discordChannel}`);
                                }
                            }
                            else{
                                let discordRole = message.guild.roles.cache.get((args[3].match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(e => ((e.name === message.content.replace(/^(?:\S+\s+){4}/, '')) || e.name.startsWith(message.content.replace(/^(?:\S+\s+){4}/, ''))));
                                if(!discordRole || (discordRole.id === message.guild.id)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                                if(args[2] === 'add'){
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$addToSet: {ignoreActions: args[4]}}, {
                                        upsert: true,
                                        setDefaultsOnInsert: true,
                                    });
                                    message.channel.send(`${args[4]} will be ignored for **${discordRole.name}**`);
                                }
                                else{
                                    await role.findOneAndUpdate({
                                        roleID: discordRole.id,
                                        guild: message.guild.id,
                                    }, {$pull: {ignoreActions: {$eq: args[4]}}});
                                    message.channel.send(`${args[4]} won't be ignored for **${discordRole.name}**`);
                                }
                            }
                        }
                        break;
                    default:
                        message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        break;
                }
                break;
            case 'view':
                if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
                hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor('Action logs info', message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }))
                    .setDescription(`Default channel: ${hook ? `<#${hook.channelID}>` : '\`none\`'}`)
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
                        channelID: actionHook.channelID,
                    });
                }
                if(activeLogs.length){
                    embed.addField('Logged actions', activeLogs.map(e => `**${e.id}** - ${e.channelID ? `<#${e.channelID}>` : '`Default`'}`).join('\n'));
                }
                let channels = await channel.find({
                    _id: {$in: message.client.channels.cache.map(e => e.id)},
                    guild: message.guild.id,
                    ignoreActions: {$ne: []},
                });
                if(channels.length) embed.addField('Ignored channels', channels.map(e => `<#${e._id}> - \`${(e.ignoreActions.length === message.client.configs.actions.length) ? 'All' : 'Some'}\``).join('\n'));
                let roles = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                    ignoreActions: {$ne: []},
                });
                if(roles.length) embed.addField('Ignored roles', roles.map(e => `<@&${e.roleID}> = \`${(e.ignoreActions.length === message.client.configs.actions.length) ? 'All' : 'Some'}\``).join('\n'));
                message.channel.send(embed);
                break;
            default:
                message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                break;
        }
    },
};