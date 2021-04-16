const guild = require('../../schemas/guild.js');
const role = require('../../schemas/role.js');
const channel = require('../../schemas/channel.js');
const member = require('../../schemas/member.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'msgxp',
    description: lang => 'Manages this server\'s xp system',
    aliases: ['lvlup', 'msgexp', 'messagexp', 'messageexp'],
    usage: lang => ['<enable/stack> <on/off>', 'roles set (role) (xp)', 'roles remove <(role)/all>', 'user <add/remove/set> (user) (xp)', 'ignore role <add/remove> (role)', 'ignore channel <add/remove> (channel)', 'notify <default/none/dm/(channel)>', '<view/reset>'],
    example: ['enable on', 'roles add @Active 1440', 'roles remove @Active', 'user add @LordHawk#0572 100', 'ignore role @Mods', 'ignore channel #spam', 'notify #levelup'],
    cooldown: 5,
    categoryID: 0,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        switch(args[0]){
            case 'enable':
                if(!['on', 'off'].includes(args[1])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {gainExp: (args[1] === 'on')}});
                message.client.guildData.get(message.guild.id).gainExp = (args[1] === 'on');
                message.channel.send(`Server xp system successfully ${(args[1] === 'on') ? 'enabled': 'disabled'}`);
                break;
            case 'stack':
                if(!['on', 'off'].includes(args[1])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {dontStack: (args[1] === 'off')}});
                message.client.guildData.get(message.guild.id).dontStack = (args[1] === 'off');
                message.channel.send(`Role stacking successfully ${(args[1] === 'on') ? 'enabled': 'disabled'}`);
                break;
            case 'roles':
                if(!args[2]) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                switch(args[1]){
                    case 'set':
                        if(isNaN(parseInt(args[3])) || !isFinite(parseInt(args[3])) || (parseInt(args[3]) < 1)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        let discordRole = message.guild.roles.cache.get((args[2].match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(e => (e.name === message.content.replace(/^(?:\S+\s+){3}/, '').replace(/\s+\S+\s+$/, ''))) || message.guild.roles.cache.find(e => (e.name.startsWith(message.content.replace(/^(?:\S+\s+){3}/, '').replace(/\s+\S+\s+$/, ''))));
                        if(!discordRole) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        if(!discordRole.editable) return message.channel.send('I need permissions to manage this role');
                        let roleDocs = await role.find({
                            guild: message.guild.id,
                            roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                            xp: {$ne: null},
                        });
                        if(roleDocs.some(e => (e.xp === parseInt(args[3])))) return message.channel.send('There is another role being rewarded at this amount of xp');
                        let oldRole = roleDocs.find(e => (e.roleID === discordRole.id));
                        if(oldRole){
                            oldRole.xp = parseInt(args[3]);
                            await oldRole.save();
                        }
                        else{
                            if(roleDocs.length > 19) return message.channel.send('Maximum amount of xp roles is 20');
                            let newRole = new role({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                xp: parseInt(args[3]),
                            });
                            await newRole.save();
                        }
                        message.channel.send(`**${discordRole.name}** is now achieveable at **${parseInt(args[3])}** xp\nbe aware that members will only get this role when they send new messages`);
                        break;
                    case 'remove':
                        if(args[2] === 'all'){
                            await role.updateMany({
                                guild: message.guild.id,
                                xp: {$ne: null},
                            }, {$set: {xp: null}});
                            message.channel.send(`All xp roles were removed\nbe aware that these roles won't be automatically removed from members, if you want this, it's recommended that you delete the roles from the server so no member can have it`);
                        }
                        else{
                            let discordRole = message.guild.roles.cache.get((args[2].match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(e => (e.name === message.content.replace(/^(?:\S+\s+){3}/, ''))) || message.guild.roles.cache.find(e => (e.name.startsWith(message.content.replace(/^(?:\S+\s+){3}/, ''))));
                            if(!discordRole) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                            await role.findOneAndUpdate({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                xp: {$ne: null},
                            }, {$set: {xp: null}});
                            message.channel.send(`**${discordRole.name}** was removed from the xp rewards`);
                        }
                        break;
                    default:
                        message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        break;
                }
                break;
            case 'user':
                if(!['add', 'remove', 'set'].includes(args[1]) || isNaN(parseInt(args[3])) || !isFinite(parseInt(args[3])) || (parseInt(args[3]) < 0)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                let mention = args[2].match(/^(?:<@)?!?(\d{17,19})>?$/);
                if(!mention) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                let memberDoc = await member.findOne({
                    guild: message.guild.id,
                    userID: mention[1],
                });
                let discordMember = message.guild.members.cache.get(mention[1]) || await message.guild.members.fetch(mention[1]).catch(() => null);
                if(!memberDoc){
                    if(!discordMember) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                    memberDoc = new member({
                        guild: message.guild.id,
                        userID: discordMember.id,
                    });
                }
                switch(args[1]){
                    case 'add':
                        memberDoc.xp += parseInt(args[3]);
                        break;
                    case 'remove':
                        memberDoc.xp -= (parseInt(args[3]) > memberDoc.xp) ? memberDoc.xp : parseInt(args[3]);
                        break;
                    case 'set':
                        memberDoc.xp = parseInt(args[3]);
                        break;
                }
                await memberDoc.save();
                if(discordMember){
                    let roleDocs = await role.find({
                        guild: message.guild.id,
                        roleID: {$in: message.guild.roles.cache.filter(e => e.editable).map(e => e.id)},
                        xp: {$ne: null},
                    }).sort({xp: -1});
                    if(roleDocs.length) await discordMember.roles.set(discordMember.roles.cache.filter(e => !roleDocs.some(ee => (e.id === ee.roleID))).map(e => e.id).concat(roleDocs.filter(e => (e.xp <= memberDoc.xp)).slice(0, message.client.guildData.get(message.guild.id).dontStack ? 1 : undefined).map(e => e.roleID)));
                }
                message.channel.send(`<@${memberDoc.userID}> now has **${memberDoc.xp}** xp`);
                break;
            case 'ignore':
                if(!['role', 'channel'].includes(args[1]) || !['add', 'remove'].includes(args[2])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                if(args[1] === 'role'){
                    let discordRole = message.guild.roles.cache.get((args[3].match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(e => (e.name === message.content.replace(/^(?:\S+\s+){4}/, ''))) || message.guild.roles.cache.find(e => (e.name.startsWith(message.content.replace(/^(?:\S+\s+){4}/, ''))));
                    if(!discordRole) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                    await role.findOneAndUpdate({
                        guild: message.guild.id,
                        roleID: discordRole.id,
                    }, {$set: {ignoreXp: (args[2] === 'add')}}, {
                        upsert: true,
                        setDefaultsOnInsert: true,
                    });
                    message.channel.send(`The role **${discordRole.name}** ${(args[2] === 'add') ? 'will' : 'won\'t'} be ignored from earning xp`);
                }
                else{
                    let discordChannel = message.guild.channels.cache.get((args[3].match(/<#(\d{17,19})>/) || [])[1]) || message.guild.channels.cache.get(args[3]);
                    if(!discordChannel) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                    await channel.findByIdAndUpdate(discordChannel.id, {$set: {ignoreXp: (args[2] === 'add')}}, {
                        upsert: true,
                        setDefaultsOnInsert: true,
                    });
                    message.channel.send(`Users ${(args[2] === 'add') ? 'won\'t' : 'will'} be able to earn xp in ${discordChannel}`);
                }
                break;
            case 'notify':
                if(!args[1]) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                switch(args[1]){
                    case 'dm':
                    case 'default':
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: args[1]}});
                        message.client.guildData.get(message.guild.id).xpChannel = args[1];
                        message.channel.send(`New role notifications will be sent ${(args[1] === 'dm') ? 'on DMs' : 'in the channel where the achievement happened'}`);
                        break;
                    case 'none':
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: null}});
                        message.client.guildData.get(message.guild.id).xpChannel = null;
                        message.channel.send('No new role notifications will be sent');
                        break;
                    default:
                        let discordChannel = message.guild.channels.cache.get((args[1].match(/<#(\d{17,19})>/) || [])[1]) || message.client.channels.cache.get(args[1]);
                        if(!discordChannel) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: discordChannel.id}});
                        message.client.guildData.get(message.guild.id).xpChannel = discordChannel.id;
                        message.channel.send(`New role notifications will be sent in ${discordChannel}`);
                        break;
                }
                break;
            case 'view':
                if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
                let notifs;
                switch(message.client.guildData.get(message.guild.id).xpChannel){
                    case 'default':
                        notifs = '\`Same channel\`';
                        break;
                    case 'dm':
                        notifs = '\`DMs\`';
                        break;
                    default:
                        notifs = message.client.channels.cache.get(message.client.guildData.get(message.guild.id).xpChannel) || '\`None\`';
                        break;
                }
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 'RANDOM')
                    .setAuthor('Server xp system settings', message.guild.iconURL({
                        format: 'png',
                        size: 4096,
                    }))
                    .setDescription(`Enabled: \`${message.client.guildData.get(message.guild.id).gainExp ? 'on': 'off'}\`\nStacking: \`${message.client.guildData.get(message.guild.id).dontStack ? 'off': 'on'}\`\nNotifications: ${notifs}`)
                    .setTimestamp();
                let roles = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                }).sort({xp: -1});
                if(roles.filter(e => e.xp).length) embed.addField('Achieveable roles', roles.filter(e => e.xp).map(e => `<@&${e.roleID}> **-** \`${e.xp}\``).join('\n'));
                if(roles.filter(e => e.ignoreXp).length) embed.addField('Ignored roles', roles.filter(e => e.ignoreXp).map(e => `<@&${e.roleID}>`).join(' '));
                let channels = await channel.find({
                    _id: {$in: message.guild.channels.cache.map(e => e.id)},
                    guild: message.guild.id,
                    ignoreXp: true,
                });
                if(channels.length) embed.addField('Ignored channels', channels.map(e => `<#${e._id}>`).join(' '));
                message.channel.send(embed);
                break;
            case 'reset':
                let msg = message.channel.send('This will **__RESET ALL USERS XP__** to 0, are you sure you want to proceed?');
                await msg.react('✅');
                await msg.react('❌');
                let col = msg.createReactionCollector((r, u) => (['✅', '❌'].includes(r.emoji.name) && (u.id === message.author.id)), {
                    time: 10000,
                    max: 1,
                });
                col.on('end', async c => {
                    await msg.reactions.removeAll();
                    if(!c.size) return msg.edit('Operation timed out');
                    if(c.first().emoji.name === '❌') return msg.edit('Operation cancelled');
                    await member.updateMany({
                        guild: message.guild.id,
                        xp: {$ne: 0},
                    }, {xp: 0});
                    msg.edit('Server xp successfully reset');
                });
                break;
            default:
                message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                break;
        }
    },
};