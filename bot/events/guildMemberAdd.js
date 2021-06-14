const log = require('../../schemas/log.js');

module.exports = {
    name: 'guildMemberAdd',
    execute: async member => {
        const mute = await log.findOne({
            target: member.id,
            ongoing: true,
        });
        if(!mute) return;
        const discordRole = member.guild.roles.cache.get(member.client.guildData.get(member.guild.id).muteRoleID);
        if(discordRole && discordRole.editable) await member.roles.add(discordRole);
    },
};