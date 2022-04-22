const {MessageEmbed, Permissions, GuildAuditLogs} = require('discord.js');
const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const role = require('../../schemas/role.js');

module.exports = {
    name: 'guildMemberRemove',
    execute: async member => {
        if(member.partial) member = await member.fetch().catch(() => null);
        if(!member || (member.id === member.client.user.id) || !member.client.guildData.has(member.guild.id)) return;
        const channelLanguage = member.client.langs[member.client.guildData.get(member.guild.id).language];
        if(member.client.guildData.get(member.guild.id).actionlogs.id('memberleave') && (member.client.guildData.get(member.guild.id).actionlogs.id('memberleave').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID)){
            const roleDoc = await role.findOne({
                guild: member.guild.id,
                roleID: {$in: member.roles.cache.map(e => e.id)},
                ignoreActions: 'memberleave',
            });
            if(!roleDoc){
                const hook = await member.client.fetchWebhook(member.client.guildData.get(member.guild.id).actionlogs.id('memberleave').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID, member.client.guildData.get(member.guild.id).actionlogs.id('memberleave').hookToken || member.client.guildData.get(member.guild.id).defaultLogsHookToken).catch(() => null);
                if(hook){
                    const embed = new MessageEmbed()
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
                    if(member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) embed.addField(channelLanguage.get('memberleaveEmbedMembershipTitle'), channelLanguage.get('memberleaveEmbedMembershipValue', [member.pending]), true);
                    if(member.user.flags.bitfield || member.user.bot){
                        const badges = {
                            DISCORD_EMPLOYEE: '<:staff:967043602012315658>',
                            PARTNERED_SERVER_OWNER: '<:partner:967043547561852978>',
                            HYPESQUAD_EVENTS: '<:hs:967048946612572160>',
                            BUGHUNTER_LEVEL_1: '<:bughunter:967043119407329311>',
                            HOUSE_BRAVERY: '<:bravery:967043119780610058>',
                            HOUSE_BRILLIANCE: '<:brilliance:967043119780597860>',
                            HOUSE_BALANCE: '<:balance:967043119809974272>',
                            EARLY_SUPPORTER: '<:earlysupporter:967043119717699665>',
                            BUGHUNTER_LEVEL_2: '<:bughunter2:967043119759642694>',
                            EARLY_VERIFIED_BOT_DEVELOPER: '<:botdev:967043120984391752>',
                            DISCORD_CERTIFIED_MODERATOR: '<:mod:967043119788994610>',
                            VERIFIED_BOT: '<:verifiedbot:967049829568090143>',
                        };
                        const userBadges = member.user.flags.toArray().map(e => badges[e]);
                        if(!member.user.flags.has('VERIFIED_BOT') && member.user.bot) userBadges.push('<:bot:967062591190995004>');
                        embed.addField(channelLanguage.get('memberjoinEmbedBadgesTitle'), userBadges.join(' '), true);
                    }
                    embed.addField(channelLanguage.get('memberleaveEmbedJoinedTitle'), channelLanguage.get('memberleaveEmbedJoinedValue', [Math.round(member.joinedTimestamp / 1000)]));
                    if(member.communicationDisabledUntilTimestamp > Date.now()) embed.addField(channelLanguage.get('memberleaveEmbedTimeoutTitle'), channelLanguage.get('memberleaveEmbedTimeoutValue', [Math.round(member.communicationDisabledUntilTimestamp / 1000)]));
                    if(member.premiumSince) embed.addField(channelLanguage.get('memberleaveEmbedBoostTitle'), channelLanguage.get('memberleaveEmbedBoostValue', [Math.round(member.premiumSinceTimestamp) / 1000]));
                    const memberRoles = member.roles.cache.filter(e => (e.id != member.guild.id));
                    if(memberRoles.size) embed.addField(channelLanguage.get('memberleaveEmbedRolesTitle'), channelLanguage.get('memberleaveEmbedRolesValue', [memberRoles]));
                    await hook.send({
                        embeds: [embed],
                        username: member.client.user.username,
                        avatarURL: member.client.user.avatarURL(),
                    });
                }
            }
        }
        if(!member.guild.me.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG)) return;
        const audits = await member.guild.fetchAuditLogs({limit: 1});
        if((audits.entries.first()?.action != GuildAuditLogs.Actions.MEMBER_KICK) || (audits.entries.first()?.target.id != member.id) || audits.entries.first()?.executor.bot) return;
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
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(member.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(member.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const embed = new MessageEmbed()
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