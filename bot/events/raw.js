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

const { PermissionsBitField } = require('discord.js');
const locale = require('../../locale');
const configs = require('../configs');

module.exports = {
    name: 'raw',
    execute: async (event, _, client) => {
        if(event.t !== 'PRESENCE_UPDATE') return;
        const username = client.users.cache.get(event.d.user.id)?.username;
        const guild = client.guilds.cache.get(event.d.guild_id);
        const guildData = client.guildData.get(guild.id);
        if(
            !username
            ||
            !event.d.user.username
            ||
            !guild.available
            ||
            !guildData
            ||
            !guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)
            ||
            (username === event.d.user.username)
        ) return;
        const memberModel = require('../../schemas/member.js');
        let memberDoc = await memberModel.findOne({
            guild: guild.id,
            userID: event.d.user.id,
        });
        if(memberDoc?.autoBanned) return;
        const namebanModel = require('../../schemas/nameban.js');
        const namebanDocs = await namebanModel
            .find({guild: guild.id})
            .sort({createdAt: 1})
            .limit(configs.namebansLimits[+Boolean(guildData.premiumUntil || guildData.partner)]);
        if(namebanDocs.every(doc => {
            const parsedUsername = doc.caseSensitive ? event.d.user.username : event.d.user.username.toLowerCase();
            return doc.partial ? !parsedUsername.includes(doc.text) : (parsedUsername !== doc.text);
        })) return;
        if(memberDoc){
            memberDoc.autoBanned = true;
        }
        else{
            memberDoc = new memberModel({
                guild: guild.id,
                userID: event.d.user.id,
                autoBanned: true,
            });
        }
        await memberDoc.save();
        await guild.members.ban(event.d.user.id, {reason: locale.get(guildData.language).get('namebanReason')});
    },
};