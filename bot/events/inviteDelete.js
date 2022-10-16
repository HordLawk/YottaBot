module.exports = {
    name: 'inviteDelete',
    execute: async invite => {
        if(invite.client.inviteUses.has(invite.guild.id)){
            setTimeout(() => invite.client.inviteUses.get(invite.guild.id).delete(invite.code), 1000);
        }
    },
};