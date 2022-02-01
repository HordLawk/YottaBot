const guild = require('../../schemas/guild.js');
const role = require('../../schemas/role.js');
const channel = require('../../schemas/channel.js');
const member = require('../../schemas/member.js');
const user = require('../../schemas/user.js');
const {Collection, Permissions} = require('discord.js');

module.exports = {
    name: 'messageCreate',
    execute: async message => {
        if(message.author.bot || (message.type != 'DEFAULT') || (message.guild && !message.guild.available)) return;
        var prefix = message.client.configs.defaultPrefix;
        var roleDocs;
        var savedChannel;
        if(message.channel.partial) await message.channel.fetch();
        if(message.guild){
            if(!message.client.guildData.has(message.guild.id)){
                let guildData = new guild({
                    _id: message.guild.id,
                    language: (message.guild.preferredLocale === 'pt-BR') ? 'pt' : 'en',
                });
                guildData.save();
                message.client.guildData.set(guildData._id, guildData);
            }
            prefix = message.client.guildData.get(message.guild.id).prefix;
            if(!message.member) message.member = await message.guild.members.fetch(message.author.id).catch(() => null);
            roleDocs = await role.find({
                guild: message.guild.id,
                roleID: {$in: message.guild.roles.cache.map(e => e.id)},
            });
            savedChannel = await channel.findById(message.channel.id);
            if(!message.member) return;
        }
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(message.guild && message.client.guildData.get(message.guild.id).gainExp && (!message.client.xpcds.has(message.guild.id) || !message.client.xpcds.get(message.guild.id).has(message.author.id) || ((message.client.xpcds.get(message.guild.id).get(message.author.id) + 60000) <= Date.now())) && !roleDocs.some(e => (e.ignoreXp && message.member.roles.cache.has(e.roleID))) && (!savedChannel || !savedChannel.ignoreXp)){
            member.findOneAndUpdate({
                guild: message.guild.id,
                userID: message.author.id,
            }, {$inc: {xp: roleDocs.filter(e => e.xpMultiplier).sort((a, b) => (b.xpMultiplier - a.xpMultiplier))[0]?.xpMultiplier ?? 1}}, {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }, async (err, doc) => {
                if(err) throw err;
                if(message.client.xpcds.has(message.guild.id)){
                    message.client.xpcds.get(message.guild.id).set(message.author.id, Date.now());
                }
                else{
                    message.client.xpcds.set(message.guild.id, new Collection([[message.author.id, Date.now()]]));
                }
                const lowerRoles = roleDocs.filter(e => (message.guild.roles.cache.get(e.roleID).editable && e.xp && (e.xp <= doc.xp))).sort((a, b) => (b.xp - a.xp));
                if(!lowerRoles.length || message.member.roles.cache.has(lowerRoles[0].roleID)) return;
                await message.member.roles.set(message.member.roles.cache.map(e => e.id).filter(e => !lowerRoles.some(ee => (e === ee.roleID))).concat(lowerRoles.map(e => e.roleID).slice(0, message.client.guildData.get(message.guild.id).dontStack ? 1 : undefined)));
                if(!message.client.guildData.get(message.guild.id).xpChannel || (doc.xp != lowerRoles[0].xp)) return;
                switch(message.client.guildData.get(message.guild.id).xpChannel){
                    case 'default': {
                        if(message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.SEND_MESSAGES)) message.reply({
                            content: channelLanguage.get('achieveGuild', [message.author, message.guild.roles.cache.get(lowerRoles[0].roleID).name]),
                            allowedMentions: {repliedUser: true},
                        });
                    }
                    break;
                    case 'dm': {
                        message.author.send(channelLanguage.get('achieveDM', [message.guild.roles.cache.get(lowerRoles[0].roleID).name, message.guild.name])).catch(() => null);
                    }
                    break;
                    default: {
                        const notifChannel = message.client.channels.cache.get(message.client.guildData.get(message.guild.id).xpChannel);
                        if(notifChannel && message.guild.me.permissionsIn(notifChannel).has(Permissions.FLAGS.SEND_MESSAGES)) notifChannel.send({
                            content: channelLanguage.get('achieveGuild', [message.author, message.guild.roles.cache.get(lowerRoles[0].roleID).name]),
                            allowedMentions: {users: [message.author.id]},
                        });
                    }
                }
            });
        }
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.SEND_MESSAGES)) return;
        if((new RegExp(`<@!?${message.client.user.id}>`)).test(message.content)) return message.reply(channelLanguage.get('mentionHelp', [prefix]));
        if(!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;
        const userDoc = await user.findById(message.author.id);
        if(userDoc && userDoc.blacklisted) return;
        const [commandName, ...args] = message.content.slice(prefix.length).toLowerCase().split(/\s+/g);
        const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => (cmd.aliases && cmd.aliases.includes(commandName)));
        if(!command || (command.dev && (message.author.id != message.client.application.owner.id)) || (command.alpha && !message.client.guildData.get(message.guild.id).alpha)) return;
        if(!command.execute) return message.reply(channelLanguage.get('slashOnly', [command.name]));
        if(message.client.configs.maintenance && (message.author.id != message.client.application.owner.id)) return message.reply(channelLanguage.get('maintenance'));
        if(command.guildOnly && !message.guild) return message.reply(channelLanguage.get('guildOnly'));
        if(command.premium && !message.client.guildData.get(message.guild.id).premiumUntil && !message.client.guildData.get(message.guild.id).partner) return message.reply(channelLanguage.get('premiumCommand', [prefix]));
        if(command.beta && !message.client.guildData.get(message.guild.id).beta) return message.reply(channelLanguage.get('betaCommand'));
        if(command.args && !args.length) return message.reply(channelLanguage.get('noArgs', [message.author, prefix, command.name, command.usage(channelLanguage)]));
        if(message.guild && !message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)){
            const roles = roleDocs.filter(e => (e.commandPermissions.id(command.name) && message.member.roles.cache.has(e.roleID)));
            if((!roles.length && command.perm && !message.member.permissions.has(command.perm)) || (roles.length && roles.some(e => !e.commandPermissions.id(command.name).allow) && !roles.some(e => e.commandPermissions.id(command.name).allow))) return message.reply(channelLanguage.get('forbidden'));
            if(savedChannel && savedChannel.ignoreCommands.includes(command.name) && message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.ADD_REACTIONS)) return await message.react('🚫');
        }
        if(!message.client.cooldowns.has(command.name)) message.client.cooldowns.set(command.name, new Collection());
        const now = Date.now();
        const timestamps = message.client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown / (1 + (!!message.client.guildData.get(message.guild?.id)?.premiumUntil || !!message.client.guildData.get(message.guild?.id)?.partner))) * 1000;
        if(timestamps.has(message.author.id) && (message.author.id != message.client.application.owner.id)){
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if(now < expirationTime){
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(channelLanguage.get('cooldown', [timeLeft.toFixed(1), command.name, prefix, (message.client.guildData.get(message.guild.id).premiumUntil || message.client.guildData.get(message.guild.id).partner)]));
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        message.channel.sendTyping();
        command.execute(message, args).catch(error => {
            console.error(error);
            message.reply(channelLanguage.get('error', [command.name]));
            if(process.env.NODE_ENV === 'production') message.client.channels.cache.get(message.client.configs.errorlog).send({
                content: `Error: *${error.message}*\nMessage Author: ${message.author}\nMessage URL: ${message.url}`,
                files: [
                    {
                        name: 'content.txt',
                        attachment: Buffer.from(message.content),
                    },
                    {
                        name: 'stack.log',
                        attachment: Buffer.from(error.stack),
                    },
                ],
            }).catch(console.error);
        });
    },
};