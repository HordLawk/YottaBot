const memberModel = require('../../schemas/member.js');
const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const role = require('../../schemas/role.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    execute: async member => {
        if(member.partial) await member.fetch();
        if(!member.client.guildData.has(member.guild.id)) return;
        const channelLanguage = member.client.langs[member.client.guildData.get(member.guild.id).language];
        if(member.client.guildData.get(member.guild.id).actionlogs.id('memberjoin') && (member.client.guildData.get(member.guild.id).actionlogs.id('delmsg').hookID || member.client.guildData.get(member.guild.id).defaultLogsHookID)){
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
                    .setDescription(member.toString())
                    .addField(channelLanguage.get('memberjoinEmbedCreationTitle'), channelLanguage.get('memberjoinEmbedCreationValue', [Math.round(member.user.createdTimestamp / 1000)]), true);
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
                        }]
                    }]
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