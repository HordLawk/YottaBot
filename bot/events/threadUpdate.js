const {PermissionsBitField, ThreadAutoArchiveDuration} = require('discord.js');
const locale = require('../../locale');
const configs = require('../configs.js');

module.exports = {
    name: 'threadUpdate',
    execute: async (_, newThread) => {
        if(newThread.partial) await newThread.fetch();
        if(
            !newThread.archived
            ||
            !newThread.guild.members.me
                .permissionsIn(newThread)
                .has(PermissionsBitField.Flags.ManageThreads)
        ) return;
        const channelModel = require('../../schemas/channel.js');
        const threads = await channelModel.find({
            _id: {$in: newThread.guild.channels.cache.map(e => e.id)},
            guild: newThread.guild.id,
            autoUnarchive: true,
        });
        const channelLanguage = locale.get(newThread.client.guildData.get(newThread.guild.id).language);
        if(
            threads
                .slice(
                    0,
                    configs.notarchiveLimits[+!!(
                        newThread.client.guildData.get(newThread.guild.id).premiumUntil
                        ??
                        newThread.client.guildData.get(newThread.guild.id).partner
                    )]
                )
                .some(e => (e._id === newThread.id))
        ) await newThread.edit({
            archived: false,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            locked: false,
            reason: channelLanguage.get('threadUnarchiveReason'),
        });
    },
};