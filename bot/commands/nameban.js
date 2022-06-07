const {Permissions} = require('discord.js');

module.exports = {
    active: false,
    name: 'nameban',
    description: lang => lang.get('namebanDescription'), // fazer locale
    cooldown: 5,
    categoryID: 3,
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
};