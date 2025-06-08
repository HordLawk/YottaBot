const {PermissionsBitField, Collection} = require('discord.js');

module.exports = {
    maintenance: false,
    errorlog: process.env.ERRORLOG_CHANNEL,
    guildlog: process.env.GUILDLOG_CHANNEL,
    bootlog: process.env.BOOTLOG_CHANNEL,
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
        ['voiceconnect', {
            ignorableChannels: true,
            ignorableRoles: true,
        }],
        ['voicedisconnect', {
            ignorableChannels: true,
            ignorableRoles: true,
        }],
        ['voicemove', {}],
    ]),
    support: '4EwBbWr3nq',
    supportID: '1106994102286958823',
    permissions: (
        PermissionsBitField.All
        -
        (
            PermissionsBitField.Flags.UseEmbeddedActivities
            +
            PermissionsBitField.Flags.ViewGuildInsights
            +
            PermissionsBitField.Flags.UseApplicationCommands
            +
            PermissionsBitField.Flags.Stream
        )
    ),
    xpRolesLimit: 10,
    namebansLimits: [5, 25],
    notarchiveLimits: [5, 50],
};