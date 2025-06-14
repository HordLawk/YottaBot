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

const Discord = require('discord.js')
const { handleEventError } = require('./utils.js');
const configs = require('./configs.js');
const events = require('./events');
const axios = require('axios');
const locale = require('../locale');
const commands = require('./commands');
const path = require('path');

Discord.EmbedBuilder.prototype.addField = function(name, value, inline = false){
    return this.addFields([{name, value, inline}]);
}
const client = new Discord.Client({
    partials: [
        Discord.Partials.Reaction,
        Discord.Partials.Message,
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.User,
    ],
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildInvites,
    ],
    allowedMentions: {repliedUser: false},
    failIfNotExists: false,
    presence: {activities: [{
        name: '/help',
        type: Discord.ActivityType.Listening,
    }]},
    makeCache: Discord.Options.cacheWithLimits({
        ...Discord.Options.DefaultMakeCacheSettings,
        GuildEmojiManager: 0,
        GuildScheduledEventManager: 0,
        GuildStickerManager: 0,
        StageInstanceManager: 0,
        ReactionManager: 0,
    }),
});
client.cooldowns = new Map();
client.xpcds = new Map();
client.lastdelmsg = new Map();
client.lastMoveAudit = new Map();
client.lastDisconnectAudit = new Map();
client.inviteUses = new Map();
client.bantimes = new Map();
eval(process.env.UNDOCUMENTED);
client.once('ready', async () => {
    const url = client.generateInvite({
        scopes: ['bot', 'applications.commands'],
        permissions: configs.permissions,
    });
    console.log(
        `Logged in as ${client.user.tag}!\n` +
        `Invite URL: ${url}`
    );
    const guildModel = require('../schemas/guild.js');
    const guildDocs = await guildModel.find({_id: {$in: [...client.guilds.cache.keys()]}});
    client.guildData = guildDocs.reduce((acc, e) => acc.set(e._id, e), new Discord.Collection());
    await client.application.fetch();
    const devGuild = client.guilds.cache.get(process.env.DEV_GUILD);
    const slashCommands = await (
        (process.env.NODE_ENV === 'production') ? client.application : devGuild
    ).commands.fetch();
    const deployCommand = commands.get('deploy');
    if(!slashCommands.some(e => (e.name === deployCommand.name))){
        await devGuild.commands.create({
            type: Discord.ApplicationCommandType.ChatInput,
            name: deployCommand.name,
            description: deployCommand.name,
            options: deployCommand.slashOptions,
        });
    }
    events.forEach(e => {
        client.on(
            e.name,
            async (...args) => {
                await e.execute(...args).catch(async err => await handleEventError(err, e, args, client));
            },
        );
    });
    if(process.env.NODE_ENV === 'production'){
        await client.shard.broadcastEval(async (c, {channelId, shardId, ping}) => {
            const channel = c.channels.cache.get(channelId);
            if(channel) await channel.send(`Shard ${shardId} connected with ping \`${ping}ms\`!`);
        }, {context: {
            channelId: configs.bootlog,
            shardId: client.shard.ids[0],
            ping: client.ws.ping,
        }});
        await client.guilds.cache.get(configs.supportID).members.fetch().catch(console.error);
    }
    const channelModel = require('../schemas/channel.js');
    // await channel.deleteMany({
    //     _id: {$nin: client.channels.cache.map(e => e.id)},
    //     guild: {$in: client.guilds.cache.map(e => e.id)},
    // });
    // const roleDocs = await role.find({guild: {$in: client.guilds.cache.map(e => e.id)}});
    // await role.deleteMany({_id: {$in: roleDocs.filter(e => !client.guilds.cache.get(e.guild).roles.cache.has(e.roleID)).map(e => e._id)}});
    const menuModel = require('../schemas/menu.js');
    const channelIds = (await client.shard.broadcastEval(c => [...c.channels.cache.keys()])).flat();
    await menuModel.deleteMany({channelID: {$nin: channelIds}});
    for(
        const guildId
        of client.guildData
            .filter(e => {
                return (
                    e.trackInvites
                    &&
                    (e.partner || e.premiumUntil)
                    &&
                    client.guilds.cache
                        .get(e._id)?.members.me.permissions
                        .has(Discord.PermissionsBitField.Flags.ManageGuild)
                )
            })
            .keys()
    ){
        const invites = await client.guilds.cache.get(guildId).invites.fetch().catch(() => new Discord.Collection());
        client.inviteUses.set(guildId, invites.mapValues(invite => ({
            code: invite.code,
            uses: invite.uses,
            expiresTimestamp: invite.expiresTimestamp,
            inviterId: invite.inviterId,
        })));
    }
    const guildVoiceXpCd = new Map();
    const logModel = require('../schemas/log.js');
    const unmuteTimer = async () => {
        const unmutes = await logModel.find({
            type: 'mute',
            duration: {$lte: Date.now()},
            ongoing: true,
        });
        if(!unmutes.length) return;
        const haveEnded = [];
        for(let unmuteDoc of unmutes){
            let guild = client.guilds.cache.get(unmuteDoc.guild);
            if(!guild) continue;
            haveEnded.push(unmuteDoc._id);
            let discordMember = await guild.members.fetch(unmuteDoc.target).catch(() => null);
            if(discordMember && discordMember.isCommunicationDisabled()) continue;
            let discordUser = discordMember?.user ?? await client.users.fetch(unmuteDoc.target).catch(() => {});
            let discordChannel = guild.channels.cache.get(client.guildData.get(guild.id).modlogs.mute);
            if(
                discordChannel
                &&
                discordChannel.viewable
                &&
                discordChannel.permissionsFor(guild.members.me).has(Discord.PermissionsBitField.Flags.SendMessages)
                &&
                discordChannel.permissionsFor(guild.members.me).has(Discord.PermissionsBitField.Flags.EmbedLinks)
            ){
                let guildLanguage = locale.get(client.guildData.get(guild.id).language);
                let embed = new Discord.EmbedBuilder()
                    .setColor(0x0000ff)
                    .setAuthor({
                        name: (
                            discordUser
                            ? guildLanguage.get('autoUnmuteEmbedAuthorMember', [discordUser.tag])
                            : guildLanguage.get('autoUnmuteEmbedAuthorNoMember')
                        ),
                        iconURL: discordUser?.displayAvatarURL({dynamic: true}),
                    })
                    .addField(
                        guildLanguage.get('autoUnmuteEmbedTargetTitle'),
                        guildLanguage.get('autoUnmuteEmbedTargetValue', [unmuteDoc.target]),
                        true,
                    )
                    .setTimestamp()
                    .addField(
                        guildLanguage.get('autoUnmuteEmbedReasonTitle'),
                        guildLanguage.get('autoUnmuteEmbedReasonValue'),
                    );
                let msg = await discordChannel.messages.fetch({message: unmuteDoc.logMessage}).catch(() => null);
                if(msg) embed.setDescription(guildLanguage.get('autoUnmuteEmbedDescription', [msg.url]));
                await discordChannel.send({embeds: [embed]});
            };
        }
        await logModel.updateMany({_id: {$in: haveEnded}}, {$set: {ongoing: false}});
    }
    const removePremium = currentGuild => {
        currentGuild.premiumUntil = null;
        currentGuild.patron = null;
        currentGuild.renewPremium = false;
    }
    const searchPledge = async (url, patron) => {
        const pledges = await axios({
            method: 'GET',
            url: url,
            headers: {Authorization: `Bearer ${process.env.PATREON_TOKEN}`},
        }).then(res => res.data);
        const patreonUser = pledges.included.find(e => {
            return (e.type === 'user') && (e.attributes.social_connections.discord?.user_id === patron);
        });
        if(!patreonUser){
            if(!pledges.links.next) return null;
            return await searchPledge(pledges.links.next, patron);
        }
        return pledges.data.find(e => ((e.type === 'pledge') && (e.relationships.patron.data.id === patreonUser.id)));
    }
    const unpremiumTimer = async () => {
        const now = new Date();
        const endedPremium = client.guildData.filter(data => (data.premiumUntil < now));
        if(!endedPremium.size) return;
        const rewardTotal = {
            '8304182': 1,
            '8307567': 2,
            '8307569': 3,
        };
        const nextRenewal = new Date(now.getTime() + (32 * 24 * 60 * 60 * 1000));
        const haveRenewed = [];
        const haveEnded = [];
        for([guildId, guildData] of endedPremium){
            if(!guildData.patron || !guildData.renewPremium || !client.guilds.cache.has(guildId)){
                removePremium(guildData);
                haveEnded.push(guildId);
                continue;
            }
            const pledge = await searchPledge(
                'https://www.patreon.com/api/oauth2/api/campaigns/8230487/pledges',
                guildData.patron,
            );
            if(!pledge){
                removePremium(guildData);
                haveEnded.push(guildId);
                continue;
            }
            const patronCount = (
                await client.shard.broadcastEval(
                    (c, {patronId}) => c.guildData.filter(data => (data.patron === patronId)).size,
                    {context: {patronId: guildData.patron}},
                )
            ).reduce((acc, e) => acc + e, 0);
            if(patronCount > rewardTotal[pledge.relationships.reward.data.id]){
                removePremium(guildData);
                haveEnded.push(guildId);
                continue;
            }
            guildData.premiumUntil = nextRenewal;
            haveRenewed.push(guildId);
        }
        await guildModel.updateMany({_id: {$in: haveRenewed}}, {$set: {premiumUntil: nextRenewal}});
        await guildModel.updateMany({_id: {$in: haveEnded}}, {$set: {
            premiumUntil: null,
            patron: null,
            renewPremium: false,
        }});
    }
    const userModel = require('../schemas/user.js');
    const renewBoost = async () => {
        if(process.env.NODE_ENV !== 'production') return;
        const endedBoost = await userModel.find({boostUntil: {$lt: Date.now()}});
        if(!endedBoost.length) return;
        for(userDoc of endedBoost){
            const premiumSince = await client.shard.broadcastEval(async (c, {guildId, userId, localePath}) => {
                const locale = require(localePath);
                const guild = c.guilds.cache.get(guildId);
                if(!guild) return;
                const member = await guild.members.fetch(userId).catch(() => null);
                if(member?.premiumSince){
                    await member.send(locale.get('en').get('renewBoost', [guild.name])).catch(() => {});
                }
                return member?.premiumSinceTimestamp;
            }, {context: {
                guildId: configs.supportID,
                userId: userDoc._id,
                localePath: path.join(__dirname, '..', 'locale'),
            }});
            if(premiumSince){
                userDoc.boostUntil = new Date(userDoc.boostUntil.getTime() + (30 * 24 * 60 * 60 * 1000));
                userDoc.premiumKeys++;
            }
            else{
                userDoc.boostUntil = null;
            }
            userDoc.save();
        }
    }
    const roleModel = require('../schemas/role.js');
    const memberModel = require('../schemas/member.js');
    const earnVoiceXp = async () => {
        const voiceGuilds = await guildModel.find({
            _id: {$in: client.guilds.cache.map(e => e.id)},
            voiceXpCooldown: {$ne: null},
        });
        for(let voiceGuild of voiceGuilds){
            let discordGuild = client.guilds.cache.get(voiceGuild._id);
            let ignoredChannels = await channelModel.find({
                _id: {
                    $in: discordGuild.channels.cache
                        .filter(e => (e.type === Discord.ChannelType.GuildVoice))
                        .map(e => e.id),
                },
                ignoreXp: true,
            });
            let roleDocs = await roleModel.find({
                guild: voiceGuild._id,
                roleID: {$in: discordGuild.roles.cache.map(e => e.id)},
            });
            try{
                await discordGuild.members.fetch({user: discordGuild.voiceStates.cache.map(e => e.id)});
            }
            catch(_){
                // This shouldn't happen and I don't know why it occasionally does, therefore I'll only investigate
                // further when people start complaining about it.
                continue;
            }
            let inVoice = discordGuild.voiceStates.cache.filter(e => {
                return (
                    e.channel
                    &&
                    !e.deaf
                    &&
                    !e.mute
                    &&
                    !e.member.user.bot
                    &&
                    (e.channel.members.filter(ee => !ee.voice.deaf && !ee.voice.mute && !ee.user.bot).size > 1)
                    &&
                    !ignoredChannels.some(ee => (ee._id === e.channel.id))
                    &&
                    !roleDocs.some(ee => e.member.roles.cache.has(ee.roleID) && ee.ignoreXp)
                );
            });
            if(!guildVoiceXpCd.has(voiceGuild._id)){
                guildVoiceXpCd.set(voiceGuild._id, inVoice.mapValues(() => 0));
                continue;
            }
            for(let [id, minutes] of guildVoiceXpCd.get(voiceGuild._id).filter((_, i) => inVoice.has(i))){
                guildVoiceXpCd.get(voiceGuild._id).set(id, ++minutes);
                if(minutes % voiceGuild.voiceXpCooldown) continue;
                let discordMember = inVoice.get(id).member;
                let multiplier = (
                    roleDocs
                        .filter(e => (e.xpMultiplier && discordMember.roles.cache.has(e.roleID)))
                        .sort((a, b) => (b.xpMultiplier - a.xpMultiplier))[0]?.xpMultiplier
                    ??
                    1
                );
                let doc = await memberModel.findOneAndUpdate({
                    guild: voiceGuild._id,
                    userID: id,
                }, {$inc: {xp: multiplier}}, {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                });
                let lowerRoles = roleDocs
                    .filter(e => (discordGuild.roles.cache.get(e.roleID).editable && e.xp && (e.xp <= doc.xp)))
                    .sort((a, b) => (b.xp - a.xp));
                if(!lowerRoles.length || discordMember.roles.cache.has(lowerRoles[0].roleID)) continue;
                await discordMember.roles.set(
                    discordMember.roles.cache
                        .map(e => e.id)
                        .filter(e => !lowerRoles.some(ee => (e === ee.roleID)))
                        .concat(
                            lowerRoles
                                .map(e => e.roleID)
                                .slice(0, client.guildData.get(voiceGuild._id).dontStack ? 1 : undefined),
                        ),
                );
                if(!client.guildData.get(voiceGuild._id).xpChannel || (doc.xp >= (lowerRoles[0].xp + multiplier))){
                    continue;
                }
                let guildLanguage = locale.get(client.guildData.get(voiceGuild._id).language);
                switch(client.guildData.get(voiceGuild._id).xpChannel){
                    case 'default': {
                        const voiceChannel = inVoice.get(id).channel;
                        if(
                            voiceChannel.viewable
                            &&
                            discordGuild.members.me
                                .permissionsIn(voiceChannel)
                                .has(Discord.PermissionsBitField.Flags.SendMessages)
                        ){
                            await voiceChannel.send({
                                content: guildLanguage.get(
                                    'achieveGuild',
                                    [discordMember, discordGuild.roles.cache.get(lowerRoles[0].roleID)],
                                ),
                                allowedMentions: {users: [discordMember.id]},
                            });
                        }
                    }
                    break;
                    case 'dm': {
                        await discordMember
                            .send(
                                guildLanguage.get(
                                    'achieveDM',
                                    [discordGuild.roles.cache.get(lowerRoles[0].roleID).name, discordGuild.name],
                                ),
                            )
                            .catch(() => null);
                    }
                    break;
                    default: {
                        let notifChannel = discordGuild.channels.cache.get(
                            client.guildData.get(voiceGuild._id).xpChannel,
                        );
                        if(
                            notifChannel
                            &&
                            notifChannel.viewable
                            &&
                            discordGuild.members.me
                                .permissionsIn(notifChannel)
                                .has(Discord.PermissionsBitField.Flags.SendMessages)
                        ){
                            await notifChannel.send({
                                content: guildLanguage.get(
                                    'achieveGuild',
                                    [discordMember, discordGuild.roles.cache.get(lowerRoles[0].roleID)],
                                ),
                                allowedMentions: {users: [discordMember.id]},
                            });
                        }
                    }
                }
            }
            guildVoiceXpCd.set(voiceGuild._id, inVoice.mapValues(() => 0).concat(guildVoiceXpCd.get(voiceGuild._id)));
        }
    }
    const clearCache = () => {
        client.xpcds.forEach((guildXpCd, guildId) => {
            guildXpCd.forEach((memberXpCd, memberId) => {
                if((memberXpCd + (60 * 1000)) < Date.now()) guildXpCd.delete(memberId);
            });
            if(!guildXpCd.size) client.xpcds.delete(guildId);
        });
        client.bantimes.forEach((membersBantimes, guildId) => {
            membersBantimes.forEach((bantimes, memberId) => {
                const activeBantimes = bantimes.filter(bantime => (bantime > (Date.now() - (10 * 1000))));
                if(activeBantimes.length) return membersBantimes.set(memberId, activeBantimes);
                membersBantimes.delete(memberId);
            });
            if(!membersBantimes.size) client.bantimes.delete(guildId);
        });
        // const ramIsFull = () => (process.memoryUsage.rss() > (320 * 1_024 * 1_024));
        // if(ramIsFull()){
        //     console.log(`RAM at ${process.memoryUsage.rss() / (1024 * 1024)} MB - Sweeping ${client.guilds.cache.reduce((acc, g) => acc + g.members.cache.size, 0)} members...`);
        //     const swept = client.sweepers.sweepGuildMembers(member => ((member.id !== client.user.id) && ramIsFull()));
        //     console.log(`Swept ${swept} members - RAM at ${process.memoryUsage.rss() / (1024 * 1024)} MB`);
        // }
    }
    const tick = i => {
        setTimeout(() => {
            unmuteTimer();
            unpremiumTimer();
            renewBoost();
            if((i % 6) === 0){
                earnVoiceXp();
                clearCache();
            }
            tick(++i);
        }, 10000);
    }
    tick(0);
});
process.on('unhandledRejection', async error => {
    console.error('Unhandled promise rejection:', error);
    try{
        if(process.env.NODE_ENV === 'production'){
            await client.shard.broadcastEval(async (c, {channelId, errorMessage, errorStack}) => {
                const channel = c.channels.cache.get(channelId);
                if(channel) await channel.send({
                    content: `Error: *${errorMessage}*`,
                    files: [{
                        name: 'stack.log',
                        attachment: Buffer.from(errorStack),
                    }],
                }).catch(console.error);
            }, {context: {
                channelId: configs.errorlog,
                errorMessage: error.message,
                errorStack: error.stack,
            }}).catch(console.error);
        }
    }
    catch(err){
        console.error(err);
    }
});
client.login();