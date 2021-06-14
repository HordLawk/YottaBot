const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'ban',
    description: lang => 'Bans an user\nAlso accepts a media attachment',
    aliases: ['b'],
    usage: lang => ['(user) (reason)'],
    example: ['@LordHawk#0572 spammer'],
    cooldown: 3,
    categoryID: 0,
    args: true,
    perm: 'BAN_MEMBERS',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.channel.send('Invalid user');
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        const member = await message.guild.members.fetch(id).catch(() => null);
        if(member){
            if(!member.bannable) return message.channel.send('I can\'t ban this member');
            if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.channel.send('You can\'t ban this member');
            await member.send(`You were banned in **${message.guild.name}**${reason ? `\n__Reason:__ *${reason}*` : ''}`).catch(() => null);
        }
        else{
            const ban = await message.guild.fetchBan(id).catch(() => null);
            if(ban) return message.channel.send('This user is already banned');
        }
        const user = await message.guild.members.ban(id, {
            reason: `Executor: ${message.author.tag}${reason ? ` | Reason: ${reason}` : ''}`,
            days: message.client.guildData.get(message.guild.id).pruneBan,
        }).catch(() => null);
        if(!user) return message.channel.send('User not found');
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'ban',
            target: user.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height ? message.attachments.first().url : null,
        });
        await current.save();
        await message.channel.send('Member banned');
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setAuthor(`${message.author.tag} banned ${user.tag}`, user.displayAvatarURL({dynamic: true}))
            .setDescription(`[Action message](${message.url})`)
            .addField('Target', `${user}\n${user.id}`, true)
            .addField('Executor', message.author, true)
            .setFooter(`Case ${current.id}`, message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField('Reason', reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};