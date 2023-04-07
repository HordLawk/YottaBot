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
    code: 'resetxp',
    steps: [async interaction => {
        const channelLanguage = locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en');
        const memberModel = require('../../schemas/member.js');
        await memberModel.updateMany({
            guild: interaction.guild.id,
            xp: {$ne: 0},
        }, {$set: {xp: 0}});
        await interaction.update({
            content: channelLanguage.get('resetXp'),
            components: [],
        });
    }],
};