const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'massban',
    description: lang => lang.get('massbanDescription'),
    aliases: ['mb'],
    usage: lang => [lang.get('massbanUsage')],
    example: ['@LordHawk#0572 @Kamikat#7358 annoying raiders'],
    cooldown: 10,
    categoryID: 3,
    args: true,
    perm: 'ADMINISTRATOR',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const ids = args.map(e => e.match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1]);
        const reasonStart = ids.findIndex(e => !e);
        if(!reasonStart) return message.channel.send(message.client.langs[channelLanguage].get('invUser'));
        const reason = message.content.replace(new RegExp(`^(?:\\S+\\s+){${(reasonStart === -1) ? args.length : reasonStart}}\\S+\\s*`), '').slice(0, 500);
        var bans = 0;
        var invargs = 0;
        var invusers = 0;
        var banneds = 0;
        const caseLogs = [];
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        for(let id of ids.slice(0, reasonStart)){
            let user = await message.client.users.fetch(id).catch(() => null);
            if(!user){
                invargs++;
                continue;
            }
            let member = await message.guild.members.fetch(user.id).catch(() => null);
            if(member && (!member.bannable || (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0))) {
                invusers++;
                continue;
            };
            let ban = await message.guild.fetchBan(user.id).catch(() => null);
            if(ban) {
                banneds++;
                continue;
            };
            let realban = await message.guild.members.ban(user.id, {
                reason: message.client.langs[channelLanguage].get('banReason', [message.author.tag, reason]),
                days: message.client.guildData.get(message.guild.id).pruneBan,
            }).catch(() => null);
            if(!realban){
                invusers++;
                continue;
            }
            bans++;
            let current = new log({
                id: message.client.guildData.get(message.guild.id).counterLogs++,
                guild: message.guild.id,
                type: 'ban',
                target: user.id,
                executor: message.author.id,
                timeStamp: Date.now(),
                actionMessage: message.url,
                reason: reason || null,
                image: message.attachments.first()?.height && message.attachments.first().url,
            });
            caseLogs.push(current);
            if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) continue;
            let embed = new MessageEmbed()
                .setColor(0xff0000)
                .setAuthor(message.client.langs[channelLanguage].get('banEmbedAuthor', [message.author.tag, user.tag]), user.displayAvatarURL({dynamic: true}))
                .setDescription(message.client.langs[channelLanguage].get('banEmbedDescription', [message.url]))
                .addField(message.client.langs[channelLanguage].get('banEmbedTargetTitle'), message.client.langs[channelLanguage].get('banEmbedTargetValue', [user]), true)
                .addField(message.client.langs[channelLanguage].get('banEmbedExecutorTitle'), message.author, true)
                .setTimestamp()
                .setFooter(message.client.langs[channelLanguage].get('banEmbedFooter', [current.id]), message.guild.iconURL({dynamic: true}));
            if(reason) embed.addField(message.client.langs[channelLanguage].get('banEmbedReasonTitle'), reason);
            if(current.image) embed.setImage(current.image);
            let msg = await discordChannel.send(embed);
            caseLogs[caseLogs.length - 1].logMessage = msg.id;
        }
        await guild.findByIdAndUpdate(message.guild.id, {$set: {counterLogs: message.client.guildData.get(message.guild.id).counterLogs}});
        await log.insertMany(caseLogs);
        message.channel.send(message.client.langs[channelLanguage].get('massbanSuccess', [bans, invargs, invusers, banneds]));
    },
};