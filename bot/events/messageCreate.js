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

const guild = require('../../schemas/guild.js');
const role = require('../../schemas/role.js');
const channel = require('../../schemas/channel.js');
const member = require('../../schemas/member.js');
const user = require('../../schemas/user.js');
const {Collection, PermissionsBitField, EmbedBuilder, ApplicationCommandType, MessageType} = require('discord.js');
const locale = require('../../locale');
const configs = require('../configs.js');
const commands = require('../commands');
const { slashCommandUsages, handleEventError } = require('../utils.js');

module.exports = {
    name: 'messageCreate',
    execute: async function(message){
        if(message.partial) await message.fetch();
        if(message.author.bot || ![MessageType.Default, MessageType.Reply].includes(message.type) || (message.guild && !message.guild.available)) return;
        var prefix = configs.defaultPrefix;
        var roleDocs;
        var savedChannel;
        if(message.channel.partial) await message.channel.fetch();
        let guildData;
        if(message.guild){
            if(!message.client.guildData.has(message.guild.id)){
                let guildDoc = await guild.findById(message.guild.id);
                if(!guildDoc){
                    guildDoc = new guild({
                        _id: message.guild.id,
                        language: (message.guild.preferredLocale === 'pt-BR') ? 'pt' : 'en',
                    });
                    await guildDoc.save();
                }
                message.client.guildData.set(message.guild.id, guildDoc);
            }
            guildData = message.client.guildData.get(message.guild.id);
            prefix = guildData.prefix;
            if(!message.member) message.member = await message.guild.members.fetch(message.author.id).catch(() => null);
            roleDocs = await role.find({
                guild: message.guild.id,
                roleID: {$in: message.guild.roles.cache.map(e => e.id)},
            });
            savedChannel = await channel.findById(message.channel.id);
            if(!message.member) return;
        }
        const channelLanguage = locale.get(message.guild ? guildData.language : 'en');
        if(
            message.guild
            &&
            guildData.gainExp
            &&
            (
                !message.client.xpcds.has(message.guild.id)
                ||
                !message.client.xpcds.get(message.guild.id).has(message.author.id)
                ||
                ((message.client.xpcds.get(message.guild.id).get(message.author.id) + 60000) <= Date.now())
            )
            &&
            !roleDocs.some(e => (e.ignoreXp && message.member.roles.cache.has(e.roleID)))
            &&
            (!savedChannel || !savedChannel.ignoreXp)
        ){
            const multiplier = roleDocs.filter(e => (e.xpMultiplier && message.member.roles.cache.has(e.roleID))).sort((a, b) => (b.xpMultiplier - a.xpMultiplier))[0]?.xpMultiplier ?? 1;
            member.findOneAndUpdate({
                guild: message.guild.id,
                userID: message.author.id,
            }, {$inc: {xp: multiplier}}, {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }, (err, doc) => (async (err, doc) => {
                if(err) throw err;
                if(message.client.xpcds.has(message.guild.id)){
                    message.client.xpcds.get(message.guild.id).set(message.author.id, Date.now());
                }
                else{
                    message.client.xpcds.set(message.guild.id, new Collection([[message.author.id, Date.now()]]));
                }
                if(!message.member) return;
                const lowerRoles = roleDocs.filter(e => (e.xp && (e.xp <= doc.xp))).sort((a, b) => (b.xp - a.xp));
                if(
                    !lowerRoles.length
                    ||
                    message.member.roles.cache.has(lowerRoles[0].roleID)
                    ||
                    !message.guild.roles.cache.get(lowerRoles[0].roleID).editable
                    ||
                    ((lowerRoles.length > configs.xpRolesLimit) && !guildData.premiumUntil && !guildData.partner)
                ) return;
                await message.member.roles.set(
                    message.member.roles.cache
                        .map(e => e.id)
                        .filter(e => !lowerRoles.some(ee => (e === ee.roleID)))
                        .concat(
                            lowerRoles
                                .map(e => e.roleID)
                                .filter(e => message.guild.roles.cache.get(e).editable)
                                .slice(0, guildData.dontStack ? 1 : undefined),
                        ),
                );
                if((guildData.xpChannel === 'none') || (doc.xp >= (lowerRoles[0].xp + multiplier))) return;
                switch(guildData.xpChannel){
                    case 'default': {
                        if(message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.SendMessages)) await message.reply({
                            content: channelLanguage.get('achieveGuild', [message.author, message.guild.roles.cache.get(lowerRoles[0].roleID)]),
                            allowedMentions: {repliedUser: true},
                        });
                    }
                    break;
                    case 'dm': {
                        await message.author.send(channelLanguage.get('achieveDM', [message.guild.roles.cache.get(lowerRoles[0].roleID).name, message.guild.name])).catch(() => null);
                    }
                    break;
                    default: {
                        const notifChannel = message.guild.channels.cache.get(guildData.xpChannel);
                        if(
                            notifChannel
                            &&
                            notifChannel.viewable
                            &&
                            message.guild.members.me
                                .permissionsIn(notifChannel)
                                .has(PermissionsBitField.Flags.SendMessages)
                        ){
                            await notifChannel.send({
                                content: channelLanguage.get(
                                    'achieveGuild',
                                    [message.author, message.guild.roles.cache.get(lowerRoles[0].roleID)],
                                ),
                                allowedMentions: {users: [message.author.id]},
                            });
                        }
                    }
                }
            })(err, doc).catch(async err => await handleEventError(err, this, [message], message.client)));
        }
        if(message.guild && !message.guild.members.me.permissionsIn(message.channel.id)?.has(PermissionsBitField.Flags.SendMessages)) return;
        const commandsManager = (
            (process.env.NODE_ENV === 'production')
            ? message.client.application
            : message.client.guilds.cache.get(process.env.DEV_GUILD)
        ).commands.cache;
        if((new RegExp(`<@!?${message.client.user.id}>`)).test(message.content)){
            return await message.reply(
                channelLanguage.get('mentionHelp', [commandsManager.find(cmd => (cmd.name === 'help')).id]),
            );
        }
        if(!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;
        const userDoc = await user.findById(message.author.id);
        if(userDoc && userDoc.blacklisted) return;
        const [commandName, ...args] = message.content.slice(prefix.length).toLowerCase().split(/\s+/g);
        const command = commands.get(commandName) || commands.find(cmd => (cmd.aliases && cmd.aliases.includes(commandName)));
        if(
            !command
            ||
            (command.dev && (message.author.id !== message.client.application.owner.id))
            ||
            (command.alpha && !guildData.alpha)
            ||
            (
                !command.execute
                &&
                (commandsManager.find(e => (e.name === command.name))?.type !== ApplicationCommandType.ChatInput)
            )
        ) return;
        if(!command.execute) return message.reply(channelLanguage.get('slashOnly', [command.name]));
        if(configs.maintenance && (message.author.id !== message.client.application.owner.id)) return message.reply(channelLanguage.get('maintenance'));
        if(command.guildOnly && !message.guild) return message.reply(channelLanguage.get('guildOnly'));
        if(
            command.premium
            &&
            !guildData.premiumUntil
            &&
            !guildData.partner
        ) return await message.reply(channelLanguage.get('premiumCommand'));
        if(command.beta && !guildData.beta) return message.reply(channelLanguage.get('betaCommand'));
        if(command.args && !args.length){
            return await message.reply(
                channelLanguage.get(
                    'noArgs',
                    [
                        message.author,
                        (
                            slashCommandUsages(command.name, message.client)
                            ??
                            command.usage(channelLanguage).map(e => `\`${prefix}${command.name} ${e}\``).join('\n')
                        ),
                    ],
                ),
            );
        }
        if(message.guild && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)){
            const roles = roleDocs.filter(e => (e.commandPermissions.id(command.name) && message.member.roles.cache.has(e.roleID)));
            if((!roles.length && command.perm && !message.member.permissions.has(command.perm)) || (roles.length && roles.some(e => !e.commandPermissions.id(command.name).allow) && !roles.some(e => e.commandPermissions.id(command.name).allow))) return message.reply(channelLanguage.get('forbidden'));
            if(savedChannel && savedChannel.ignoreCommands.includes(command.name) && message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.AddReactions)) return await message.react('🚫');
        }
        if(!message.client.cooldowns.has(command.name)) message.client.cooldowns.set(command.name, new Collection());
        const now = Date.now();
        const timestamps = message.client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown / (1 + (!!message.client.guildData.get(message.guild?.id)?.premiumUntil || !!message.client.guildData.get(message.guild?.id)?.partner))) * 1000;
        if(timestamps.has(message.author.id) && (message.author.id !== message.client.application.owner.id)){
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if(now < expirationTime){
                const timeLeft = (expirationTime - now) / 1000;
                return await message.reply(
                    channelLanguage.get(
                        'cooldown',
                        [timeLeft.toFixed(1), command.name, (guildData.premiumUntil || guildData.partner)],
                    ),
                );
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        if(message.inGuild()){
            member.findOneAndUpdate({
                guild: message.guild.id,
                userID: message.author.id,
                "commandUses._id": command.name,
            }, {$inc: {"commandUses.$.count": 1}}, {new: true}).then(async (doc, err) => {
                if(err) throw err;
                if(doc) return;
                await member.findOneAndUpdate({
                    guild: message.guild.id,
                    userID: message.author.id,
                }, {$addToSet: {commandUses: {
                    _id: command.name,
                    count: 1,
                }}}, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                });
            }).catch(async err => await handleEventError(err, this, [message], message.client));
        }
        message.channel.sendTyping();
        message.channelLanguage = channelLanguage;
        command.execute(message, args).then(async () => {
            if(Math.floor(Math.random() * 1000) || (message.guild && (guildData.premiumUntil || guildData.partner))){
                return;
            }
            const embed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setDescription(channelLanguage.get(`premiumAd${Math.floor(Math.random() * 3)}`, [command.name]));
            await message.channel.send({embeds: [embed]});
        }).catch(async error => {
            console.error(error);
            if(process.env.NODE_ENV === 'production'){
                await message.client.shard.broadcastEval(async (c, {channelId, content, msgContent, stack}) => {
                    const channel = c.channels.cache.get(channelId);
                    if(channel) await channel.send({
                        content,
                        files: [
                            {
                                name: 'content.txt',
                                attachment: Buffer.from(msgContent),
                            },
                            {
                                name: 'stack.log',
                                attachment: Buffer.from(stack),
                            },
                        ],
                    }).catch(console.error);
                }, {context: {
                    channelId: configs.errorlog,
                    content: (
                        `Error: *${error.message}*\n` +
                        `Message Author: ${message.author}\n` +
                        `Message URL: ${message.url}\n`
                    ),
                    msgContent: message.content,
                    stack: error.stack,
                }});
            }
            await message.reply(channelLanguage.get('error', [command.name]));
        });
    },
};