const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'unban',
    description: lang => 'Unbans an user',
    usage: lang => ['(user) (reason)'],
    example: ['@LordHawk apologised'],
    cooldown: 5,
    categoryID: 0,
    args: true,
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.channel.send('Invalid mention');
        const ban = await message.guild.fetchBan(id).catch(() => null);
        if(!ban) return message.channel.send('Banned user not found');
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        if(!message.guild.me.permissions.has('BAN_MEMBERS')) return message.channel.send('I don\'t have permission to unban users');
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'unban',
            target: ban.user.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height ? message.attachments.first().url : null,
        });
        await current.save();
        await message.guild.members.unban(ban.user.id, `Executor: ${message.author.tag}${reason ? ` | Reason: ${reason}` : ''}`);
        await message.channel.send('User unbanned');
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const embed = new MessageEmbed()
            .setTimestamp()
            .setColor(0x00ff00)
            .setAuthor(`${message.author.tag} banned ${ban.user.tag}`, ban.user.displayAvatarURL({dynamic: true}))
            .setDescription(`[Action message](${message.url})`)
            .addField('Target', `${ban.user}\n${ban.user.id}`, true)
            .addField('Executor', message.author, true)
            .setFooter(`Case ${current.id}`, message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField('Reason', reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};