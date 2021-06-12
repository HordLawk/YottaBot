const log = require('../../schemas/log.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'check',
    description: lang => 'Shows an user\'s cases',
    aliases: ['modlogs'],
    usage: lang => ['(user) <all/warn/mute/kick/ban> [(time filter)]'],
    example: ['@LordHawk#0572 mute 15d12h30m30s'],
    cooldown: 5,
    categoryID: 0,
    args: true,
    guilOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
        if(!['all', 'warn', 'mute', 'kick', 'ban'].includes(args[1])) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.channel.send(message.client.langs[channelLanguage].get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(message.client.langs[channelLanguage])]));
        const filter = args[2] ? (Date.now() - (((parseInt(args[2].match(/(\d+)d/)?.[1], 10) * 86400000) || 0) + ((parseInt(args[2].match(/(\d+)h/)?.[1], 10) * 3600000) || 0) + ((parseInt(args[2].match(/(\d+)m/)?.[1], 10) * 60000) || 0) + ((parseInt(args[2].match(/(\d+)s/)?.[1], 10) * 1000) || 0))) : 0;
        const logDocs = await log.find({
            guild: message.guild.id,
            target: id,
            type: (args[1] === 'all') ? {$ne: args[1]} : {$eq: args[1]},
            timeStamp: {$gte: filter},
        }).sort({timeStamp: -1});
        if(!logDocs.length) return message.channel.send('No logs meeting these conditions were found');
        const discordMember = await message.guild.members.fetch(id).catch(() => null);
        const formatDuration = (ms) => {
            let d = Math.floor(ms / 86400000);
            let h = Math.floor((ms % 86400000) / 3600000);
            let m = Math.floor((ms % 3600000) / 60000);
            let s = Math.floor((ms % 60000) / 1000);
            return `${d ? `${d}d` : ''}${h ? `${h}h` : ''}${m ? `${m}m` : ''}${s ? `${s}s` : ''}`;
        }
        const embed = new MessageEmbed()
            .setColor((discordMember || message.guild.me).displayColor || 0x8000ff)
            .setAuthor(discordMember?.user.tag || 'Cases', discordMember?.user.displayAvatarURL({dynamic: true}))
            .setTimestamp()
            .setFooter(`${logDocs.length} cases found`)
            .setDescription(`${['all', 'warn'].includes(args[1]) ? `Warns: \`${logDocs.filter(e => (e.type === 'warn')).length}\`\n` : ''}${['all', 'mute'].includes(args[1]) ? `Mutes: \`${logDocs.filter(e => ((e.type === 'mute') && !e.removal)).length}\`\nUnmutes: \`${logDocs.filter(e => ((e.type === 'mute') && e.removal)).length}\`\n` : ''}${['all', 'kick'].includes(args[1]) ? `Kicks: \`${logDocs.filter(e => (e.type === 'kick')).length}\`\n` : ''}${['all', 'ban'].includes(args[1]) ? `Bans: \`${logDocs.filter(e => ((e.type === 'ban') && !e.removal)).length}\`\nUnbans: \`${logDocs.filter(e => ((e.type === 'ban') && e.removal)).length}\`\n` : ''}`)
            .addFields(logDocs.slice(0, 25).map(e => ({
                name: `Case ${e.id}`,
                value: `Type: \`${e.removal ? `${'un'}${e.type}` : e.type}\`\n[Action message](${e.actionMessage})\n${e.executor ? `Executor: <@${e.executor}>\n` : ''}${e.duration ? `Duration: \`${formatDuration(e.duration.getTime())}\`\n` : ''}${e.reason ? `Reason: "${e.reason}"\n` : ''}Date: \`${e.timeStamp.toUTCString()}\`${e.image ? `\n[**Media**](${e.image})` : ''}`,
            })));
            let msg = await message.channel.send(embed);
            if(logDocs.length <= 25) return;
            await msg.react('⬅');
            await msg.react('➡');
            let col = msg.createReactionCollector((r, u) => (['➡', '⬅'].includes(r.emoji.name) && (u.id === message.author.id)), {time: 600000});
            let page = 0;
            col.on('collect', async r => {
                await r.users.remove(message.author);
                if(r.emoji.name === '➡'){
                    if(!logDocs.slice((page + 1) * 25).length) return;
                    page++;
                }
                else{
                    if(!page) return;
                    page--;
                }
                embed.spliceFields(0, 25, logDocs.slice(page * 25, (page + 1) * 25).map(e => ({
                    name: `Case ${e.id}`,
                    value: `Type: \`${e.removal ? `${'un'}${e.type}` : e.type}\`\n[Action message](${e.actionMessage})\n${e.executor ? `Executor: <@${e.executor}>\n` : ''}${e.duration ? `Duration: \`${formatDuration(e.duration.getTime())}\`\n` : ''}${e.reason ? `Reason: "${e.reason}"\n` : ''}Date: \`${e.timeStamp.toUTCString()}\`${e.image ? `\n[**Media**](${e.image})` : ''}`,
                })));
                await msg.edit(embed);
            });
            col.on('end', () => msg.reactions.removeAll());
    },
};