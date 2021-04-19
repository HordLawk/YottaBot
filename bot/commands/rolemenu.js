const menu = require('../../schemas/menu.js');
const guild = require('../../schemas/guild.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'rolemenu',
    description: lang => 'Creates a message where users can react to claim one or more roles',
    aliases: ['rolesmenu'],
    usage: lang => ['create (channel) <(role mention)/(role ID)/"(role name)"> (emoji) [(list of roles and emojis)] [toggle]', 'edit (menu ID) <(role mention)/(role ID)/"(role name)"> (emoji) [(list of roles and emojis)] [toggle]'],
    example: ['create #colors @Red 🔴 @Green 🟢 @Blue 🔵 toggle', 'edit 7 @Red 🔴 @Green 🟢 @Blue 🔵 @Yellow 🟡 toggle'],
    cooldown: 10,
    categoryID: 0,
    args: true,
    perm: 'MANAGE_ROLES',
    guildOnly: true,
    execute: async function(message){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        const args = message.content.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g).slice(1);
        if((args.length < 4) || !['create', 'edit'].includes(args[0])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        var toggle;
        if(toggle = (args[args.length - 1] === 'toggle')) args.splice(-1, 1);
        if((args.length % 2) != 0) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        if(args.length > 42) return message.channel.send('The maximum amount of roles per menu is 40');
        if(args[0] === 'create'){
            let discordChannel = message.guild.channels.cache.get((args[1].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
            if(!discordChannel) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
            if(!message.guild.me.permissionsIn(discordChannel).has('SEND_MESSAGES')) return message.channel.send(message.client.langs[chanenlLanguage].get('sendMessages'));
            if(!message.guild.me.permissionsIn(discordChannel).has('ADD_REACTIONS')) return message.channel.send('I need permission to add reactions in this channel');
            if(!message.guild.me.permissionsIn(discordChannel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
            let menus = await menu.find({
                guild: message.guild.id,
                channelID: {$in: message.client.channels.cache.map(e => e.id)},
            });
            for(let menuDoc of menus) await message.client.channels.cache.get(menuDoc.channelID).messages.fetch(menuDoc.messageID).catch(() => null);
            if(menus.filter(e => message.client.channels.cache.get(e.channelID).messages.cache.has(e.messageID)) >= 20) return message.channel.send('The maximum amount of menus per server is 20');
            let roles = args.slice(2).filter((e, i) => ((i % 2) === 0)).map(e => (message.guild.roles.cache.get((e.match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(ee => (ee.name === e.replace(/"/g, ''))) || message.guild.roles.cache.find(ee => (ee.name.startsWith(e.replace(/"/g, ''))))));
            if(roles.some(e => (!e || (e.id === message.guild.id)))) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
            if(roles.some(e => (!e.editable || e.managed))) return message.channel.send(message.client.langs[channelLanguage].get('manageRole'));
            if(roles.some(e => (e.position >= message.member.roles.highest.position))) return message.channel.send(sage.client.langs[channelLanguage].get('memberManageRole'));
            let emojis = args.slice(2).filter((e, i) => ((i % 2) != 0)).map(e => (message.guild.emojis.cache.get((e.match(/^(?:<:\w+:)?(\d{17,19})>?$/) || [])[1]) || message.guild.emojis.cache.find(ee => ((ee.name === e) || ee.name.startsWith(e))) || (e.match(/\p{Extended_Pictographic}/ug) || [])[0]));
            if(emojis.some(e => (!e || (e.id && (!e.available || e.managed))))) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
            if(emojis.some(e => (emojis.filter(ee => ((ee.id || ee) === (e.id || e))).length > 1))) return message.channel.send('Each emoji can only be used once per menu');
            let loadmsg = await message.channel.send('Loading...');
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
            let embed = new MessageEmbed()
                .setColor(message.guild.me.displayColor || 0x8000ff)
                .setAuthor('React to claim a role', message.guild.iconURL({
                    format: 'png',
                    size: 4096,
                }))
                .setDescription(roles.map((e, i) => `${emojis[i]} - ${e}`))
                .setFooter(`ID: ${newMenu.id}`)
                .setTimestamp();
            let msg = await discordChannel.send(embed);
            newMenu.messageID = msg.id;
            await newMenu.save();
            for(let emoji of emojis) await msg.react(emoji);
            loadmsg.edit('Rolemenu successfully created');
        }
        else{
            let menuDoc = await menu.findOne({
                id: parseInt(args[1]),
                guild: message.guild.id,
                channelID: {$in: message.client.channels.cache.map(e => e.id)},
            });
            if(!menuDoc) return message.channel.send('Menu not found');
            let msg = await message.client.channels.cache.get(menuDoc.channelID).messages.fetch(menuDoc.messageID).catch(() => null);
            if(!msg) return message.channel.send('Menu not found');
            let discordChannel = message.client.channels.cache.get(menuDoc.channelID);
            if(!message.guild.me.permissionsIn(discordChannel).has('SEND_MESSAGES')) return message.channel.send(message.client.langs[chanenlLanguage].get('sendMessages'));
            if(!message.guild.me.permissionsIn(discordChannel).has('ADD_REACTIONS')) return message.channel.send('I need permission to add reactions in this channel');
            if(!message.guild.me.permissionsIn(discordChannel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
            if(!message.guild.me.permissionsIn(discordChannel).has('MANAGE_MESSAGES')) return message.channel.send(message.client.langs[channelLanguage].get('botManageMessages'));
            let roles = args.slice(2).filter((e, i) => ((i % 2) === 0)).map(e => (message.guild.roles.cache.get((e.match(/^(?:<@&)?(\d{17,19})>?$/) || [])[1]) || message.guild.roles.cache.find(ee => (ee.name === e.replace(/"/g, ''))) || message.guild.roles.cache.find(ee => (ee.name.startsWith(e.replace(/"/g, ''))))));
            if(roles.some(e => (!e || (e.id === message.guild.id)))) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
            if(roles.some(e => (!e.editable || e.managed))) return message.channel.send(message.client.langs[channelLanguage].get('manageRole'));
            if(roles.some(e => (e.position >= message.member.roles.highest.position))) return message.channel.send(sage.client.langs[channelLanguage].get('memberManageRole'));
            let emojis = args.slice(2).filter((e, i) => ((i % 2) != 0)).map(e => (message.guild.emojis.cache.get((e.match(/^(?:<:\w+:)?(\d{17,19})>?$/) || [])[1]) || message.guild.emojis.cache.find(ee => ((ee.name === e) || ee.name.startsWith(e))) || (e.match(/\p{Extended_Pictographic}/ug) || [])[0]));
            if(emojis.some(e => (!e || (e.id && (!e.available || e.managed))))) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
            if(emojis.some(e => (emojis.filter(ee => ((ee.id || ee) === (e.id || e))).length > 1))) return message.channel.send('Each emoji can only be used once per menu');
            let loadmsg = await message.channel.send('Loading...');
            menuDoc.toggle = toggle;
            menuDoc.emojis = emojis.map((e, i) => ({
                _id: (e.identifier || encodeURIComponent(e)),
                roleID: roles[i].id,
            }));
            let embed = new MessageEmbed()
                .setColor(message.guild.me.displayColor || 0x8000ff)
                .setAuthor('React to claim a role', message.guild.iconURL({
                    format: 'png',
                    size: 4096,
                }))
                .setDescription(roles.map((e, i) => `${emojis[i]} - ${e}`))
                .setFooter(`ID: ${menuDoc.id}`)
                .setTimestamp();
            await msg.reactions.removeAll();
            await msg.edit(embed);
            for(let emoji of emojis) await msg.react(emoji);
            await menuDoc.save();
            loadmsg.edit('Rolemenu successfully edited');
        }
    },
};