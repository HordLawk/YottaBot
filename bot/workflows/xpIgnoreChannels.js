// Copyright (C) 2023  HordLawk

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

const locale = require('../../locale');

module.exports = {
    code: 'xpblchan',
    steps: [async (interaction, action) => {
        const channelLanguage = locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en');
        const channelModel = require('../../schemas/channel.js');
        if(action === 'ADD'){
            const channelDocs = await channelModel.find({
                _id: {$in: interaction.values},
                guild: interaction.guild.id,
            });
            const newChannels = interaction.values
                .filter(channelId => !channelDocs.some(channelDoc => (channelDoc._id === channelId)))
                .map(channelId => ({
                    _id: channelId,
                    guild: interaction.guild.id,
                    ignoreXp: true,
                }));
            await channelModel.insertMany(newChannels);
            const res = await channelModel.updateMany({
                _id: {$in: channelDocs.map(channelDoc => channelDoc._id)},
                guild: interaction.guild.id,
                ignoreXp: {$ne: true},
            }, {$set: {ignoreXp: true}});
            return await interaction.update({
                content: channelLanguage.get('xpIgnoreChannelsAdd', {modifiedCount: (newChannels.length + res.nModified)}),
                components: [],
            });
        }
        const res = await channelModel.updateMany({
            _id: {$in: interaction.values},
            guild: interaction.guild.id,
            ignoreXp: true,
        }, {$set: {ignoreXp: false}});
        await interaction.update({
            content: channelLanguage.get('xpIgnoreChannelsRemove', {modifiedCount: res.nModified}),
            components: [],
        });
    }],
};