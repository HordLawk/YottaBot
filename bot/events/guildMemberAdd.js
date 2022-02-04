const memberModel = require('../../schemas/member.js');

module.exports = {
    name: 'guildMemberAdd',
    execute: async member => {
        if(member.partial) await member.fetch();
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
        const channelLanguage = member.client.langs[member.client.guildData.get(member.guild.id).language];
        await member.ban({reason: channelLanguage.get('globalBanReason')});
    },
};