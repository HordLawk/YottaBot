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
    code: 'manxp',
    steps: [async (interaction, action, valueString) => {
        const channelLanguage = locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en');
        const memberModel = require('../../schemas/member.js');
        let memberDocs = await memberModel.find({
            guild: interaction.guild.id,
            userID: {$in: interaction.values},
        });
        const newMembers = interaction.members
            .filter(member => !memberDocs.some(memberDoc => (memberDoc.userID === member.id)))
            .map(member => ({
                guild: interaction.guild.id,
                userID: member.id,
            }));
        await memberModel.insertMany(newMembers);
        memberDocs = memberDocs.concat(newMembers);
        let query;
        const value = parseInt(valueString, 10);
        switch(action){
            case 'ADD': query = {$inc: {xp: value}};
            break;
            case 'REMOVE': query = {$inc: {xp: -value}};
            break;
            case 'SET': query = {$set: {xp: value}};
            break;
        }
        await memberModel.updateMany({
            guild: interaction.guild.id,
            userID: {$in: memberDocs.map(memberDoc => memberDoc.userID)},
        }, query);
        if(action === 'REMOVE') await memberModel.updateMany({
            guild: interaction.guild.id,
            xp: {$lt: 0},
        }, {$set: {xp: 0}});
        const roleModel = require('../../schemas/role.js');
        const roleDocs = await roleModel.find({
            guild: interaction.guild.id,
            roleID: {$in: [...interaction.guild.roles.cache.filter(role => role.editable).keys()]},
            xp: {$ne: null},
        }).sort({xp: -1});
        if(roleDocs.length){
            memberDocs = await memberModel.find({
                guild: interaction.guild.id,
                userID: {$in: interaction.values},
            });
            for(const memberDoc of memberDocs){
                const member = interaction.members.get(memberDoc.userID);
                const achievedRoleDocs = roleDocs.filter(roleDoc => (roleDoc.xp <= memberDoc.xp));
                await member.roles.set(
                    [
                        ...member.roles.cache
                            .filter(role => !roleDocs.some(roleDoc => (role.id === roleDoc.roleID)))
                            .keys(),
                        ...(
                            interaction.client.guildData.get(interaction.guild.id).dontStack
                            ? achievedRoleDocs.slice(0, 1)
                            : achievedRoleDocs
                        ).map(e => e.roleID),
                    ],
                );
            }
        }
        await interaction.update({
            content: channelLanguage.get('setUserXp'),
            components: [],
        });
    }],
};