const {Permissions, Collection} = require('discord.js');

module.exports = {
    maintenance: false,
    errorlog: '667650244028268565',
    guildlog: '854893736588214282',
    bootlog: '854894584248664095',
    defaultPrefix: 'y!',
    actions: new Collection([
        ['delmsg', {
            ignorableChannels: true,
            ignorableRoles: true,
        }],
        ['prune', {
            ignorableChannels: true,
            ignorableRoles: true,
        }],
        ['editmsg', {
            ignorableChannels: true,
            ignorableRoles: true,
        }],
        ['memberjoin', {}],
        ['memberleave', {ignorableRoles: true}],
    ]),
    support: 'eNcsvsy',
    supportID: '476244157245947904',
    permissions: Permissions.ALL - (Permissions.FLAGS.START_EMBEDDED_ACTIVITIES + Permissions.FLAGS.VIEW_GUILD_INSIGHTS + Permissions.FLAGS.USE_APPLICATION_COMMANDS + Permissions.FLAGS.STREAM),
    xpRolesLimit: 10,
};