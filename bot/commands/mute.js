module.exports = {
    active: false,
    name: 'mute',
    description: lang => 'Mutes a member',
    aliases: ['m'],
    usage: lang => ['(member) (duration) [(reason)]'],
    example: ['@LordHawk#0572 1h30m spammer'],
    cooldown: 3,
    categoryID: 0,
    args: true,
    perm: 'MANAGE_ROLES',
    guildOnly: true,
    execute: async function(message, args){

    },
};