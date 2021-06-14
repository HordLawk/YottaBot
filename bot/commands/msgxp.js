const guild = require('../../schemas/guild.js');
const role = require('../../schemas/role.js');
const channel = require('../../schemas/channel.js');
const member = require('../../schemas/member.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'msgxp',
    description: lang => lang.get('msgexpDescription'),
    aliases: ['lvlup', 'msgexp', 'messagexp', 'messageexp'],
    usage: lang => [lang.get('msgexpUsage0'), lang.get('msgexpUsage1'), lang.get('msgexpUsage2'), lang.get('msgexpUsage3'), lang.get('msgexpUsage4'), lang.get('msgexpUsage5'), lang.get('msgexpUsage6'), lang.get('msgexpUsage7')],
    example: ['enable on', 'roles add @Active 1440', 'roles remove @Active', 'user add 100 @LordHawk#0572', 'ignore role remove @Mods', 'ignore channel add #spam', 'notify #levelup'],
    cooldown: 5,
    categoryID: 0,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        switch(args[0]){
            case 'enable': {
                if(!['on', 'off'].includes(args[1])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {gainExp: (args[1] === 'on')}});
                message.client.guildData.get(message.guild.id).gainExp = (args[1] === 'on');
                message.channel.send(message.client.langs[channelLanguage].get('xpEnable', [args[1]]));
            }
            break;
            case 'stack': {
                if(!['on', 'off'].includes(args[1])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                await guild.findByIdAndUpdate(message.guild.id, {$set: {dontStack: (args[1] === 'off')}});
                message.client.guildData.get(message.guild.id).dontStack = (args[1] === 'off');
                message.channel.send(message.client.langs[channelLanguage].get('xpStack', [args[1]]));
            }
            break;
            case 'roles': {
                if(!args[2]) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                switch(args[1]){
                    case 'set': {
                        if(isNaN(parseInt(args[3], 10)) || !isFinite(parseInt(args[3], 10)) || (parseInt(args[3], 10) < 1)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        let discordRole = message.guild.roles.cache.get((args[2].match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(e => (e.name === message.content.replace(/^(?:\S+\s+){3}/, '').replace(/\s+\S+\s+$/, ''))) || message.guild.roles.cache.find(e => (e.name.startsWith(message.content.replace(/^(?:\S+\s+){3}/, '').replace(/\s+\S+\s+$/, ''))));
                        if(!discordRole || (discordRole.id === message.guild.id)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        if(!discordRole.editable || discordRole.managed) return message.channel.send(message.client.langs[channelLanguage].get('manageRole'));
                        if(discordRole.position >= message.member.roles.highest.position) message.channel.send(message.client.langs[channelLanguage].get('memberManageRole'));
                        let roleDocs = await role.find({
                            guild: message.guild.id,
                            roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                            xp: {$ne: null},
                        });
                        if(roleDocs.some(e => (e.xp === parseInt(args[3], 10)))) return message.channel.send(message.client.langs[channelLanguage].get('sameXp'));
                        let oldRole = roleDocs.find(e => (e.roleID === discordRole.id));
                        if(oldRole){
                            oldRole.xp = parseInt(args[3], 10);
                            await oldRole.save();
                        }
                        else{
                            if(roleDocs.length > 19) return message.channel.send(message.client.langs[channelLanguage].get('maxXpRoles'));
                            let newRole = new role({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                xp: parseInt(args[3], 10),
                            });
                            await newRole.save();
                        }
                        message.channel.send(message.client.langs[channelLanguage].get('setXpRole', [discordRole.name, parseInt(args[3], 10)]));
                    }
                    break;
                    case 'remove': {
                        if(args[2] === 'all'){
                            await role.updateMany({
                                guild: message.guild.id,
                                xp: {$ne: null},
                            }, {$set: {xp: null}});
                            message.channel.send(message.client.langs[channelLanguage].get('resetXpRoles'));
                        }
                        else{
                            let discordRole = message.guild.roles.cache.get((args[2].match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(e => (e.name === message.content.replace(/^(?:\S+\s+){3}/, ''))) || message.guild.roles.cache.find(e => (e.name.startsWith(message.content.replace(/^(?:\S+\s+){3}/, ''))));
                            if(!discordRole) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                            await role.findOneAndUpdate({
                                guild: message.guild.id,
                                roleID: discordRole.id,
                                xp: {$ne: null},
                            }, {$set: {xp: null}});
                            message.channel.send(message.client.langs[channelLanguage].get('removeXpRole', [discordRole.name]));
                        }
                    }
                    break;
                    default: message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                }
            }
            break;
            case 'user': {
                if(!['add', 'remove', 'set'].includes(args[1]) || isNaN(parseInt(args[2], 10)) || !isFinite(parseInt(args[2], 10)) || (parseInt(args[2], 10) < 0)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                let mentions = args.slice(3, 13).join(' ').match(/\b\d{17,19}\b/g);
                if(!mentions) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                let memberDocs = await member.find({
                    guild: message.guild.id,
                    userID: {$in: mentions},
                });
                let members = await message.guild.members.fetch({user: mentions});
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
                    userID: {$in: memberDocs.filter(e => !members.some(ee => (e.userID === ee.id))).map(e => e.userID).concat(members.map(e => e.id))},
                }, query, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                });
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
                message.channel.send(message.client.langs[channelLanguage].get('setUserXp'));
            }
            break;
            case 'ignore': {
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
                    message.channel.send(message.client.langs[channelLanguage].get('xpIgnoreRole', [discordRole.name, args[2]]));
                }
                else{
                    let discordChannel = message.guild.channels.cache.get((args[3].match(/<#(\d{17,19})>/) || [])[1]) || message.guild.channels.cache.get(args[3]);
                    if(!discordChannel || !['text', 'news', 'voice'].includes(discordChannel.type)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                    await channel.findByIdAndUpdate(discordChannel.id, {$set: {ignoreXp: (args[2] === 'add')}}, {
                        upsert: true,
                        setDefaultsOnInsert: true,
                    });
                    message.channel.send(message.client.langs[channelLanguage].get('xpIgnoreChannel', [args[2], discordChannel]));
                }
            }
            break;
            case 'notify': {
                if(!args[1]) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                switch(args[1]){
                    case 'dm':
                    case 'default': {
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: args[1]}});
                        message.client.guildData.get(message.guild.id).xpChannel = args[1];
                        message.channel.send(message.client.langs[channelLanguage].get('notifyDefault', [args[1]]));
                    }
                    break;
                    case 'none': {
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: null}});
                        message.client.guildData.get(message.guild.id).xpChannel = null;
                        message.channel.send(message.client.langs[channelLanguage].get('notifyNone'));
                    }
                    break;
                    default: {
                        let discordChannel = message.guild.channels.cache.get((args[1].match(/<#(\d{17,19})>/) || [])[1]) || message.client.channels.cache.get(args[1]);
                        if(!discordChannel || !discordChannel.isText()) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                        if(!message.guild.me.permissionsIn(discordChannel).has('SEND_MESSAGES')) return message.channel.send(message.client.langs[channelLanguage].get('sendMessages'));
                        await guild.findByIdAndUpdate(message.guild.id, {$set: {xpChannel: discordChannel.id}});
                        message.client.guildData.get(message.guild.id).xpChannel = discordChannel.id;
                        message.channel.send(message.client.langs[channelLanguage].get('notifyChannel', [discordChannel]));
                    }
                }
            }
            break;
            case 'view': {
                if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
                let notifs;
                switch(message.client.guildData.get(message.guild.id).xpChannel){
                    case 'default': notifs = message.client.langs[channelLanguage].get('notifyDefaultView');
                    break;
                    case 'dm': notifs = message.client.langs[channelLanguage].get('notifyDMView');
                    break;
                    default: notifs = message.client.channels.cache.get(message.client.guildData.get(message.guild.id).xpChannel) || message.client.langs[channelLanguage].get('notifyNoneView');
                }
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor(message.client.langs[channelLanguage].get('xpViewEmbedAuthor'), message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }))
                    .setDescription(message.client.langs[channelLanguage].get('xpViewEmbedDesc', [message.client.guildData.get(message.guild.id).gainExp, message.client.guildData.get(message.guild.id).dontStack, notifs]))
                    .setTimestamp();
                let roles = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                }).sort({xp: -1});
                if(roles.filter(e => e.xp).length) embed.addField(message.client.langs[channelLanguage].get('xpViewRoles'), roles.filter(e => e.xp).map(e => `<@&${e.roleID}> **-** \`${e.xp}\``).join('\n'));
                if(roles.filter(e => e.ignoreXp).length) embed.addField(message.client.langs[channelLanguage].get('xpViewIgnoredRoles'), roles.filter(e => e.ignoreXp).map(e => `<@&${e.roleID}>`).join(' '));
                let channels = await channel.find({
                    _id: {$in: message.guild.channels.cache.map(e => e.id)},
                    guild: message.guild.id,
                    ignoreXp: true,
                });
                if(channels.length) embed.addField(message.client.langs[channelLanguage].get('xpViewIgnoredChannels'), channels.map(e => `<#${e._id}>`).join(' '));
                message.channel.send(embed);
            }
            break;
            case 'reset': {
                let msg = message.channel.send(message.client.langs[channelLanguage].get('resetXpConfirm'));
                await msg.react('✅');
                await msg.react('❌');
                let col = msg.createReactionCollector((r, u) => (['✅', '❌'].includes(r.emoji.name) && (u.id === message.author.id)), {
                    time: 10000,
                    max: 1,
                });
                col.on('end', async c => {
                    await msg.reactions.removeAll();
                    if(!c.size) return msg.edit(message.client.langs[channelLanguage].get('timedOut'));
                    if(c.first().emoji.name === '❌') return msg.edit(message.client.langs[channelLanguage].get('cancelled'));
                    await member.updateMany({
                        guild: message.guild.id,
                        xp: {$ne: 0},
                    }, {xp: 0});
                    msg.edit(message.client.langs[channelLanguage].get('resetXp'));
                });
            }
            break;
            default: message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        }
    },
};