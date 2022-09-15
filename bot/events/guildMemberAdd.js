const {EmbedBuilder, PermissionsBitField, ButtonStyle, ComponentType, UserFlags} = require('discord.js');
const locale = require('../../locale');
const configs = require('../configs.js');

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
                if(
                    (
                        member.user.flags?.remove(
                            UserFlags.Quarantined
                            +
                            UserFlags.TeamPseudoUser
                            +
                            UserFlags.Spammer
                        ).bitfield
                        ||
                        member.user.bot
                    )
                    &&
                    member.guild.roles.everyone
                        .permissionsIn(hook.channelId)
                        .has(PermissionsBitField.Flags.UseExternalEmojis)
                ){
                    const badges = {
                        Staff: '<:staff:967043602012315658>',
                        Partner: '<:partner:967043547561852978>',
                        Hypesquad: '<:hs:967048946612572160>',
                        BugHunterLevel1: '<:bughunter:967043119407329311>',
                        HypeSquadOnlineHouse1: '<:bravery:967043119780610058>',
                        HypeSquadOnlineHouse2: '<:brilliance:967043119780597860>',
                        HypeSquadOnlineHouse3: '<:balance:967043119809974272>',
                        PremiumEarlySupporter: '<:earlysupporter:967043119717699665>',
                        BugHunterLevel2: '<:bughunter2:967043119759642694>',
                        VerifiedDeveloper: '<:botdev:967043120984391752>',
                        CertifiedModerator: '<:mod:967043119788994610>',
                        VerifiedBot: '<:verifiedbot:967049829568090143>',
                        BotHTTPInteractions: '<:bot:967062591190995004>',
                    };
                    const userBadges = member.user.flags.toArray().map(e => badges[e]);
                    if(
                        !member.user.flags.any(UserFlags.VerifiedBot + UserFlags.BotHTTPInteractions)
                        &&
                        member.user.bot
                    ) userBadges.push('<:bot:967062591190995004>');
                    embed.addField(channelLanguage.get('memberjoinEmbedBadgesTitle'), userBadges.join(' '));
                }
                embed.addField(channelLanguage.get('memberjoinEmbedCreationTitle'), channelLanguage.get('memberjoinEmbedCreationValue', [Math.round(member.user.createdTimestamp / 1000)]));
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
            member.client.guildData.get(member.guild.id).premiumUntil ?? member.client.guildData.get(member.guild.id).partner
        )]).some(e => {
            const username = e.caseSensitive ? member.user.username.toLowerCase() : member.user.username;
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