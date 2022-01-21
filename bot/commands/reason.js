const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'reason',
    description: lang => lang.get('reasonDescription'),
    aliases: ['editreason'],
    usage: lang => [lang.get('reasonUsage')],
    example: ['7 is actually a spammer not a scammer'],
    cooldown: 5,
    categoryID: 3,
    args: true,
    perm: 'BAN_MEMBERS',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        if(!args[1] || isNaN(parseInt(args[0], 10)) || !isFinite(parseInt(args[0], 10)) || (parseInt(args[0], 10) < 0)) return message.channel.send(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        const current = await log.findOne({
            id: parseInt(args[0], 10),
            guild: message.guild.id,
        });
        if(!current) return message.channel.send(channelLanguage.get('invCase'));
        const member = current.executor && await message.guild.members.fetch(current.executor).catch(() => null);
        if(member && (current.executor != message.author.id) && ((message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) || (message.guild.ownerId === member.id))) return message.channel.send(channelLanguage.get('youCantEditCase'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        current.reason = reason;
        await current.save();
        await message.channel.send(channelLanguage.get('reasonEditSuccess'));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs[current.type]);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const msg = await discordChannel.messages.fetch(current.logMessage).catch(() => null);
        if(!msg || !msg.editable || !msg.embeds.length) return;
        const embed = msg.embeds.find(e => (e.type === 'rich'));
        embed.setFields([{
            name: channelLanguage.get('reasonEmbedTargetTitle'),
            value: channelLanguage.get('reasonEmbedTargetValue', [current.target]),
            inline: true,
        }]);
        if(current.executor) embed.addField(channelLanguage.get('reasonEmbedExecutorTitle'), channelLanguage.get('reasonEmbedExecutorValue', [current.executor]), true);
        if(current.duration){
            let duration = current.duration.getTime() - current.timeStamp.getTime();
            let d = Math.floor(duration / 86400000);
            let h = Math.floor((duration % 86400000) / 3600000);
            let m = Math.floor((duration % 3600000) / 60000);
            embed.addField(channelLanguage.get('reasonEmbedDurationTitle'), channelLanguage.get('reasonEmbedDurationValue', [d, h, m, Math.floor(current.duration.getTime() / 1000)]), true);
        }
        embed.addField(channelLanguage.get('reasonEmbedReasonTitle'), reason);
        msg.edit({embeds: [embed]});
    },
};