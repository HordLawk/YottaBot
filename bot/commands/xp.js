const member = require('../../schemas/member.js');
const role = require('../../schemas/role.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'xp',
    description: lang => 'Tells a member\'s xp in a server',
    aliases: ['xp', 'exp', 'rank'],
    usage: lang => ['[<(user)/rank>]'],
    example: ['xp @LordHawk#0572', 'xp rank'],
    cooldown: 5,
    categoryID: 0,
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
        if(!message.client.guildData.get(message.guild.id).gainExp) return message.chanenl.send('The xp system is disabled in this server');
        switch(args[0]){
            case 'lb':
            case 'rank': {
                    let members = await message.guild.members.fetch();
                    let memberDocs = await member.find({
                        guild: message.guild.id,
                        userID: {$in: members.map(e => e.id)},
                        xp: {$ne: 0},
                    }).sort({xp: -1});
                    let embed = new MessageEmbed()
                        .setColor(message.guild.me.displayColor || 0x8000ff)
                        .setAuthor('Xp ranking', message.guild.iconURL({dynamic: true}))
                        .setTimestamp()
                        .setDescription(memberDocs.slice(0, 20).map((e, i) => `**#${i + 1} -** ${message.guild.members.cache.get(e.userID).user.tag} **|** \`${e.xp}xp\``).join('\n'));
                    if(memberDocs.some(e => (e.userID === message.author.id))) embed.setFooter(`You are ranked at #${memberDocs.findIndex(e => (e.userID === message.author.id)) + 1}`);
                    let msg = await message.channel.send(embed);
                    await msg.react('⬅');
                    await msg.react('➡');
                    let col = msg.createReactionCollector((r, u) => (['➡', '⬅'].includes(r.emoji.name) && (u.id === message.author.id)), {time: 600000});
                    let page = 0;
                    col.on('collect', async r => {
                        await r.users.remove(message.author);
                        if(r.emoji.name === '➡'){
                            if(!memberDocs.slice((page + 1) * 20).length) return;
                            page++;
                        }
                        else{
                            if(!page) return;
                            page--;
                        }
                        embed.setDescription(memberDocs.slice(page * 20, (page + 1) * 20).map((e, i) => `**#${i + 1} -** ${message.guild.members.cache.get(e.userID).user.tag} **|** \`${e.xp}xp\``).join('\n'));
                        await msg.edit(embed);
                    });
                    col.on('end', () => msg.reactions.removeAll());
                }
                break;
            case 'roles': {
                    let roles = await role.find({
                        guild: message.guild.id,
                        roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                        xp: {
                            $exists: true,
                            $ne: null,
                        },
                    }).sort({xp: -1});
                    if(!roles.length) return message.channel.send('There are no xp roles in this server');
                    let embed = new MessageEmbed()
                        .setColor(message.guild.me.displayColor || 0x8000ff)
                        .setAuthor('Xp roles', message.guild.iconURL({dynamic: true}))
                        .setDescription(roles.map(e => `<@&${e.roleID}> **-** \`${e.xp}\``).join('\n'));
                    message.channel.send(embed);
                }
                break;
            default: {
                    let id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
                    if(!id) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
                    let user = await member.findOne({
                        guild: message.guild.id,
                        userID: args[0] || message.author.id,
                    });
                    if(!user) return message.channel.send('This member does not yet have any xp');
                    let roleDocs = await role.find({
                        guild: message.guild.id,
                        roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                        xp: {
                            $exists: true,
                            $ne: null,
                        },
                    }).sort({xp: -1});
                    let current = roleDocs.find(e => (e.xp <= user.xp));
                    let next = roleDocs.reverse().find(e => (e.xp > user.xp));
                    let discordMember = await message.guild.members.fetch(user.userID).catch(() => null);
                    let embed = new MessageEmbed()
                        .setColor((discordMember || message.guild.me).displayColor || 0x8000ff)
                        .setAuthor(discordMember?.user.tag || 'Xp', discordMember?.user.displayAvatarURL({dynamic: true}))
                        .setTimestamp()
                        .setDescription(`${current ? `Current level: <@&${current.roleID}>\n` : ''}${next ? `Next level: <@&${next.roleID}>\n` : ''}Progress: **${user.xp}${next ? `/${next.xp}` : ''}**`);
                    message.channel.send(embed);
                }
        }
    },
};