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

const hookCredentials = (guildData, logType) => {
    return [
        guildData.actionlogs.id(logType).hookID || guildData.defaultLogsHookID,
        guildData.actionlogs.id(logType).hookToken || guildData.defaultLogsHookToken,
    ];
}

module.exports = {
    name: 'voiceStateUpdate',
    execute: async (oldState, newState) => {
        if((oldState.channelId === newState.channelId) || !newState.client.guildData.has(newState.guild.id)) return;
        const channelLanguage = locale.get(newState.client.guildData.get(newState.guild.id).language);
        if(!oldState.channelId && enabledLogs(newState.client.guildData.get(newState.guild.id), 'voiceconnect')){
            if(await isIgnored(newState, 'voiceconnect')) return;
            const hook = await newState.client.fetchWebhook(
                ...hookCredentials(newState.client.guildData.get(newState.guild.id), 'voiceconnect')
            ).catch(() => null);
            if(!hook) return;
        }
        else if(!newState.channelId && enabledLogs(newState.client.guildData.get(newState.guild.id), 'voicedisconnect')){
            if(await isIgnored(newState, 'voicedisconnect')) return;
            const hook = await newState.client.fetchWebhook(
                ...hookCredentials(newState.client.guildData.get(newState.guild.id), 'voicedisconnect')
            ).catch(() => null);
            if(!hook) return;
        }
        else if(enabledLogs(newState.client.guildData.get(newState.guild.id), 'voicemove')){
            if(await isIgnored(newState, 'voicemove')) return;
            const hook = await newState.client.fetchWebhook(
                ...hookCredentials(newState.client.guildData.get(newState.guild.id), 'voicemove')
            ).catch(() => null);
            if(!hook) return;
        }
    },
};