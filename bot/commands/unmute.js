const log = require('../../schemas/log.js');
const guild = require('../../schemas/guild.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    active: true,
    name: 'unmute',
    description: lang => 'Unmutes an user\nAlso accepts a media attachment',
    usage: lang => ['(user) [(reason)]'],
    example: ['@LordHawk#0572 bribed me'],
    cooldown: 5,
    categoryID: 0,
    args: true,
    perm: 'MANAGE_ROLES',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.channel.send('Invalid user');
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        const member = await message.guild.members.fetch(id).catch(() => null);
        if(member && (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0)) return message.channel.send('You can\'t unmute this member');
        const discordRole = message.guild.roles.cache.get(message.client.guildData.get(message.guild.id).muteRoleID);
        if(member){
            if(!discordRole) return message.channel.send('Mute role not found');
            if(!discordRole.editable || discordRole.managed) return message.channel.send('I can\'t manage the mute role');
        }
        const mute = await log.findOneAndUpdate({
            guild: message.guild.id,
            target: id,
            ongoing: true,
            type: 'mute',
        }, {$set: {ongoing: false}});
        if(!mute) return message.channel.send('Muted user not found');
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'mute',
            target: mute.target,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height ? message.attachments.first().url : null,
            removal: true,
        });
        await current.save();
        if(member) await member.roles.remove(discordRole);
        await message.channel.send(`Member unmuted\nCase ID: \`${current.id}\``);
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.mute);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const embed = new MessageEmbed()
            .setColor(0x0000ff)
            .setAuthor(`${message.author.tag} unmuted ${member?.user.tag || 'someone'}`, member?.user.displayAvatarURL({dynamic: true}))
            .setDescription(`[Action message](${message.url})`)
            .addField('Target', `<@${current.target}>\n${current.target}`, true)
            .addField('Executor', message.author, true)
            .setTimestamp()
            .setFooter(`Case ${current.id}`, message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField('Reason', reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};