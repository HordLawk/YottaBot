const memberModel = require('../../schemas/member.js');
const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const role = require('../../schemas/role.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    execute: async member => {
        if(member.partial) await member.fetch();
        const channelLanguage = member.client.langs[member.client.guildData.get(member.guild.id).language];
        if(member.client.guildData.has(member.guild.id) && member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin') && (member.client.guildData.get(member.guild.id).actionlogs.id('delmsg').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID)){
            const hook = await member.client.fetchWebhook(member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID, member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin').hookToken || member.client.guildData.get(member.guild.id).defaultLogsHookToken).catch(() => null);
            if(hook){
                const embed = new MessageEmbed()
                    .setColor(0x00ff00)
                    .setFooter({text: member.id})
                    .setTimestamp()
                    .setAuthor({
                        name: channelLanguage.get('memberjoinEmbedAuthor'),
                        iconURL: member.user.displayAvatarURL({dynamic: true}),
                    })
                    .setThumbnail(member.user.displayAvatarURL({dynamic: true}))
                    .setDescription(member.toString())
                    .addField(channelLanguage.get('memberjoinEmbedCreationTitle'), channelLanguage.get('memberjoinEmbedCreationValue', [Math.round(member.user.createdTimestamp / 1000)]), true);
                const msg = await hook.send({
                    embeds: [embed],
                    username: member.client.user.username,
                    avatarURL: member.client.user.avatarURL(),
                    components: [{
                        type: 'ACTION_ROW',
                        components: [{
                            type: 'BUTTON',
                            label: channelLanguage.get('banButton'),
                            customId: 'ban',
                            style: 'DANGER',
                            emoji: '🔨',
                        }]
                    }]
                });
                const collector = msg.createMessageComponentCollector({
                    time: 600000,
                    componentType: 'BUTTON',
                });
                collector.on('collect', i => (async i => {
                    if(!i.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)){
                        const roles = await role.find({
                            guild: member.guild.id,
                            roleID: {$in: i.member.roles.cache.map(e => e.id)},
                            "commandPermissions._id": 'ban',
                        });
                        if((!roles.length && !i.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) || (roles.length && roles.some(e => !e.commandPermissions.id('ban').allow) && !roles.some(e => e.commandPermissions.id('ban').allow))) return await i.reply({
                            content: channelLanguage.get('forbidden'),
                            ephemeral: true,
                        });
                    }
                    if(member.guild.members.cache.has(member.id)){
                        if(!member.bannable) return await i.reply({
                            content: channelLanguage.get('cantBan'),
                            ephemeral: true,
                        });
                        if(i.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return await i.reply({
                            content: channelLanguage.get('youCantBan'),
                            ephemeral: true,
                        });
                        await member.send(channelLanguage.get('dmBanned', [member.guild.name])).catch(() => null);
                    }
                    else{
                        const ban = await member.guild.bans.fetch(member.id).catch(() => null);
                        if(ban) return await i.reply({
                            content: channelLanguage.get('alreadyBanned'),
                            ephemeral: true,
                        });
                    }
                    const newban = await member.guild.members.ban(member.id, {
                        reason: channelLanguage.get('banReason', [i.user.tag]),
                        days: member.client.guildData.get(member.guild.id).pruneBan,
                    }).catch(() => null);
                    if(!newban) return await i.reply({
                        content: channelLanguage.get('cantBan'),
                        ephemeral: true,
                    });
                    const guildDoc = await guild.findByIdAndUpdate(member.guild.id, {$inc: {counterLogs: 1}});
                    member.client.guildData.get(member.guild.id).counterLogs = guildDoc.counterLogs + 1;
                    const current = new log({
                        id: guildDoc.counterLogs,
                        guild: member.guild.id,
                        type: 'ban',
                        target: member.id,
                        executor: i.user.id,
                        timeStamp: Date.now(),
                        actionMessage: msg.url,
                    });
                    await current.save();
                    const reply = await i.reply({
                        content: channelLanguage.get('memberBanSuccess', [current.id]),
                        ephemeral: true,
                        fetchReply: true,
                    });
                    const discordChannel = member.guild.channels.cache.get(member.client.guildData.get(member.guild.id).modlogs.ban);
                    let banLogMsg;
                    if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(member.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) && discordChannel.permissionsFor(member.guild.me).has(Permissions.FLAGS.EMBED_LINKS)){
                        const banLogEmbed = new MessageEmbed()
                            .setColor(0xff0000)
                            .setAuthor({
                                name: channelLanguage.get('banEmbedAuthor', [i.user.tag, member.user.tag]),
                                iconURL: member.user.displayAvatarURL({dynamic: true}),
                            })
                            .setDescription(channelLanguage.get('banEmbedDescription', [msg.url]))
                            .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [member.user]), true)
                            .addField(channelLanguage.get('banEmbedExecutorTitle'), i.user.toString(), true)
                            .setTimestamp()
                            .setFooter({
                                text: channelLanguage.get('banEmbedFooter', [current.id]),
                                iconURL: member.guild.iconURL({dynamic: true}),
                            });
                        banLogMsg = await discordChannel.send({embeds: [banLogEmbed]});
                        current.logMessage = banLogMsg.id;
                        await current.save();
                    }
                    const buttonUndo = {
                        type: 'BUTTON',
                        label: channelLanguage.get('undo'),
                        customId: 'undo',
                        style: 'DANGER',
                        emoji: '↩️',
                    };
                    // const buttonEdit = {
                    //     type: 'BUTTON',
                    //     label: channelLanguage.get('editReason'),
                    //     customId: 'edit',
                    //     style: 'PRIMARY',
                    //     emoji: '✏️',
                    // };
                    await i.editReply({components: [{
                        type: 'ACTION_ROW',
                        // components: [buttonEdit, buttonUndo],
                        components: [buttonUndo],
                    }]});
                    const collectorUndo = reply.createMessageComponentCollector({
                        filter: componentInteraction => ((componentInteraction.user.id === i.user.id) && (componentInteraction.customId === 'undo')),
                        idle: 10000,
                        max: 1,
                        componentType: 'BUTTON',
                    });
                    collectorUndo.on('end', async collected => {
                        buttonUndo.disabled = true;
                        // reply.edit({components: [{
                        //     type: 'ACTION_ROW',
                        //     components: [buttonEdit, buttonUndo],
                        // }]});
                        await i.editReply({components: [{
                            type: 'ACTION_ROW',
                            components: [buttonUndo],
                        }]});
                        if(!collected.size) return;
                        const unban = await member.guild.members.unban(member.id, channelLanguage.get('unbanAuditReason', [i.user.tag])).catch(() => {});
                        if(!unban) return;
                        const guildDocUnban = await guild.findByIdAndUpdate(member.guild.id, {$inc: {counterLogs: 1}});
                        member.client.guildData.get(member.guild.id).counterLogs = guildDocUnban.counterLogs + 1;
                        const currentUnban = new log({
                            id: guildDocUnban.counterLogs,
                            guild: member.guild.id,
                            type: 'ban',
                            target: member.id,
                            executor: i.user.id,
                            timeStamp: Date.now(),
                            removal: true,
                        });
                        await currentUnban.save();
                        const action = await collected.first().reply({
                            content: channelLanguage.get('unbanSuccess', [currentUnban.id]),
                            fetchReply: true,
                        });
                        currentUnban.actionMessage = action.url;
                        await currentUnban.save();
                        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(member.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(member.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
                        const embedUnban = new MessageEmbed()
                            .setColor(0x00ff00)
                            .setAuthor({
                                name: channelLanguage.get('unbanEmbedAuthor', [i.user.tag, member.user.tag]),
                                iconURL: member.user.displayAvatarURL({dynamic: true}),
                            })
                            .setDescription(channelLanguage.get('unbanEmbedDescription', [action.url]))
                            .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [member.user]), true)
                            .addField(channelLanguage.get('unbanEmbedExecutorTitle'), i.user.toString(), true)
                            .setTimestamp()
                            .setFooter({
                                text: channelLanguage.get('unbanEmbedFooter', [currentUnban.id]),
                                iconURL: member.guild.iconURL({dynamic: true}),
                            });
                        const msgUnban = await discordChannel.send({embeds: [embedUnban]});
                        currentUnban.logMessage = msgUnban.id;
                        await currentUnban.save();
                    });
                    // const collectorEdit = reply.createMessageComponentCollector({
                    //     filter: componentInteraction => ((componentInteraction.user.id === i.user.id) && (componentInteraction.customId === 'edit')),
                    //     time: 60000,
                    //     componentType: 'BUTTON',
                    // });
                    // collectorEdit.on('collect', i => {
                        
                    // });
                    // collectorEdit.end('end', collected => {
                    //     buttonEdit.disabled = true;
                    //     await reply.editReply({components: [{
                        //     type: 'ACTION_ROW',
                        //     components: [buttonEdit, buttonUndo],
                        // }]});
                    // })
                })(i).catch(err => member.client.handlers.button(err, i)));
                collector.on('end', () => {
                    hook.editMessage(msg, {components: [{
                        type: 'ACTION_ROW',
                        components: [{
                            type: 'BUTTON',
                            label: channelLanguage.get('banButton'),
                            customId: 'ban',
                            style: 'DANGER',
                            emoji: '🔨',
                            disabled: true,
                        }],
                    }]});
                });
            }
        }
        if(!member.client.guildData.get(member.guild.id)?.globalBan) return;
        let memberDoc = await memberModel.findOne({
            guild: member.guild.id,
            userID: member.id,
        });
        if(memberDoc?.autoBanned) return;
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