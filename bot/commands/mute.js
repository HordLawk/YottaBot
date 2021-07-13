const log = require('../../schemas/log.js');
const guild = require('../../schemas/guild.js');
const {MessageEmbed} = require('discord.js')

module.exports = {
    active: true,
    name: 'mute',
    description: lang => lang.get('muteDescription'),
    aliases: ['m'],
    usage: lang => [lang.get('muteUsage')],
    example: ['@LordHawk#0572 1h30m spammer'],
    cooldown: 3,
    categoryID: 3,
    args: true,
    perm: 'MANAGE_ROLES',
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.guild ? message.client.guildData.get(message.guild.id).language : 'en';
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        const member = id && await message.guild.members.fetch(id).catch(() => null);
        if(!member) return message.channel.send(message.client.langs[channelLanguage].get('invMember'));
        if((message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) || member.permissions.has('ADMINISTRATOR')) return message.channel.send(message.client.langs[channelLanguage].get('youCantMute'));
        const duration = args[1] && (((parseInt(args[1].match(/(\d+)d/)?.[1], 10) * 86400000) || 0) + ((parseInt(args[1].match(/(\d+)h/)?.[1], 10) * 3600000) || 0) + ((parseInt(args[1].match(/(\d+)m/)?.[1], 10) * 60000) || 0));
        if(!duration || !isFinite(duration)) return message.channel.send(message.client.langs[channelLanguage].get('invMuteDuration'));
        let mute = await log.findOne({
            guild: message.guild.id,
            target: member.id,
            ongoing: true,
            type: 'mute',
        });
        if(mute) return message.channel.send(message.client.langs[channelLanguage].get('alreadyMuted'));
        const reason = message.content.replace(/^(?:\S+\s+){2}\S+\s*/, '').slice(0, 500);
        var discordRole = message.guild.roles.cache.get(message.client.guildData.get(message.guild.id).muteRoleID);
        if(!message.guild.me.permissions.has('MANAGE_ROLES')) return message.channel.send(message.client.langs[channelLanguage].get('botManageRolesServer'));
        if(discordRole && (!discordRole.editable || discordRole.managed)) return message.channel.send(message.client.langs[channelLanguage].get('cantGiveMuteRole'));
        const guildDoc = await guild.findById(message.guild.id);
        if(!discordRole){
            if(!message.client.guildData.get(message.guild.id).autoSetupMute) return message.channel.send(message.client.langs[channelLanguage].get('noMuteRole'));
            discordRole = await message.guild.roles.create({data: {name: message.client.langs[channelLanguage].get('muteRoleName')}});
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
            image: message.attachments.first()?.height && message.attachments.first().url,
            duration: new Date(timeStamp + duration),
            ongoing: true,
        });
        await guildDoc.save();
        await current.save();
        await member.roles.add(discordRole);
        await message.channel.send(message.client.langs[channelLanguage].get('muteMemberSuccess', [current.id]));
        if(message.client.guildData.get(message.guild.id).autoSetupMute){
            for(let channel of message.guild.channels.cache.filter(e => (e.manageable && (e.type != 'store') && e.permissionsFor(message.guild.me).has('MANAGE_ROLES') && !e.permissionOverwrites.has(discordRole.id))).array()){
                await message.guild.channels.cache.get(channel.id).createOverwrite(discordRole, {
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false,
                    CONNECT: false,
                }, message.client.langs[channelLanguage].get('muteRoleSetupReason'));
            }
        }
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.mute);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES') || !discordChannel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return;
        const d = Math.floor(duration / 86400000);
        const h = Math.floor((duration % 86400000) / 3600000);
        const m = Math.floor((duration % 3600000) / 60000);
        const embed = new MessageEmbed()
            .setTimestamp()
            .setColor(0xff8000)
            .setAuthor(message.client.langs[channelLanguage].get('muteEmbedAuthor', [message.author.tag, member.user.tag]), member.user.displayAvatarURL({dynamic: true}))
            .setDescription(message.client.langs[channelLanguage].get('muteEmbedDescription', [message.url]))
            .addField(message.client.langs[channelLanguage].get('muteEmbedTargetTitle'), message.client.langs[channelLanguage].get('muteEmbedTargetValue', [member]), true)
            .addField(message.client.langs[channelLanguage].get('muteEmbedExecutorTitle'), message.author, true)
            .addField(message.client.langs[channelLanguage].get('muteEmbedDurationTitle'), message.client.langs[channelLanguage].get('muteEmbedDurationValue', [d, h, m, Math.floor(current.duration.getTime() / 1000)]), true)
            .setFooter(message.client.langs[channelLanguage].get('muteEmbedFooter', [current.id]), message.guild.iconURL({dynamic: true}));
        if(reason) embed.addField(message.client.langs[channelLanguage].get('muteEmbedReasonTitle'), reason);
        if(current.image) embed.setImage(current.image);
        const msg = await discordChannel.send(embed);
        current.logMessage = msg.id;
        await current.save();
    },
};