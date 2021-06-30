const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const menu = require('../../schemas/menu.js');
const log = require('../../schemas/log.js');
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
        const tick = () => {
            setTimeout(async () => {
                const unmutes = await log.find({
                    type: 'mute',
                    duration: {$lte: Date.now()},
                    ongoing: true,
                });
                if(!unmutes.length) return tick();
                await log.updateMany({_id: {$in: unmutes.map(e => e._id)}}, {$set: {ongoing: false}});
                for(let unmuteDoc of unmutes){
                    let guild = client.guilds.cache.get(unmuteDoc.guild);
                    if(!guild) continue;
                    let discordMember = await guild.members.fetch(unmuteDoc.target).catch(() => null);
                    let discordChannel = guild.channels.cache.get(client.guildData.get(guild.id).modlogs.mute);
                    if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(guild.me).has('SEND_MESSAGES') && discordChannel.permissionsFor(guild.me).has('EMBED_LINKS')){
                        let guildLanguage = client.langs[client.guildData.get(guild.id).language];
                        let embed = new MessageEmbed()
                            .setColor(0x0000ff)
                            .setAuthor(discordMember ? guildLanguage.get('autoUnmuteEmbedAuthorMember', [discordMember.user.tag]) : guildLanguage.get('autoUnmuteEmbedAuthorNoMember'), discordMember?.user.displayAvatarURL({dynamic: true}))
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
                tick();
            }, 10000);
        }
        tick();
    },
};