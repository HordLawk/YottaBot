const { EmbedBuilder, PermissionsBitField, AuditLogEvent } = require('discord.js');
const locale = require('../../locale');
const channelModel = require('../../schemas/channel.js');
const roleModel = require('../../schemas/role.js');

const enabledLogs = (guildData, logType) => (
    guildData.actionlogs.id(logType) && (guildData.actionlogs.id(logType).hookID || guildData.defaultLogsHookID)
);

const isIgnored = async (voiceState, logType) => {
    const channelDoc = await channelModel.findById(voiceState.channelId);
    if(channelDoc && channelDoc.ignoreActions.includes(logType)) return true;
    const memb = voiceState.member || await voiceState.guild.members.fetch(voiceState.id).catch(() => null);
    return !!memb && await roleModel.exists({
        guild: voiceState.guild.id,
        roleID: {$in: memb.roles.cache.map(e => e.id)},
        ignoreActions: logType,
    });
}

const fetchHook = async (voiceState, logType) => {
    const guildData = voiceState.client.guildData.get(voiceState.guild.id);
    const actionlog = guildData.actionlogs.id(logType);
    return await voiceState.client.fetchWebhook(
        actionlog.hookID || guildData.defaultLogsHookID, actionlog.hookToken || guildData.defaultLogsHookToken
    );
}

const voiceEmojis = voiceState => {
    let muteEmoji = '<:unmuted:1024669326055317504>';
    if(voiceState.mute){
        muteEmoji = voiceState.serverMute ? '<:servermuted:1024669235919728660>' : '<:muted:1024669323178016869>';
    }
    let deafEmoji = '<:undeaf:1024669324704755742>';
    if(voiceState.deaf){
        deafEmoji = voiceState.serverDeaf ? '<:serverdeaf:1024669234569162782>' : '<:deaf:1024669262889091212>';
    }
    return `${muteEmoji} ${deafEmoji}`;
}

const sendLog = async (hook, embed, clientUser) => await hook.send({
    embeds: [embed],
    username: clientUser.username,
    avatarURL: clientUser.avatarURL({size: 4096}),
});

const fetchEntry = async (guild, auditType) => {
    const audits = await guild.fetchAuditLogs({
        type: auditType,
        limit: 1,
    });
    return audits.entries.first();
}

const isNewAudit = (lastAudit, entry) => (
    lastAudit && ((entry.id !== lastAudit.id) || (entry.extra.count !== lastAudit.count))
);

module.exports = {
    name: 'voiceStateUpdate',
    execute: async (oldState, newState) => {
        if((oldState.channelId === newState.channelId) || !newState.client.guildData.has(newState.guild.id)) return;
        const guildData = newState.client.guildData.get(newState.guild.id);
        const channelLanguage = locale.get(guildData.language);
        if(!oldState.channelId || (newState.channelId && (await isIgnored(oldState, 'voicedisconnect')))){
            if(!enabledLogs(guildData, 'voiceconnect') || (await isIgnored(newState, 'voiceconnect'))) return;
            const hook = await fetchHook(newState, 'voiceconnect');
            if(!hook) return;
            const user = newState.member?.user ?? await newState.client.users.fetch(newState.id);
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setAuthor({
                    name: channelLanguage.get('voiceconnectEmbedAuthor', [user.tag]),
                    iconURL: user.displayAvatarURL({dynamic: true}),
                })
                .setTimestamp()
                .setFooter({text: newState.id})
                .setDescription(voiceEmojis(newState))
                .addFields(
                    {
                        name: channelLanguage.get('voiceconnectEmbedChannelTitle'),
                        value: newState.channel.toString(),
                        inline: true,
                    },
                    {
                        name: channelLanguage.get('voiceconnectEmbedUserTitle'),
                        value: user.toString(),
                        inline: true,
                    },
                );
            await sendLog(hook, embed, newState.client.user);
        }
        else if(!newState.channelId || (oldState.channelId && (await isIgnored(newState, 'voiceconnect')))){
            if(!enabledLogs(guildData, 'voicedisconnect') || (await isIgnored(oldState, 'voicedisconnect'))) return;
            const hook = await fetchHook(newState, 'voicedisconnect');
            if(!hook) return;
            const user = oldState.member?.user ?? await newState.client.users.fetch(newState.id);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setAuthor({
                    name: channelLanguage.get('voicedisconnectEmbedAuthor', [user.tag]),
                    iconURL: user.displayAvatarURL({dynamic: true}),
                })
                .setTimestamp()
                .setFooter({text: newState.id})
                .setDescription(voiceEmojis(oldState))
                .addFields(
                    {
                        name: channelLanguage.get('voicedisconnectEmbedChannelTitle'),
                        value: `<#${oldState.channelId}>`,
                        inline: true,
                    },
                    {
                        name: channelLanguage.get('voicedisconnectEmbedUserTitle'),
                        value: user.toString(),
                        inline: true,
                    },
                );
            if(newState.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)){
                const entry = await fetchEntry(newState.guild, AuditLogEvent.MemberDisconnect);
                if(entry){
                    if(isNewAudit(newState.client.lastDisconnectAudit.get(newState.guild.id), entry)) embed.addFields({
                        name: channelLanguage.get('voicedisconnectEmbedExecutorTitle'),
                        value: entry.executor.toString(),
                        inline: true,
                    });
                    newState.client.lastDisconnectAudit.set(newState.guild.id, {
                        id: entry.id,
                        count: entry.extra.count,
                    });
                }
            }
            await sendLog(hook, embed, newState.client.user);
        }
        else if(enabledLogs(guildData, 'voicemove')){
            const hook = await fetchHook(newState, 'voicemove');
            if(!hook) return;
            const user = newState.member?.user ?? await newState.client.users.fetch(newState.id);
            const embed = new EmbedBuilder()
                .setColor(0x0000ff)
                .setAuthor({
                    name: channelLanguage.get('voicemoveEmbedAuthor', [user.tag]),
                    iconURL: user.displayAvatarURL({dynamic: true}),
                })
                .setTimestamp()
                .setFooter({text: newState.id})
                .setDescription(voiceEmojis(newState))
                .addFields(
                    {
                        name: channelLanguage.get('voicemoveEmbedFromTitle'),
                        value: oldState.channel.toString(),
                        inline: true,
                    },
                    {
                        name: channelLanguage.get('voicemoveEmbedToTitle'),
                        value: newState.channel.toString(),
                        inline: true,
                    },
                );
            const userField = {
                name: channelLanguage.get('voicemoveEmbedTargetTitle'),
                value: user.toString(),
                inline: true,
            };
            let selfMove = true;
            if(newState.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)){
                const entry = await fetchEntry(newState.guild, AuditLogEvent.MemberMove);
                if(entry){
                    if(isNewAudit(newState.client.lastMoveAudit.get(newState.guild.id), entry)){
                        const emptyField = {
                            name: '\u200B',
                            value: '\u200B',
                            inline: true,
                        };
                        embed.addFields(
                            emptyField,
                            userField,
                            {
                                name: channelLanguage.get('voicemoveEmbedExecutorTitle'),
                                value: entry.executor.toString(),
                                inline: true,
                            },
                            emptyField,
                        );
                        selfMove = false;
                    }
                    newState.client.lastMoveAudit.set(newState.guild.id, {
                        id: entry.id,
                        count: entry.extra.count,
                    });
                }
            }
            if(selfMove) embed.addFields(userField);
            await sendLog(hook, embed, newState.client.user);
        }
    },
};