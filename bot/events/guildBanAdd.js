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

const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const member = require('../../schemas/member.js');
const {EmbedBuilder, PermissionsBitField, AuditLogEvent} = require('discord.js');
const locale = require('../../locale');

module.exports = {
    name: 'guildBanAdd',
    execute: async ban => {
        if(ban.partial) ban = await ban.fetch().catch(() => null);
        if(!ban) return;
        if(ban.guild.memberCount > 1000){
            let memberDoc = await member.findOne({
                guild: ban.guild.id,
                userID: ban.user.id,
            });
            if(memberDoc){
                if(!memberDoc.autoBanned){
                    memberDoc.relevantBan = true;
                    await memberDoc.save();
                }
            }
            else{
                memberDoc = new member({
                    guild: ban.guild.id,
                    userID: ban.user.id,
                    relevantBan: true,
                });
                await memberDoc.save();
            }
        }
        if((ban.user.id === ban.client.user.id) || !ban.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog) || !ban.client.guildData.has(ban.guild.id)) return;
        const audits = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanAdd,
        });
        if(!audits.entries.first() || audits.entries.first().executor.bot) return;
        if(ban.client.guildData.get(ban.guild.id).antiMassBan){
            const bantimes = ban.client.bantimes.get(ban.guild.id);
            const entry = audits.entries.first();
            if(bantimes){
                const bantime = bantimes.get(entry.executor.id);
                if(bantime){
                    bantime.push(entry.createdTimestamp);
                    const notNow = Date.now() - 10000;
                    if(
                        (bantime.filter(e => (e > notNow)).length > ban.client.guildData.get(ban.guild.id).antiMassBan)
                        &&
                        ban.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)
                    ){
                        const executorMember = await ban.guild.members.fetch(audits.entries.first().executor.id);
                        const banRoles = executorMember.roles.cache.filter(e => e.permissions.has(PermissionsBitField.Flags.BanMembers));
                        if(banRoles.every(e => (e.comparePositionTo(ban.guild.members.me.roles.highest) < 0))) await executorMember.roles.remove(banRoles);
                    }
                }
                else{
                    bantimes.set(entry.executor.id, [entry.createdTimestamp]);
                }
            }
            else{
                ban.client.bantimes.set(ban.guild.id, new Map([[entry.executor.id, [entry.createdTimestamp]]]));
            }
        }
        const reason = ban.reason?.slice(0, 500);
        const guildDoc = await guild.findByIdAndUpdate(ban.guild.id, {$inc: {counterLogs: 1}});
        ban.client.guildData.get(ban.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: ban.guild.id,
            type: 'ban',
            target: ban.user.id,
            executor: audits.entries.first().executor.id,
            timeStamp:  audits.entries.first().createdAt,
            reason: reason,
        });
        await current.save();
        const discordChannel = ban.guild.channels.cache.get(ban.client.guildData.get(ban.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(ban.guild.members.me).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.permissionsFor(ban.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)) return;
        const channelLanguage = locale.get(ban.client.guildData.get(ban.guild.id).language);
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setAuthor({
                name: channelLanguage.get('banEmbedAuthor', [audits.entries.first().executor.tag, ban.user.tag]),
                iconURL: ban.user.displayAvatarURL({dynamic: true}),
            })
            .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [ban.user]), true)
            .addField(channelLanguage.get('banEmbedExecutorTitle'), audits.entries.first().executor.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('banEmbedFooter', [current.id]),
                iconURL: ban.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('banEmbedReasonTitle'), reason);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};