const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const menu = require('../../schemas/menu.js');
const log = require('../../schemas/log.js');
const guildModel = require('../../schemas/guild.js');
const user = require('../../schemas/user.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    name: 'ready',
    execute: async client => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity("your pings", {type:'LISTENING'});
        const application = await client.fetchApplication();
        client.configs.owner = application.owner;
        if(process.env.NODE_ENV === 'production') await client.channels.cache.get(client.configs.bootlog).send(`Connected with ping \`${client.ws.ping}ms\`!`);
        await channel.deleteMany({
            _id: {$nin: client.channels.cache.map(e => e.id)},
            guild: {$in: client.guilds.cache.map(e => e.id)},
        });
        const roleDocs = await role.find({guild: {$in: client.guilds.cache.map(e => e.id)}});
        await role.deleteMany({_id: {$in: roleDocs.filter(e => !client.guilds.cache.get(e.guild).roles.cache.has(e.roleID)).map(e => e._id)}});
        await menu.deleteMany({channelID: {$nin: client.channels.cache.map(e => e.id)}});
        if(process.env.NODE_ENV === 'production') await client.guilds.cache.get(client.configs.supportID).members.fetch();
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
        const tick = (i) => {
            setTimeout(() => {
                unmuteTimer();
                unpremiumTimer();
                renewBoost();
                tick(++i);
            }, 10000);
        }
        tick(1);
    },
};