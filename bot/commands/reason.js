const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

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
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        if(!args[1] || isNaN(parseInt(args[0], 10)) || !isFinite(parseInt(args[0], 10)) || (parseInt(args[0], 10) < 0)) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        const current = await log.findOne({
            id: parseInt(args[0], 10),
            guild: message.guild.id,
        });
        if(!current) return message.channel.send(message.client.langs[channelLanguage].get('invCase'));
        const member = current.executor && await message.guild.members.fetch(current.executor).catch(() => null);
        if(member && (current.executor != message.author.id) && ((message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) || (message.guild.ownerID === member.id))) return message.channel.send(message.client.langs[channelLanguage].get('youCantEditCase'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        current.reason = reason;
        await current.save();
        await message.channel.send(message.client.langs[channelLanguage].get('reasonEditSuccess'));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs[current.type]);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const msg = await discordChannel.messages.fetch(current.logMessage).catch(() => null);
        if(!msg || !msg.editable || !msg.embeds.length) return;
        const embed = msg.embeds.find(e => (e.type === 'rich'));
        embed.spliceFields(0, 25, {
            name: message.client.langs[channelLanguage].get('reasonEmbedTargetTitle'),
            value: message.client.langs[channelLanguage].get('reasonEmbedTargetValue', [current.target]),
            inline: true,
        });
        if(current.executor) embed.addField(message.client.langs[channelLanguage].get('reasonEmbedExecutorTitle'), message.client.langs[channelLanguage].get('reasonEmbedExecutorValue', [current.executor]), true);
        if(current.duration){
            let duration = current.duration.getTime() - current.timeStamp.getTime();
            let d = Math.floor(duration / 86400000);
            let h = Math.floor((duration % 86400000) / 3600000);
            let m = Math.floor((duration % 3600000) / 60000);
            embed.addField(message.client.langs[channelLanguage].get('reasonEmbedDurationTitle'), message.client.langs[channelLanguage].get('reasonEmbedDurationValue', [d, h, m, Math.floor(current.duration.getTime() / 1000)]), true);
        }
        embed.addField(message.client.langs[channelLanguage].get('reasonEmbedReasonTitle'), reason);
        msg.edit(embed);
    },
};