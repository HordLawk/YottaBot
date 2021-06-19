const menu = require('../../schemas/menu.js');

module.exports = {
    name: 'messageReactionRemove',
    execute: async (messageReaction, user) => {
        if(messageReaction.partial) messageReaction = await messageReaction.fetch().catch(() => null);
        if(!messageReaction || !messageReaction.message.guild || !messageReaction.message.guild.available || user.bot || !messageReaction.message.client.guildData.has(messageReaction.message.guild.id)) return;
        const menuDoc = await menu.findOne({
            guild: messageReaction.message.guild.id,
            channelID: messageReaction.message.channel.id,
            messageID: messageReaction.message.id,
            emojis: {$elemMatch: {_id: messageReaction.emoji.identifier}},
        });
        if(!menuDoc) return;
        const discordRole = messageReaction.message.guild.roles.cache.get(menuDoc.emojis.id(messageReaction.emoji.identifier).roleID);
        if(!discordRole || !discordRole.editable) return;
        const member = await messageReaction.message.guild.members.fetch({
            user: user.id,
            force: true,
        }).catch(() => null);
        if(!member) return;
        await member.roles.set(member.roles.cache.filter(e => (e.id != discordRole.id)).map(e => e.id));
    },
};