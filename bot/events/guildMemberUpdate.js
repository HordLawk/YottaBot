const user = require('../../schemas/user.js');

module.exports = {
    name: 'guildMemberUpdate',
    execute: async (oldMember, newMember) => {
        if(!newMember.guild.available || (newMember.guild.id != newMember.client.configs.supportID) || oldMember.premiumSince || !newMember.premiumSince) return;
        const userDoc = await user.findById(newMember.id);
        if(userDoc?.boostUntil) return;
        await user.findByIdAndUpdate(newMember.id, {
            $inc: {premiumKeys: 1},
            $set: {boostUntil: new Date(Date.now() + 2592000000)},
        }, {
            upsert: true,
            setDefaultsOnInsert: true,
            new: true,
        });
        newMember.send(newMember.client.langs[newMember.client.guildData.get(newMember.client.configs.supportID).language].get('firstBoost', [newMember, newMember.guild.name])).catch(() => null);
    },
};