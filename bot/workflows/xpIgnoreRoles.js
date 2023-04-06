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
    code: 'xpbl',
    steps: [async (interaction, args) => {
        const channelLanguage = locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en');
        const roleModel = require('../../schemas/role.js');
        if(args[0] === 'ADD'){
            const roleDocs = await roleModel.find({
                guild: interaction.guild.id,
                roleID: {$in: interaction.values},
            });
            const newRoles = interaction.roles
                .filter(role => !roleDocs.some(roleDoc => (roleDoc.roleID === role.id)))
                .map(role => ({
                    guild: interaction.guild.id,
                    roleID: role.id,
                    ignoreXp: true,
                }));
            await roleModel.insertMany(newRoles);
            const res = await roleModel.updateMany({
                guild: interaction.guild.id,
                roleID: {$in: roleDocs.map(roleDoc => roleDoc.roleID)},
            }, {$set: {ignoreXp: true}});
            return await interaction.update({
                content: channelLanguage.get('xpIgnoreRolesAdd', {modifiedCount: (newRoles.length + res.nModified)}),
                components: [],
            });
        }
        const res = await roleModel.updateMany({
            guild: interaction.guild.id,
            roleID: {$in: interaction.values},
        }, {$set: {ignoreXp: false}});
        await interaction.update({
            content: channelLanguage.get('xpIgnoreRolesRemove', {modifiedCount: res.nModified}),
            components: [],
        });
    }],
};