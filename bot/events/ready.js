const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');

module.exports = {
    name: 'ready',
    execute: async client => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity("pinging territory", {type:'COMPETING'});
        await channel.deleteMany({
            _id: {$nin: client.channels.cache.map(e => e.id)},
            guild: {$in: client.guilds.cache.map(e => e.id)},
        });
        const roleDocs = await role.find({guild: {$in: client.guilds.cache.map(e => e.id)}});
        await role.deleteMany({_id: {$in: roleDocs.filter(e => !client.guilds.cache.get(e.guild).roles.cache.has(e.roleID)).map(e => e._id)}});
    },
};