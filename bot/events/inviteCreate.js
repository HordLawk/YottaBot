module.exports = {
    name: 'inviteCreate',
    execute: async invite => {
        if(invite.client.inviteUses.has(invite.guild.id)){
            invite.client.inviteUses.get(invite.guild.id).set(invite.code, {
                code: invite.code,
                uses: 0,
                expiresTimestamp: invite.expiresTimestamp,
                inviterId: invite.inviterId,
            });
        }
    },
};