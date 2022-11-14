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
const configs = require('../configs');

module.exports = {
    name: 'presenceUpdate',
    execute: async (oldPresence, newPresence) => {
        const guildData = newPresence.client.guildData.get(newPresence.guild.id);
        if(
            !oldPresence?.user
            ||
            oldPresence.user.partial
            ||
            !newPresence.user
            ||
            !newPresence.guild.available
            ||
            !guildData
            ||
            !newPresence.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)
        ) return;
        if(newPresence.user.partial) await newPresence.user.fetch();
        if(oldPresence.user.username === newPresence.user.username) return;
        const memberModel = require('../../schemas/member.js');
        let memberDoc = await memberModel.findOne({
            guild: newPresence.guild.id,
            userID: newPresence.user.id,
        });
        if(memberDoc?.autoBanned) return;
        const namebanModel = require('../../schemas/nameban.js');
        const namebanDocs = await namebanModel
            .find({guild: newPresence.guild.id})
            .sort({createdAt: 1})
            .limit(configs.namebansLimits[+Boolean(guildData.premiumUntil || guildData.partner)]);
        if(namebanDocs.every(doc => {
            const username = doc.caseSensitive ? newPresence.user.username.toLowerCase() : newPresence.user.username;
            return doc.partial ? !username.includes(doc.text) : (username !== doc.text);
        })) return;
        if(memberDoc){
            memberDoc.autoBanned = true;
        }
        else{
            memberDoc = new memberModel({
                guild: newPresence.guild.id,
                userID: newPresence.user.id,
                autoBanned: true,
            });
        }
        await memberDoc.save();
        await newPresence.member.ban({reason: channelLanguage.get('namebanReason')});
    },
};