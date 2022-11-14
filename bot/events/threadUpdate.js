// Copyright (C) 2022  HordLawk

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const {ThreadAutoArchiveDuration} = require('discord.js');
const locale = require('../../locale');
const configs = require('../configs.js');

module.exports = {
    name: 'threadUpdate',
    execute: async (_, newThread) => {
        if(newThread.partial) await newThread.fetch();
        const guildData = newThread.client.guildData.get(newThread.guild.id);
        if(!newThread.archived || !newThread.editable || !guildData) return;
        const channelModel = require('../../schemas/channel.js');
        const threads = await channelModel.find({
            _id: {$in: newThread.guild.channels.cache.map(e => e.id)},
            guild: newThread.guild.id,
            autoUnarchive: true,
        });
        const channelLanguage = locale.get(guildData.language);
        if(
            threads
                .slice(0, configs.notarchiveLimits[+!!(guildData.premiumUntil || guildData.partner)])
                .some(e => (e._id === newThread.id))
        ) await newThread.edit({
            archived: false,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            locked: false,
            reason: channelLanguage.get('threadUnarchiveReason'),
        });
    },
};