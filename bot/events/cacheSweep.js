const {Events} = require('discord.js');

module.exports = {
    name: Events.CacheSweep,
    execute: async msg => console.log(`${msg} - RAM at ${process.memoryUsage.rss() / (1024 * 1024)} MB`),
};