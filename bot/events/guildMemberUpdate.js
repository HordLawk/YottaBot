const user = require('../../schemas/user.js');

module.exports = {
    name: 'guildMemberUpdate',
    execute: async (oldMember, newMember) => {
        if(!newMember.guild.available || (newMember.guild.id != newMember.client.configs.supportID) || oldMember.premiumSince || !newMember.premiumSince) return;
        const userDoc = await user.findOneAndUpdate({
            _id: newMember.id,
            boostUntil: {$eq: null},
        }, {
            $inc: {premiumKeys: 1},
            boostUntil: new Date(Date.now() + 2592000000),
        }, {
            upsert: true,
            setDefaultsOnInsert: true,
        });
        if(userDoc) newMember.send(newMember.client.langs.en.get('firstBoost', [newMember, newMember.guild.name])).catch(() => null);
    },
};