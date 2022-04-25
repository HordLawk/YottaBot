const user = require('../../schemas/user.js');
const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions, GuildAuditLogs} = require('discord.js');

module.exports = {
    name: 'guildMemberUpdate',
    execute: async (oldMember, newMember) => {
        if(!newMember.guild.available) return;
        if(newMember.partial) await newMember.fetch();
        if(!oldMember.partial && (oldMember.premiumSinceTimestamp != newMember.premiumSinceTimestamp)){
            if((newMember.guild.id != newMember.client.configs.supportID) || oldMember.premiumSince || !newMember.premiumSince) return;
            const userDoc = await user.findById(newMember.id);
            if(userDoc?.boostUntil) return;
            await user.findByIdAndUpdate(newMember.id, {
                $inc: {premiumKeys: 1},
                $set: {boostUntil: new Date(Date.now() + 2592000000)},
            }, {
                upsert: true,
                setDefaultsOnInsert: true,
                new: true,
            });
            newMember.send(newMember.client.langs[newMember.client.guildData.get(newMember.client.configs.supportID).language].get('firstBoost', [newMember, newMember.guild.name])).catch(() => null);
        }
        else{
            if(!newMember.guild.me.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG) || !newMember.client.guildData.has(newMember.guild.id)) return;
            const audits = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: GuildAuditLogs.Actions.MEMBER_UPDATE,
            });
            if(!audits.entries.size || audits.entries.first().executor.bot) return;
            if(audits.entries.first().changes?.some((e) => (e.key === "communication_disabled_until"))){
                const reason = audits.entries.first().reason?.slice(0, 500);
                const guildDoc = await guild.findByIdAndUpdate(newMember.guild.id, {$inc: {counterLogs: 1}});
                newMember.client.guildData.get(newMember.guild.id).counterLogs = guildDoc.counterLogs + 1;
                const discordChannel = newMember.guild.channels.cache.get(newMember.client.guildData.get(newMember.guild.id).modlogs.mute);
                const channelLanguage = newMember.client.langs[newMember.client.guildData.get(newMember.guild.id).language];
                if(newMember.isCommunicationDisabled()){
                    const duration = Math.round((newMember.communicationDisabledUntilTimestamp - audits.entries.first().createdTimestamp) / 60000);
                    const current = new log({
                        id: guildDoc.counterLogs,
                        guild: newMember.guild.id,
                        type: 'mute',
                        target: newMember.id,
                        executor: audits.entries.first().executor.id,
                        timeStamp: audits.entries.first().createdAt,
                        reason: reason,
                        ongoing: true,
                        duration: newMember.communicationDisabledUntil,
                    });
                    await current.save();
                    if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(newMember.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(newMember.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
                    const d = Math.floor(duration / 1440);
                    const h = Math.floor((duration % 1440) / 60);
                    const m = Math.floor(duration % 60);
                    const embed = new MessageEmbed()
                        .setTimestamp()
                        .setColor(0xff8000)
                        .setAuthor({
                            name: channelLanguage.get('muteEmbedAuthor', [audits.entries.first().executor.tag, newMember.user.tag]),
                            iconURL: newMember.user.displayAvatarURL({dynamic: true}),
                        })
                        .addField(channelLanguage.get('muteEmbedTargetTitle'), channelLanguage.get('muteEmbedTargetValue', [newMember]), true)
                        .addField(channelLanguage.get('muteEmbedExecutorTitle'), audits.entries.first().executor.toString(), true)
                        .addField(channelLanguage.get('muteEmbedDurationTitle'), channelLanguage.get('muteEmbedDurationValue', [d, h, m, Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)]), true)
                        .setFooter({
                            text: channelLanguage.get('muteEmbedFooter', [current.id]),
                            iconURL: newMember.guild.iconURL({dynamic: true}),
                        });
                    if(reason) embed.addField(channelLanguage.get('muteEmbedReasonTitle'), reason);
                    const msg = await discordChannel.send({embeds: [embed]});
                    current.logMessage = msg.id;
                    await current.save();
                }
                else{
                    const mute = await log.findOneAndUpdate({
                        guild: newMember.guild.id,
                        target: newMember.id,
                        ongoing: true,
                        type: 'mute',
                    }, {$set: {ongoing: false}});
                    if(!mute) return;
                    const current = new log({
                        id: guildDoc.counterLogs,
                        guild: newMember.guild.id,
                        type: 'mute',
                        target: newMember.id,
                        executor: audits.entries.first().executor.id,
                        timeStamp: audits.entries.first().createdAt,
                        reason: reason,
                        removal: true,
                    });
                    await current.save();
                    if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(newMember.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(newMember.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
                    const embed = new MessageEmbed()
                        .setColor(0x0000ff)
                        .setAuthor({
                            name: channelLanguage.get('unmuteEmbedAuthor', [audits.entries.first().executor.tag, newMember.user.tag]),
                            iconURL: newMember.user.displayAvatarURL({dynamic: true}),
                        })
                        .addField(channelLanguage.get('unmuteEmbedTargetTitle'), channelLanguage.get('unmuteEmbedTargetValue', [newMember.id]), true)
                        .addField(channelLanguage.get('unmuteEmbedExecutorTitle'), audits.entries.first().executor.toString(), true)
                        .setTimestamp()
                        .setFooter({
                            text: channelLanguage.get('unmuteEmbedFooter', [current.id]),
                            iconURL: newMember.guild.iconURL({dynamic: true}),
                        });
                    if(reason) embed.addField(channelLanguage.get('unmuteEmbedReasonTitle'), reason);
                    const msg = await discordChannel.send({embeds: [embed]});
                    current.logMessage = msg.id;
                    await current.save();
                }
            }
        }
    },
};