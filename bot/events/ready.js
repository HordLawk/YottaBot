const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const menu = require('../../schemas/menu.js');
const log = require('../../schemas/log.js');
const guildModel = require('../../schemas/guild.js');
const user = require('../../schemas/user.js');
const member = require('../../schemas/member.js');
const {EmbedBuilder, Collection, PermissionsBitField, ActivityType, ChannelType} = require('discord.js');
const {AutoPoster} = require('topgg-autoposter');
const axios = require('axios');
const locale = require('../../locale');
const configs = require('../configs.js');

module.exports = {
    name: 'ready',
    execute: async client => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity("your pings", {type: ActivityType.Listening});
        await client.application.fetch();
        await ((process.env.NODE_ENV === 'production') ? client.application : client.guilds.cache.get(process.env.DEV_GUILD)).commands.fetch();
        if(process.env.NODE_ENV === 'production'){
            await client.channels.cache.get(configs.bootlog).send(`Connected with ping \`${client.ws.ping}ms\`!`);
            await client.guilds.cache.get(configs.supportID).members.fetch();
            AutoPoster(process.env.TOPGG_TOKEN, client);
            axios({
                method: 'POST',
                url: `https://discord.bots.gg/api/v1/bots/${client.user.id}/stats`,
                headers: {
                    authorization: process.env.DISCORDBOTS_TOKEN,
                    'content-type': 'application/json',
                },
                data: {guildCount: client.guilds.cache.size},
            });
            axios({
                method: 'POST',
                url: `https://botsfordiscord.com/api/bot/${client.user.id}`,
                headers: {
                    authorization: process.env.BOTSFORDISCORD_TOKEN,
                    'content-type': 'application/json',
                },
                data: {server_count: client.guilds.cache.size},
            });
        }
        // await channel.deleteMany({
        //     _id: {$nin: client.channels.cache.map(e => e.id)},
        //     guild: {$in: client.guilds.cache.map(e => e.id)},
        // });
        // const roleDocs = await role.find({guild: {$in: client.guilds.cache.map(e => e.id)}});
        // await role.deleteMany({_id: {$in: roleDocs.filter(e => !client.guilds.cache.get(e.guild).roles.cache.has(e.roleID)).map(e => e._id)}});
        await menu.deleteMany({channelID: {$nin: client.channels.cache.map(e => e.id)}});
        const guildVoiceXpCd = new Collection();
        const unmuteTimer = async () => {
            const unmutes = await log.find({
                type: 'mute',
                duration: {$lte: Date.now()},
                ongoing: true,
            });
            if(!unmutes.length) return;
            await log.updateMany({_id: {$in: unmutes.map(e => e._id)}}, {$set: {ongoing: false}});
            for(let unmuteDoc of unmutes){
                let guild = client.guilds.cache.get(unmuteDoc.guild);
                if(!guild) continue;
                let discordMember = await guild.members.fetch(unmuteDoc.target).catch(() => null);
                if(discordMember && discordMember.isCommunicationDisabled()) continue;
                let discordUser = discordMember?.user ?? await client.users.fetch(unmuteDoc.target).catch(() => {});
                let discordChannel = guild.channels.cache.get(client.guildData.get(guild.id).modlogs.mute);
                if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages) && discordChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.EmbedLinks)){
                    let guildLanguage = locale.get(client.guildData.get(guild.id).language);
                    let embed = new EmbedBuilder()
                        .setColor(0x0000ff)
                        .setAuthor({
                            name: discordUser ? guildLanguage.get('autoUnmuteEmbedAuthorMember', [discordUser.tag]) : guildLanguage.get('autoUnmuteEmbedAuthorNoMember'),
                            iconURL: discordUser?.displayAvatarURL({dynamic: true}),
                        })
                        .addField(guildLanguage.get('autoUnmuteEmbedTargetTitle'), guildLanguage.get('autoUnmuteEmbedTargetValue', [unmuteDoc.target]), true)
                        .setTimestamp()
                        .addField(guildLanguage.get('autoUnmuteEmbedReasonTitle'), guildLanguage.get('autoUnmuteEmbedReasonValue'));
                    let msg = await discordChannel.messages.fetch({message: unmuteDoc.logMessage}).catch(() => null);
                    if(msg) embed.setDescription(guildLanguage.get('autoUnmuteEmbedDescription', [msg.url]));
                    await discordChannel.send({embeds: [embed]});
                };
            }
        }
        const removePremium = async currentGuild => {
            currentGuild.premiumUntil = null;
            currentGuild.patron = null;
            currentGuild.renewPremium = false;
            await currentGuild.save();
            client.guildData.set(currentGuild._id, currentGuild);
        }
        const searchPledge = async (url, patron) => {
            const pledges = await axios({
                method: 'GET',
                url: url,
                headers: {Authorization: `Bearer ${process.env.PATREON_TOKEN}`},
            }).then(res => res.data);
            const patreonUser = pledges.included.find(e => ((e.type === 'user') && (e.attributes.social_connections.discord?.user_id === patron)));
            if(!patreonUser){
                if(!pledges.links.next) return null;
                return await searchPledge(pledges.links.next, patron);
            }
            return pledges.data.find(e => ((e.type === 'pledge') && (e.relationships.patron.data.id === patreonUser.id)));
        }
        const unpremiumTimer = async () => {
            const endedPremium = await guildModel.find({premiumUntil: {$lt: Date.now()}});
            if(!endedPremium.length) return;
            const rewardTotal = {
                '8304182': 1,
                '8307567': 2,
                '8307569': 3,
            };
            for(guildDoc of endedPremium){
                if(!guildDoc.patron || !guildDoc.renewPremium || !client.guilds.cache.has(guildDoc._id)){
                    await removePremium(guildDoc);
                    continue;
                }
                const pledge = await searchPledge('https://www.patreon.com/api/oauth2/api/campaigns/8230487/pledges', guildDoc.patron);
                if(!pledge){
                    await removePremium(guildDoc);
                    continue;
                }
                if(client.guildData.filter(e => (e.patron === guildDoc.patron)).size > rewardTotal[pledge.relationships.reward.data.id]){
                    await removePremium(guildDoc);
                    continue;
                }
                guildDoc.premiumUntil = new Date(Date.now() + 2764800000);
                await guildDoc.save();
            }
        }
        const renewBoost = async () => {
            if(process.env.NODE_ENV !== 'production') return;
            const endedBoost = await user.find({boostUntil: {$lt: Date.now()}});
            if(!endedBoost.length) return;
            for(userDoc of endedBoost){
                let discordMember = await client.guilds.cache.get(configs.supportID).members.fetch(userDoc._id).catch(() => null);
                userDoc.boostUntil = discordMember?.premiumSince && new Date(userDoc.boostUntil.getTime() + 2592000000);
                if(discordMember?.premiumSince){
                    userDoc.boostUntil = new Date(userDoc.boostUntil.getTime() + 2592000000);
                    userDoc.premiumKeys++;
                    discordMember.send(locale.get('en').get('renewBoost', [discordMember.guild.name])).catch(() => null);
                }
                else{
                    userDoc.boostUntil = null;
                }
                userDoc.save();
            }
        }
        const earnVoiceXp = async () => {
            const voiceGuilds = await guildModel.find({
                _id: {$in: client.guilds.cache.map(e => e.id)},
                voiceXpCooldown: {$ne: null},
            });
            for(let voiceGuild of voiceGuilds){
                let discordGuild = client.guilds.cache.get(voiceGuild._id);
                let ignoredChannels = await channel.find({
                    _id: {$in: discordGuild.channels.cache.filter(e => (e.type === ChannelType.GuildVoice)).map(e => e.id)},
                    ignoreXp: true,
                });
                let roleDocs = await role.find({
                    guild: voiceGuild._id,
                    roleID: {$in: discordGuild.roles.cache.map(e => e.id)},
                });
                try{
                    await discordGuild.members.fetch({user: discordGuild.voiceStates.cache.map(e => e.id)});
                }
                catch(_){
                    // This shouldn't happen and I don't know why it occasionally does, therefore I'll only investigate further when people start complaining about it.
                    continue;
                }
                let inVoice = discordGuild.voiceStates.cache.filter(e => e.channel && !e.deaf && !e.mute && !e.member.user.bot && (e.channel.members.filter(ee => !ee.voice.deaf && !ee.voice.mute && !ee.user.bot).size > 1) && !ignoredChannels.some(ee => (ee._id === e.channel.id)) && !roleDocs.some(ee => e.member.roles.cache.has(ee.roleID) && ee.ignoreXp));
                if(!guildVoiceXpCd.has(voiceGuild._id)){
                    guildVoiceXpCd.set(voiceGuild._id, inVoice.mapValues(() => 0));
                    continue;
                }
                for(let [id, minutes] of inVoice.intersect(guildVoiceXpCd.get(voiceGuild._id))){
                    guildVoiceXpCd.get(voiceGuild._id).set(id, ++minutes);
                    if(minutes % voiceGuild.voiceXpCooldown) continue;
                    let discordMember = inVoice.get(id).member;
                    let multiplier = roleDocs.filter(e => (e.xpMultiplier && discordMember.roles.cache.has(e.roleID))).sort((a, b) => (b.xpMultiplier - a.xpMultiplier))[0]?.xpMultiplier ?? 1;
                    let doc = await member.findOneAndUpdate({
                        guild: voiceGuild._id,
                        userID: id,
                    }, {$inc: {xp: multiplier}}, {
                        new: true,
                        upsert: true,
                        setDefaultsOnInsert: true,
                    });
                    let lowerRoles = roleDocs.filter(e => (discordGuild.roles.cache.get(e.roleID).editable && e.xp && (e.xp <= doc.xp))).sort((a, b) => (b.xp - a.xp));
                    if(!lowerRoles.length || discordMember.roles.cache.has(lowerRoles[0].roleID)) continue;
                    await discordMember.roles.set(discordMember.roles.cache.map(e => e.id).filter(e => !lowerRoles.some(ee => (e === ee.roleID))).concat(lowerRoles.map(e => e.roleID).slice(0, client.guildData.get(voiceGuild._id).dontStack ? 1 : undefined)));
                    if(!client.guildData.get(voiceGuild._id).xpChannel || (doc.xp >= (lowerRoles[0].xp + multiplier))) continue;
                    let guildLanguage = locale.get(client.guildData.get(voiceGuild._id).language);
                    if(client.guildData.get(voiceGuild._id).xpChannel === 'dm'){
                        discordMember.send(guildLanguage.get('achieveDM', [discordGuild.roles.cache.get(lowerRoles[0].roleID).name, discordGuild.name])).catch(() => null);
                        continue;
                    }
                    let notifChannel = discordGuild.channels.cache.get(client.guildData.get(voiceGuild._id).xpChannel);
                    if(notifChannel) notifChannel.send(guildLanguage.get('achieveGuild', [discordMember, discordGuild.roles.cache.get(lowerRoles[0].roleID)]));
                }
                guildVoiceXpCd.set(voiceGuild._id, inVoice.mapValues(() => 0).concat(guildVoiceXpCd.get(voiceGuild._id)));
            }
        }
        const tick = i => {
            setTimeout(() => {
                unmuteTimer();
                unpremiumTimer();
                renewBoost();
                if((i % 6) === 0) earnVoiceXp();
                tick(++i);
            }, 10000);
        }
        tick(0);
    },
};