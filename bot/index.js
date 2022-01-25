const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const client = new Discord.Client({
    partials: ['REACTION', 'MESSAGE', 'CHANNEL'],
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.GUILD_BANS],
    allowedMentions: {repliedUser: false},
});
const guild = require('../schemas/guild.js');
client.configs = require('./configs.js');
client.langs = fs.readdirSync(path.join(__dirname, '..', 'locale')).filter(file => file.endsWith('.js')).map(e => require(`../locale/${e}`)).reduce((obj, e) => ({...obj, [e.lang]: e}), {});
client.commands = new Discord.Collection(fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js')).map(e => require(`./commands/${e}`)).filter(e => e.active).map(e => [e.name, e]));
client.interactions = new Discord.Collection(fs.readdirSync(path.join(__dirname, 'interactions')).filter(file => file.endsWith('.js')).map(e => require(`./interactions/${e}`)).map(e => [e.name, e]));
client.cooldowns = new Discord.Collection();
client.xpcds = new Discord.Collection();
client.lastdelmsg = new Discord.Collection();
eval(process.env.UNDOCUMENTED);
fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js')).map(e => require(`./events/${e}`)).forEach(e => client.on(e.name, (...args) => e.execute(...args, client).catch(error => {
    console.error(error);
    console.log(e.name);
    console.log(args);
    if(process.env.NODE_ENV === 'production') client.channels.cache.get(client.configs.errorlog).send({
        content: `Error: *${error.message}*\nEvent: ${e.name}`,
        files: [
            {
                name: 'args.json',
                attachment: Buffer.from(JSON.stringify(args, null, 4)),
            },
            {
                name: 'stack.log',
                attachment: Buffer.from(error.stack),
            },
        ],
    }).catch(console.error);
})));
process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));
(async () => {
    const guilds = await guild.find({});
    client.guildData = new Discord.Collection(guilds.map(e => [e._id, e]));
    client.login();
})();