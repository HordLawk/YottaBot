const log = require('../../schemas/log.js');
const guild = require('../../schemas/guild.js');
const {MessageEmbed} = require('discord.js')

module.exports = {
    active: true,
    name: 'mute',
    description: lang => 'Mutes a member\nAlso accepts a media attachment',
    aliases: ['m'],
    usage: lang => ['(member) (duration) [(reason)]'],
    example: ['@LordHawk#0572 1h30m spammer'],
    cooldown: 3,
    categoryID: 0,
    args: true,
    perm: 'MANAGE_ROLES',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.channel.send('Member not found');
        if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.channel.send('You can\'t mute this member');
        const duration = args[1] && (((parseInt(args[1].match(/(\d+)d/)?.[1], 10) * 86400000) || 0) + ((parseInt(args[1].match(/(\d+)h/)?.[1], 10) * 3600000) || 0) + ((parseInt(args[1].match(/(\d+)m/)?.[1], 10) * 60000) || 0));
        if(!duration || !isFinite(duration)) return message.channel.send('Invalid mute duration');
        let mute = await log.findOne({
            guild: message.guild.id,
            target: member.id,
            ongoing: true,
            type: 'mute',
        });
        if(mute) return message.channel.send('This member is already muted');
        const reason = message.content.replace(/^(?:\S+\s+){2}\S+\s*/, '').slice(0, 500);
        var discordRole = message.guild.roles.cache.get(message.client.guildData.get(message.guild.id).muteRoleID);
        if(!message.guild.me.permissions.has('MANAGE_ROLES')) return message.channel.send('I can\'t manage roles in this server');
        if(discordRole && (!discordRole.editable || discordRole.managed)) return message.channel.send('I can\'t give the mute role to users');
        const guildDoc = await guild.findById(message.guild.id);
        if(!discordRole){
            if(!message.client.guildData.get(message.guild.id).autoSetupMute) return message.channel.send('No mute role was defined and the auto setup mute mode is disabled');
            discordRole = await message.guild.roles.create({data: {name: 'Muted'}});
            guildDoc.muteRoleID = discordRole.id;
            message.client.guildData.get(message.guild.id).muteRoleID = discordRole.id;
        }
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const timeStamp = Date.now();
        const current = new log({
            id: guildDoc.counterLogs++,
            guild: message.guild.id,
            type: 'mute',
            target: member.id,
            executor: message.author.id,
            timeStamp: timeStamp,
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height ? message.attachments.first().url : null,
            duration: new Date(timeStamp + duration),
            ongoing: true,
        });
        await guildDoc.save();
        await current.save();
        await member.roles.add(discordRole);
        await message.channel.send(`Member muted\nCase ID: \`${current.id}\``);
        if(message.client.guildData.get(message.guild.id).autoSetupMute){
            for(let channel of message.guild.channels.cache.filter(e => (e.manageable && (e.type != 'store') && e.permissionsFor(message.guild.me).has('MANAGE_ROLES') && !e.permissionOverwrites.has(discordRole.id))).array()){
                await message.guild.channels.cache.get(channel.id).createOverwrite(discordRole, {
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false,
                    CONNECT: false,
                }, 'Mute role permissions setup');
            }
        }
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.mute);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const d = Math.floor(duration / 86400000);
        const h = Math.floor((duration % 86400000) / 3600000);
        const m = Math.floor((duration % 3600000) / 60000);
        const formattedDuration = `${d ? `${d}d` : ''}${h ? `${h}h` : ''}${m ? `${m}m` : ''}`;
        const embed = new MessageEmbed()
            .setTimestamp()
            .setColor(0xff8000)
            .setAuthor(`${message.author.tag} muted ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))
            .setDescription(`[Action message](${message.url})`)
            .addField('Target', `${member}\n${member.id}`, true)
            .addField('Executor', message.author, true)
            .addField('Duration', `${formattedDuration}\n<t:${Math.floor(current.duration.getTime() / 1000)}:R>`, true)
            .setFooter(`Case ${current.id}`, message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField('Reason', reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};