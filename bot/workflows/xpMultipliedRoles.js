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
    code: 'xpmultrole',
    steps: [async (interaction, multiplierValueString) => {
        const channelLanguage = locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en');
        const roleModel = require('../../schemas/role.js');
        const roleDocs = await roleModel.find({
            guild: interaction.guild.id,
            roleID: {$in: interaction.values},
        });
        const multiplierValue = parseFloat(multiplierValueString);
        const newRoles = interaction.values
            .filter(roleId => !roleDocs.some(roleDoc => (roleDoc.roleID === roleId)))
            .map(roleId => ({
                guild: interaction.guild.id,
                roleID: roleId,
                xpMultiplier: multiplierValue,
            }));
        await roleModel.insertMany(newRoles);
        const res = await roleModel.updateMany({
            guild: interaction.guild.id,
            roleID: {$in: roleDocs.map(roleDoc => roleDoc.roleID)},
        }, {$set: {xpMultiplier: multiplierValue}});
        await interaction.reply(
            channelLanguage.get(
                'multipliedRolesSuccess',
                {modifiedCount: (newRoles.length + res.nModified), multiplierValue},
            ),
        );
    }],
};