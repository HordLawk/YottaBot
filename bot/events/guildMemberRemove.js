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

const {EmbedBuilder, PermissionsBitField, GuildFeature, AuditLogEvent} = require('discord.js');
const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const role = require('../../schemas/role.js');
const locale = require('../../locale');
const { userBadgesString } = require('../utils.js');

module.exports = {
    name: 'guildMemberRemove',
    execute: async member => {
        if(member.partial) member.user = await member.client.users.fetch(member.id).catch(() => null);
        if(!member || !member.user || (member.id === member.client.user.id) || !member.client.guildData.has(member.guild.id)) return;
        const channelLanguage = locale.get(member.client.guildData.get(member.guild.id).language);
        if(member.client.guildData.get(member.guild.id).actionlogs.id('memberleave') && (member.client.guildData.get(member.guild.id).actionlogs.id('memberleave').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID)){
            const roleDoc = await role.findOne({
                guild: member.guild.id,
                roleID: {$in: member.roles.cache.map(e => e.id)},
                ignoreActions: 'memberleave',
            });
            if(!roleDoc){
                const hook = await member.client.fetchWebhook(member.client.guildData.get(member.guild.id).actionlogs.id('memberleave').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID, member.client.guildData.get(member.guild.id).actionlogs.id('memberleave').hookToken || member.client.guildData.get(member.guild.id).defaultLogsHookToken).catch(() => null);
                if(hook){
                    const embed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setFooter({text: member.id})
                        .setTimestamp()
                        .setAuthor({
                            name: channelLanguage.get('memberleaveEmbedAuthor', [member.user.tag]),
                            iconURL: member.user.displayAvatarURL({dynamic: true}),
                        })
                        .setThumbnail(member.user.displayAvatarURL({dynamic: true}))
                        .setDescription(member.toString());
                    if(member.nickname) embed.addField(channelLanguage.get('memberleaveEmbedNickTitle'), member.nickname, true);
                    const badges = userBadgesString(member.user);
                    if(
                        badges
                        &&
                        member.guild.roles.everyone
                            .permissionsIn(hook.channelId)
                            .has(PermissionsBitField.Flags.UseExternalEmojis)
                    ) embed.addField(channelLanguage.get('memberjoinEmbedBadgesTitle'), badges, true);
                    if(member.guild.features.includes(GuildFeature.MemberVerificationGateEnabled) && !member.partial) embed.addField(channelLanguage.get('memberleaveEmbedMembershipTitle'), channelLanguage.get('memberleaveEmbedMembershipValue', [member.pending]), true);
                    if(member.joinedTimestamp) embed.addField(channelLanguage.get('memberleaveEmbedJoinedTitle'), channelLanguage.get('memberleaveEmbedJoinedValue', [Math.round(member.joinedTimestamp / 1000)]));
                    if(member.communicationDisabledUntilTimestamp > Date.now()) embed.addField(channelLanguage.get('memberleaveEmbedTimeoutTitle'), channelLanguage.get('memberleaveEmbedTimeoutValue', [Math.round(member.communicationDisabledUntilTimestamp / 1000)]));
                    if(member.premiumSince) embed.addField(channelLanguage.get('memberleaveEmbedBoostTitle'), channelLanguage.get('memberleaveEmbedBoostValue', [Math.round(member.premiumSinceTimestamp / 1000)]));
                    const memberRoles = member.roles.cache.filter(e => (e.id !== member.guild.id));
                    if(memberRoles.size) embed.addField(channelLanguage.get('memberleaveEmbedRolesTitle'), channelLanguage.get('memberleaveEmbedRolesValue', [memberRoles]));
                    await hook.send({
                        embeds: [embed],
                        username: member.client.user.username,
                        avatarURL: member.client.user.avatarURL(),
                    });
                }
            }
        }
        if(!member.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return;
        const audits = await member.guild.fetchAuditLogs({limit: 1}).catch(() => null);
        if(!audits || (audits.entries.first()?.action != AuditLogEvent.MemberKick) || (audits.entries.first()?.target.id !== member.id) || audits.entries.first()?.executor.bot) return;
        const reason = audits.entries.first().reason?.slice(0, 500);
        const guildDoc = await guild.findByIdAndUpdate(member.guild.id, {$inc: {counterLogs: 1}});
        member.client.guildData.get(member.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: member.guild.id,
            type: 'kick',
            target: member.id,
            executor: audits.entries.first().executor.id,
            timeStamp: audits.entries.first().createdAt,
            reason: reason,
        });
        await current.save();
        const discordChannel = member.guild.channels.cache.get(member.client.guildData.get(member.guild.id).modlogs.kick);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(member.guild.members.me).has(PermissionsBitField.Flags.SendMessages) || !discordChannel.permissionsFor(member.guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)) return;
        const embed = new EmbedBuilder()
            .setColor(0xffbf00)
            .setAuthor({
                name: channelLanguage.get('kickEmbedAuthor', [audits.entries.first().executor.tag, member.user.tag]),
                iconURL: member.user.displayAvatarURL({dynamic: true}),
            })
            .addField(channelLanguage.get('kickEmbedTargetTitle'), channelLanguage.get('kickEmbedTargetValue', [member, member.id]), true)
            .addField(channelLanguage.get('kickEmbedExecutorTitle'), audits.entries.first().executor.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('kickEmbedFooter', [current.id]),
                iconURL: member.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('kickEmbedReasonTitle'), reason);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};
