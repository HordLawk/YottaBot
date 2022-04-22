const memberModel = require('../../schemas/member.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    execute: async member => {
        if(member.partial) await member.fetch();
        if(!member.client.guildData.has(member.guild.id)) return;
        const channelLanguage = member.client.langs[member.client.guildData.get(member.guild.id).language];
        if(member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin') && (member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID)){
            const hook = await member.client.fetchWebhook(member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID, member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin').hookToken || member.client.guildData.get(member.guild.id).defaultLogsHookToken).catch(() => null);
            if(hook){
                const embed = new MessageEmbed()
                    .setColor(0x00ff00)
                    .setFooter({text: member.id})
                    .setTimestamp()
                    .setAuthor({
                        name: channelLanguage.get('memberjoinEmbedAuthor', [member.user.tag]),
                        iconURL: member.user.displayAvatarURL({dynamic: true}),
                    })
                    .setThumbnail(member.user.displayAvatarURL({dynamic: true}))
                    .setDescription(member.toString());
                if((member.user.flags.bitfield || member.user.bot) && member.guild.roles.everyone.permissionsIn(hook.channelId).has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)){
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
                    embed.addField(channelLanguage.get('memberjoinEmbedBadgesTitle'), userBadges.join(' '));
                }
                embed.addField(channelLanguage.get('memberjoinEmbedCreationTitle'), channelLanguage.get('memberjoinEmbedCreationValue', [Math.round(member.user.createdTimestamp / 1000)]));
                await hook.send({
                    embeds: [embed],
                    username: member.client.user.username,
                    avatarURL: member.client.user.avatarURL(),
                    components: [{
                        type: 'ACTION_ROW',
                        components: [{
                            type: 'BUTTON',
                            label: channelLanguage.get('banButton'),
                            customId: `banjoined${member.id}`,
                            style: 'DANGER',
                            emoji: '🔨',
                        }],
                    }],
                });
            }
        }
        if(!member.client.guildData.get(member.guild.id).globalBan) return;
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