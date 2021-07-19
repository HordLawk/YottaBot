const member = require('../../schemas/member.js');
const role = require('../../schemas/role.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'xp',
    description: lang => lang.get('xpDescription'),
    aliases: ['xp', 'exp', 'rank'],
    usage: lang => [lang.get('xpUsage0'), lang.get('xpUsage1'), lang.get('xpUsage2')],
    example: ['xp @LordHawk#0001', 'xp rank', 'xp roles'],
    cooldown: 10,
    categoryID: 4,
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(channelLanguage.get('botEmbed'));
        if(!message.client.guildData.get(message.guild.id).gainExp) return message.channel.send(channelLanguage.get('xpDisabled'));
        switch(args[0]){
            case 'rank': {
                let members = await message.guild.members.fetch().then(res => res.map(e => e.id));
                message.guild.members.cache.sweep(e => (e.id != message.client.user.id));
                let pageSize = 20;
                let memberDocs = await member.find({
                    guild: message.guild.id,
                    userID: {$in: members},
                    xp: {$ne: 0},
                }, 'userID xp').sort({xp: -1}).limit(pageSize);
                let memberDoc = await member.findOne({
                    guild: message.guild.id,
                    userID: message.author.id,
                    xp: {$gt: 0},
                });
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor(channelLanguage.get('xpRankEmbedAuthor'), message.guild.iconURL({dynamic: true}))
                    .setTimestamp()
                    .setDescription(memberDocs.map((e, i) => `${(e.userID === message.author.id) ? '__' : ''}**#${i + 1} -** <@${e.userID}> **|** \`${e.xp}xp\`${(e.userID === message.author.id) ? '__' : ''}`).join('\n'));
                if(memberDoc){
                    let rank = await member.countDocuments({
                        guild: message.guild.id,
                        xp: {$gt: memberDoc.xp},
                    });
                    embed.setFooter(channelLanguage.get('xpRankEmbedFooter', [rank + 1]));
                }
                let msg = await message.channel.send(embed);
                await msg.react('⬅');
                await msg.react('➡');
                let col = msg.createReactionCollector((r, u) => (['➡', '⬅'].includes(r.emoji.name) && (u.id === message.author.id)), {time: 600000});
                let page = 0;
                col.on('collect', async r => {
                    await r.users.remove(message.author);
                    if(r.emoji.name === '➡'){
                        memberDocs = await member.find({
                            guild: message.guild.id,
                            userID: {$in: members},
                            xp: {$ne: 0},
                        }, 'userID xp').sort({xp: -1}).skip((page + 1) * pageSize).limit(pageSize);
                        if(!memberDocs.length) return;
                        page++;
                    }
                    else{
                        if(!page) return;
                        memberDocs = await member.find({
                            guild: message.guild.id,
                            userID: {$in: members},
                            xp: {$ne: 0},
                        }, 'userID xp').sort({xp: -1}).skip((page - 1) * pageSize).limit(pageSize);
                        page--;
                    }
                    embed.setDescription(memberDocs.map((e, i) => `${(e.userID === message.author.id) ? '__' : ''}**#${page * pageSize + (i + 1)} -** <@${e.userID}> **|** \`${e.xp}xp\`${(e.userID === message.author.id) ? '__' : ''}`).join('\n'));
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
                if(!roles.length) return message.channel.send(channelLanguage.get('noXpRoles'));
                let embed = new MessageEmbed()
                    .setColor(message.guild.me.displayColor || 0x8000ff)
                    .setAuthor(channelLanguage.get('xpRolesEmbedAuthor'), message.guild.iconURL({dynamic: true}))
                    .setDescription(roles.map(e => `\`${(new Array(roles[0].xp.toString().length - e.xp.toString().length)).fill(' ').join('')}${e.xp}\` **-** <@&${e.roleID}>`).join('\n'));
                message.channel.send(embed);
            }
            break;
            default: {
                let id = args[0]?.match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
                let user = await member.findOne({
                    guild: message.guild.id,
                    userID: id || message.author.id,
                });
                if(!user) return message.channel.send(channelLanguage.get('noXp'));
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
                let discordUser = discordMember?.user ?? await message.client.users.fetch(id).catch(() => null);
                let embed = new MessageEmbed()
                    .setColor(discordMember?.displayColor ?? message.guild.me.displayColor ?? 0x8000ff)
                    .setAuthor(discordUser?.tag ?? channelLanguage.get('xpEmbedAuthor'), discordUser?.displayAvatarURL({dynamic: true}))
                    .setTimestamp()
                    .setDescription(channelLanguage.get('xpEmbedDescription', [current, next, user.xp]));
                if(user.xp){
                    let rank = await member.countDocuments({
                        guild: message.guild.id,
                        xp: {$gt: user.xp},
                    });
                    embed.setFooter(channelLanguage.get('xpEmbedFooter', [rank + 1]));
                }
                message.channel.send(embed);
            }
        }
    },
};