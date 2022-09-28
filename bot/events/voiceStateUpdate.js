const { EmbedBuilder } = require('discord.js');
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

module.exports = {
    name: 'voiceStateUpdate',
    execute: async (oldState, newState) => {
        if((oldState.channelId === newState.channelId) || !newState.client.guildData.has(newState.guild.id)) return;
        const channelLanguage = locale.get(newState.client.guildData.get(newState.guild.id).language);
        if(!oldState.channelId && enabledLogs(newState.client.guildData.get(newState.guild.id), 'voiceconnect')){
            if(await isIgnored(newState, 'voiceconnect')) return;
            const hook = await fetchHook(newState, 'voiceconnect');
            if(!hook) return;
            const user = newState.member?.user ?? await newState.client.users.fetch(newState.id);
            let muteEmoji = '<:unmuted:1024669326055317504>';
            if(newState.mute){
                muteEmoji = newState.serverMute ? '<:servermuted:1024669235919728660>' : '<:muted:1024669323178016869>';
            }
            let deafEmoji = '<:undeaf:1024669324704755742>';
            if(newState.deaf){
                muteEmoji = newState.serverDeaf ? '<:serverdeaf:1024669234569162782>' : '<:deaf:1024669262889091212>';
            }
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setAuthor({
                    name: channelLanguage.get('voiceconnectEmbedAuthor', [user.tag, newState.channel.name]),
                    iconURL: user.displayAvatarURL({dynamic: true}),
                })
                .setTimestamp()
                .setFooter({text: newState.id})
                .setDescription(`${muteEmoji} ${deafEmoji}`)
                .addFields(
                    {
                        name: channelLanguage.get('voiceconnectEmbedUserTitle'),
                        value: user.toString(),
                        inline: true,
                    },
                    {
                        name: channelLanguage.get('voiceconnectEmbedChannelTitle'),
                        value: newState.channel.toString(),
                        inline: true,
                    },
                );
            await hook.send({
                embeds: [embed],
                username: newState.client.user.username,
                avatarURL: newState.client.user.avatarURL({size: 4096}),
            });
        }
        else if(!newState.channelId && enabledLogs(newState.client.guildData.get(newState.guild.id), 'voicedisconnect')){
            if(await isIgnored(newState, 'voicedisconnect')) return;
            const hook = await fetchHook(newState, 'voicedisconnect');
            if(!hook) return;
        }
        else if(enabledLogs(newState.client.guildData.get(newState.guild.id), 'voicemove')){
            if(await isIgnored(newState, 'voicemove')) return;
            const hook = await fetchHook(newState, 'voicemove');
            if(!hook) return;
        }
    },
};