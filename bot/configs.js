const {PermissionsBitField, Collection} = require('discord.js');

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
    permissions: PermissionsBitField.All - (PermissionsBitField.Flags.UseEmbeddedActivities + PermissionsBitField.Flags.ViewGuildInsights + PermissionsBitField.Flags.UseApplicationCommands + PermissionsBitField.Flags.Stream),
    xpRolesLimit: 10,
    namebansLimits: [5, 25],
    notarchiveLimits: [5, 50],
};