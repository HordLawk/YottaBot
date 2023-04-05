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

const menu = require('../../schemas/menu.js');
const guild = require('../../schemas/guild.js');
const {EmbedBuilder, PermissionsBitField} = require('discord.js');
const {parse} = require('twemoji-parser');

module.exports = {
    active: true,
    name: 'rolemenu',
    description: lang => lang.get('rolemenuDescription'),
    aliases: ['rolesmenu'],
    usage: lang => [lang.get('rolemenuUsage0'), lang.get('rolemenuUsage1')],
    example: ['create #colors @Red 🔴 @Green 🟢 @Blue 🔵 toggle', 'edit 7 @Red 🔴 @Green 🟢 @Blue 🔵 @Yellow 🟡 toggle'],
    cooldown: 10,
    categoryID: 2,
    args: true,
    perm: PermissionsBitField.Flags.ManageRoles,
    guildOnly: true,
    execute: async function(message){
        const {channelLanguage} = message;
        const args = message.content.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g).slice(1);
        if((args.length < 4) || !['create', 'edit'].includes(args[0])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        var toggle;
        if(toggle = (args[args.length - 1] === 'toggle')) args.splice(-1, 1);
        if(args.length % 2) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        if(args.length > 42) return message.reply(channelLanguage.get('maxRolesMenu'));
        const guildEmojis = await message.guild.emojis.fetch();
        if(args[0] === 'create'){
            let discordChannel = message.guild.channels.cache.get((args[1].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
            if(!discordChannel || !discordChannel.isTextBased()) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.viewable) return message.reply(channelLanguage.get('sendMessages'));
            if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.AddReactions)) return message.reply(channelLanguage.get('botReactions'));
            if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
            let menus = await menu.find({
                guild: message.guild.id,
                channelID: {$in: [...message.guild.channels.cache.keys()]},
            });
            for(let menuDoc of menus) await message.guild.channels.cache.get(menuDoc.channelID).messages.fetch({message: menuDoc.messageID}).catch(() => null);
            if(
                (
                    menus.filter(e => message.guild.channels.cache.get(e.channelID).messages.cache.has(e.messageID))
                    >=
                    10
                )
                &&
                !message.client.guildData.get(message.guild.id).premiumUntil
                &&
                !message.client.guildData.get(message.guild.id).partner
            ) return await message.reply(channelLanguage.get('maxRolemenus'));
            let roles = args.slice(2).filter((e, i) => ((i % 2) === 0)).map(e => (message.guild.roles.cache.get(e.match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(ee => (ee.name.toLowerCase() === e.toLowerCase().replace(/"/g, ''))) ?? message.guild.roles.cache.find(ee => ee.name.toLowerCase().startsWith(e.toLowerCase().replace(/"/g, ''))) ?? message.guild.roles.cache.find(ee => ee.name.toLowerCase().includes(e.toLowerCase().replace(/"/g, '')))));
            if(roles.some(e => (!e || (e.id === message.guild.id)))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(roles.some(e => (!e.editable || e.managed))) return message.reply(channelLanguage.get('manageRole'));
            if(roles.some(e => (e.position >= message.member.roles.highest.position))) return message.reply(channelLanguage.get('memberManageRole'));
            const emojis = args
                .slice(2)
                .filter((_, i) => (i % 2))
                .map(e => {
                    return (
                        guildEmojis.get(e.match(/^(?:<a?:\w+:)?(\d{17,19})>?$/)?.[1])
                        ??
                        guildEmojis.find(ee => (ee.name.toLowerCase() === e.toLowerCase()))
                        ??
                        guildEmojis.find(ee => ee.name.toLowerCase().startsWith(e.toLowerCase()))
                        ??
                        guildEmojis.find(ee => ee.name.toLowerCase().includes(e.toLowerCase()))
                        ??
                        parse(e)[0]?.text
                    );
                });
            if(emojis.some(e => (!e || (e.id && (!e.available || e.managed))))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(emojis.some(e => (emojis.filter(ee => ((ee.id || ee) === (e.id || e))).length > 1))) return message.reply(channelLanguage.get('uniqueEmoji'));
            let loadmsg = await message.reply(channelLanguage.get('loading'));
            await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterMenus: 1}});
            let newMenu = new menu({
                id: ++message.client.guildData.get(message.guild.id).counterMenus,
                guild: message.guild.id,
                channelID: discordChannel.id,
                toggle: toggle,
                emojis: emojis.map((e, i) => ({
                    _id: (e.identifier || encodeURIComponent(e)),
                    roleID: roles[i].id,
                })),
            });
            let embed = new EmbedBuilder()
                .setColor(message.guild.members.me.displayColor || 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('rolemenuEmbedAuthor'),
                    iconURL: message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(roles.map((e, i) => `${emojis[i]} - ${e}`).join('\n'))
                .setFooter({text: `ID: ${newMenu.id}`})
                .setTimestamp();
            let msg = await discordChannel.send({embeds: [embed]});
            newMenu.messageID = msg.id;
            await newMenu.save();
            for(let emoji of emojis) await msg.react(emoji);
            await loadmsg.edit(channelLanguage.get('rolemenuCreated'));
        }
        else{
            if(isNaN(parseInt(args[1], 10)) || !isFinite(parseInt(args[1], 10))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            let menuDoc = await menu.findOne({
                id: parseInt(args[1], 10),
                guild: message.guild.id,
                channelID: {$in: [...message.guild.channels.cache.keys()]},
            });
            if(!menuDoc) return message.reply(channelLanguage.get('menu404'));
            let msg = await message.guild.channels.cache.get(menuDoc.channelID).messages.fetch({message: menuDoc.messageID}).catch(() => null);
            if(!msg) return message.reply(channelLanguage.get('menu404'));
            let discordChannel = message.guild.channels.cache.get(menuDoc.channelID);
            if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.SendMessages)) return message.reply(channelLanguage.get('sendMessages'));
            if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.AddReactions)) return message.reply(channelLanguage.get('botReactions'));
            if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
            if(!message.guild.members.me.permissionsIn(discordChannel).has(PermissionsBitField.Flags.ManageMessages)) return message.reply(channelLanguage.get('botManageMessages'));
            let roles = args.slice(2).filter((e, i) => ((i % 2) === 0)).map(e => (message.guild.roles.cache.get(e.match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(ee => (ee.name.toLowerCase() === e.toLowerCase().replace(/"/g, ''))) ?? message.guild.roles.cache.find(ee => (ee.name.toLowerCase().startsWith(e.toLowerCase().replace(/"/g, '')))) ?? message.guild.roles.cache.find(ee => (ee.name.toLowerCase().includes(e.toLowerCase().replace(/"/g, ''))))));
            if(roles.some(e => (!e || (e.id === message.guild.id)))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(roles.some(e => (!e.editable || e.managed))) return message.reply(channelLanguage.get('manageRole'));
            if(roles.some(e => (e.position >= message.member.roles.highest.position))) return message.reply(channelLanguage.get('memberManageRole'));
            const emojis = args
                .slice(2)
                .filter((_, i) => (i % 2))
                .map(e => {
                    return (
                        guildEmojis.get(e.match(/^(?:<a?:\w+:)?(\d{17,19})>?$/)?.[1])
                        ??
                        guildEmojis.find(ee => (ee.name.toLowerCase() === e.toLowerCase()))
                        ??
                        guildEmojis.find(ee => ee.name.toLowerCase().startsWith(e.toLowerCase()))
                        ??
                        guildEmojis.find(ee => ee.name.toLowerCase().includes(e.toLowerCase()))
                        ??
                        parse(e)[0]?.text
                    );
                });
            if(emojis.some(e => (!e || (e.id && (!e.available || e.managed))))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(emojis.some(e => (emojis.filter(ee => ((ee.id || ee) === (e.id || e))).length > 1))) return message.reply(channelLanguage.get('uniqueEmoji'));
            let loadmsg = await message.reply(channelLanguage.get('loading'));
            menuDoc.toggle = toggle;
            menuDoc.emojis = emojis.map((e, i) => ({
                _id: (e.identifier || encodeURIComponent(e)),
                roleID: roles[i].id,
            }));
            let embed = new EmbedBuilder()
                .setColor(message.guild.members.me.displayColor || 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('rolemenuEmbedAuthor'),
                    iconURL: message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(roles.map((e, i) => `${emojis[i]} - ${e}`).join('\n'))
                .setFooter({text: `ID: ${menuDoc.id}`})
                .setTimestamp();
            await msg.reactions.removeAll();
            await msg.edit({embeds: [embed]});
            for(let emoji of emojis) await msg.react(emoji);
            await menuDoc.save();
            await loadmsg.edit(channelLanguage.get('rolemenuEdited'));
        }
    },
};