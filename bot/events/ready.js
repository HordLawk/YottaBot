const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const menu = require('../../schemas/menu.js');
const log = require('../../schemas/log.js');
const guildModel = require('../../schemas/guild.js');
const user = require('../../schemas/user.js');
const member = require('../../schemas/member.js');
const {MessageEmbed, Collection} = require('discord.js');
const {AutoPoster} = require('topgg-autoposter');
const axios = require('axios');

module.exports = {
    name: 'ready',
    execute: async client => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity("your pings", {type:'LISTENING'});
        const application = await client.fetchApplication();
        client.configs.owner = application.owner;
        if(process.env.NODE_ENV === 'production'){
            await client.channels.cache.get(client.configs.bootlog).send(`Connected with ping \`${client.ws.ping}ms\`!`);
            await client.guilds.cache.get(client.configs.supportID).members.fetch();
            AutoPoster(process.env.TOPGG_TOKEN, client);
            axios({
                method: 'POST',
                url: `https://discord.bots.gg/api/v1/bots/${client.user.id}/stats`,
                headers: {authorization: process.env.DISCORDBOTS_TOKEN},
                data: {guildCount: client.guilds.cache.size},
            });
        }
        await channel.deleteMany({
            _id: {$nin: client.channels.cache.map(e => e.id)},
            guild: {$in: client.guilds.cache.map(e => e.id)},
        });
        const roleDocs = await role.find({guild: {$in: client.guilds.cache.map(e => e.id)}});
        await role.deleteMany({_id: {$in: roleDocs.filter(e => !client.guilds.cache.get(e.guild).roles.cache.has(e.roleID)).map(e => e._id)}});
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
                let discordUser = discordMember?.user ?? await client.users.fetch(unmuteDoc.target).catch(() => {});
                let discordChannel = guild.channels.cache.get(client.guildData.get(guild.id).modlogs.mute);
                if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(guild.me).has('SEND_MESSAGES') && discordChannel.permissionsFor(guild.me).has('EMBED_LINKS')){
                    let guildLanguage = client.langs[client.guildData.get(guild.id).language];
                    let embed = new MessageEmbed()
                        .setColor(0x0000ff)
                        .setAuthor(discordUser ? guildLanguage.get('autoUnmuteEmbedAuthorMember', [discordUser.tag]) : guildLanguage.get('autoUnmuteEmbedAuthorNoMember'), discordUser?.displayAvatarURL({dynamic: true}))
                        .addField(guildLanguage.get('autoUnmuteEmbedTargetTitle'), guildLanguage.get('autoUnmuteEmbedTargetValue', [unmuteDoc.target]), true)
                        .setTimestamp()
                        .addField(guildLanguage.get('autoUnmuteEmbedReasonTitle'), guildLanguage.get('autoUnmuteEmbedReasonValue'));
                    let msg = await discordChannel.messages.fetch(unmuteDoc.logMessage).catch(() => null);
                    if(msg) embed.setDescription(guildLanguage.get('autoUnmuteEmbedDescription', [msg.url]));
                    await discordChannel.send(embed);
                };
                if(!guild.me.permissions.has('MANAGE_ROLES') || !client.guildData.get(guild.id).muteRoleID) continue;
                if(!discordMember) continue;
                let discordRole = guild.roles.cache.get(client.guildData.get(guild.id).muteRoleID);
                if(!discordRole || !discordRole.editable || !discordMember.roles.cache.has(discordRole.id)) continue;
                await discordMember.roles.remove(discordRole);
            }
        }
        const unpremiumTimer = async () => {
            const endedPremium = await guildModel.find({premiumUntil: {$lt: Date.now()}});
            if(!endedPremium.length) return;
            await guildModel.updateMany({premiumUntil: {$lt: Date.now()}}, {$set: {premiumUntil: null}});
            endedPremium.forEach(e => client.guildData.get(e._id).premiumUntil = null);
        }
        const renewBoost = async () => {
            const endedBoost = await user.find({boostUntil: {$lt: Date.now()}});
            if(!endedBoost.length) return;
            for(userDoc of endedBoost){
                let discordMember = await client.guilds.cache.get(client.configs.supportID).members.fetch(userDoc._id).catch(() => null);
                userDoc.boostUntil = discordMember?.premiumSince && new Date(userDoc.boostUntil.getTime() + 2592000000);
                if(discordMember?.premiumSince){
                    userDoc.boostUntil = new Date(userDoc.boostUntil.getTime() + 2592000000);
                    userDoc.premiumKeys++;
                    discordMember.send(client.langs.en.get('renewBoost', [discordMember.guild.name])).catch(() => null);
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
                    _id: {$in: discordGuild.channels.cache.filter(e => (e.type === 'voice')).map(e => e.id)},
                    ignoreXp: true,
                });
                let roleDocs = await role.find({
                    guild: voiceGuild._id,
                    roleID: {$in: discordGuild.roles.cache.map(e => e.id)},
                });
                let inVoice = discordGuild.voiceStates.cache.filter(e => e.channel && !e.deaf && !e.mute && !e.member.user.bot && (e.channel.members.filter(ee => !ee.voice.deaf && !ee.voice.mute && !ee.user.bot).size > 1) && !ignoredChannels.some(ee => (ee._id === e.channel.id)) && !roleDocs.some(ee => e.member.roles.cache.has(ee.roleID) && ee.ignoreXp));
                if(!guildVoiceXpCd.has(voiceGuild._id)){
                    guildVoiceXpCd.set(voiceGuild._id, inVoice.mapValues(() => 0));
                    continue;
                }
                for(let [id, minutes] of inVoice.intersect(guildVoiceXpCd.get(voiceGuild._id))){
                    guildVoiceXpCd.get(voiceGuild._id).set(id, ++minutes);
                    if((minutes % voiceGuild.voiceXpCooldown) != 0) continue;
                    let doc = await member.findOneAndUpdate({
                        guild: voiceGuild._id,
                        userID: id,
                    }, {$inc: {xp: 1}}, {
                        new: true,
                        upsert: true,
                        setDefaultsOnInsert: true,
                    });
                    let lowerRoles = roleDocs.filter(e => (discordGuild.roles.cache.get(e.roleID).editable && e.xp && (e.xp <= doc.xp))).sort((a, b) => (b.xp - a.xp));
                    let discordMember = inVoice.get(id).member;
                    if(!lowerRoles.length || discordMember.roles.cache.has(lowerRoles[0].roleID)) continue;
                    await discordMember.roles.set(discordMember.roles.cache.map(e => e.id).filter(e => !lowerRoles.some(ee => (e === ee.roleID))).concat(lowerRoles.map(e => e.roleID).slice(0, client.guildData.get(voiceGuild._id).dontStack ? 1 : undefined)));
                    if(!client.guildData.get(voiceGuild._id).xpChannel || (doc.xp != lowerRoles[0].xp)) continue;
                    let guildLanguage = client.langs[client.guildData.get(voiceGuild._id).language];
                    if(client.guildData.get(voiceGuild._id).xpChannel === 'dm'){
                        discordMember.send(guildLanguage.get('achieveDM', [discordGuild.roles.cache.get(lowerRoles[0].roleID).name, discordGuild.name])).catch(() => null);
                        continue;
                    }
                    let notifChannel = discordGuild.channels.cache.get(client.guildData.get(voiceGuild._id).xpChannel);
                    if(notifChannel) notifChannel.send(guildLanguage.get('achieveGuild', [discordMember, discordGuild.roles.cache.get(lowerRoles[0].roleID).name]));
                }
                guildVoiceXpCd.set(voiceGuild._id, inVoice.mapValues(() => 0).concat(guildVoiceXpCd.get(voiceGuild._id)));
            }
        }
        const tick = (i) => {
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