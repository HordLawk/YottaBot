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

const {EmbedBuilder, PermissionsBitField, ButtonStyle, ComponentType} = require('discord.js');
const locale = require('../../locale');
const configs = require('../configs.js');
const { userBadgesString } = require('../utils');

module.exports = {
    name: 'guildMemberAdd',
    execute: async member => {
        if(member.partial) await member.fetch();
        if(!member.client.guildData.has(member.guild.id)) return;
        const channelLanguage = locale.get(member.client.guildData.get(member.guild.id).language);
        if(member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin') && (member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID)){
            const hook = await member.client.fetchWebhook(member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID, member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin').hookToken || member.client.guildData.get(member.guild.id).defaultLogsHookToken).catch(() => null);
            if(hook){
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setFooter({text: member.id})
                    .setTimestamp()
                    .setAuthor({
                        name: channelLanguage.get('memberjoinEmbedAuthor', [member.user.tag]),
                        iconURL: member.user.displayAvatarURL({dynamic: true}),
                    })
                    .setThumbnail(member.user.displayAvatarURL({dynamic: true}))
                    .setDescription(member.toString());
                const badges = userBadgesString(member.user);
                if(
                    badges
                    &&
                    member.guild.roles.everyone
                        .permissionsIn(hook.channelId)
                        .has(PermissionsBitField.Flags.UseExternalEmojis)
                ) embed.addField(channelLanguage.get('memberjoinEmbedBadgesTitle'), badges);
                embed.addField(channelLanguage.get('memberjoinEmbedCreationTitle'), channelLanguage.get('memberjoinEmbedCreationValue', [Math.round(member.user.createdTimestamp / 1000)]));
                if(
                    member.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuild)
                    &&
                    member.client.inviteUses.has(member.guild.id)
                    &&
                    (
                        member.client.guildData.get(member.guild.id).partner
                        ||
                        member.client.guildData.get(member.guild.id).premiumUntil
                    )
                ){
                    await member.guild.invites.fetch();
                    const invite = member.client.inviteUses.get(member.guild.id).find(e => {
                        return (
                            (
                                !e.expiresTimestamp
                                ||
                                (e.expiresTimestamp > Date.now())
                            )
                            &&
                            (
                                !member.guild.invites.cache.has(e.code)
                                ||
                                (member.guild.invites.cache.get(e.code).uses != e.uses)
                            )
                        );
                    });
                    member.client.inviteUses.set(member.guild.id, member.guild.invites.cache.mapValues(e => ({
                        code: e.code,
                        uses: e.uses,
                        expiresTimestamp: e.expiresTimestamp,
                        inviterId: e.inviterId,
                    })));
                    if(invite){
                        const inviter = await member.client.users.fetch(invite.inviterId);
                        embed.addFields({
                            name: channelLanguage.get('memberjoinEmbedInviteTitle'),
                            value: channelLanguage.get('memberjoinEmbedInviteValue', [invite.code, inviter]),
                        });
                    }
                }
                await hook.send({
                    embeds: [embed],
                    username: member.client.user.username,
                    avatarURL: member.client.user.avatarURL(),
                    components: [{
                        type: ComponentType.ActionRow,
                        components: [{
                            type: ComponentType.Button,
                            label: channelLanguage.get('banButton'),
                            customId: `banjoined${member.id}`,
                            style: ButtonStyle.Danger,
                            emoji: '🔨',
                        }],
                    }],
                });
            }
        }
        if(member.client.guildData.get(member.guild.id).welcomeHook){
            const hook = await member.client
                .fetchWebhook(
                    member.client.guildData.get(member.guild.id).welcomeHook._id,
                    member.client.guildData.get(member.guild.id).welcomeHook.token,
                )
                .catch(() => null);
            if(hook) await hook.send(channelLanguage.get('welcomeMessage', [member.user.username, member.id]));
        }
        const memberModel = require('../../schemas/member.js');
        let memberDoc = await memberModel.findOne({
            guild: member.guild.id,
            userID: member.id,
        });
        if(memberDoc?.autoBanned) return;
        const namebanModel = require('../../schemas/nameban.js');
        const namebanDocs = await namebanModel.find({guild: member.guild.id}).sort({createdAt: 1});
        if(namebanDocs.slice(0, configs.namebansLimits[+!!(
            member.client.guildData.get(member.guild.id).premiumUntil
            ||
            member.client.guildData.get(member.guild.id).partner
        )]).some(e => {
            const username = e.caseSensitive ? member.user.username : member.user.username.toLowerCase();
            return (username === e.text) || (e.partial && username.includes(e.text));
        })){
            if(memberDoc){
                memberDoc.autoBanned = true;
            }
            else{
                memberDoc = new memberModel({
                    guild: member.guild.id,
                    userID: member.id,
                    autoBanned: true,
                });
            }
            await memberDoc.save();
            return await member.ban({reason: channelLanguage.get('namebanReason')});
        }
        if(!member.client.guildData.get(member.guild.id).globalBan) return;
        const banCount = await memberModel.countDocuments({
            userID: member.id,
            relevantBan: true,
        });
        if(banCount < 3) return;
        if(memberDoc){
            memberDoc.autoBanned = true;
        }
        else{
            memberDoc = new memberModel({
                guild: member.guild.id,
                userID: member.id,
                autoBanned: true,
            });
        }
        await memberDoc.save();
        await member.ban({reason: channelLanguage.get('globalBanReason')});
    },
};