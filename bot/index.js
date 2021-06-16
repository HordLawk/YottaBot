const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const client = new Discord.Client({partials: ['REACTION', 'MESSAGE']});
const guild = require('../schemas/guild.js');
client.configs = require('./configs.js');
client.langs = fs.readdirSync(path.join(__dirname, '..', 'langs')).filter(file => file.endsWith('.js')).map(e => require(`../langs/${e}`)).reduce((obj, e) => ({...obj, [e.lang]: e}), {});
client.commands = new Discord.Collection(fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js')).map(e => require(`./commands/${e}`)).filter(e => e.active).map(e => [e.name, e]));
client.cooldowns = new Discord.Collection();
client.xpcds = new Discord.Collection();
client.lastdelmsg = new Discord.Collection();
eval(process.env.UNDOCUMENTED);
fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js')).map(e => require(`./events/${e}`)).forEach(e => client.on(e.name, (...args) => e.execute(...args, client).catch(error => {
    console.error(error);
    console.log(e.name);
    console.log(args);
    if(process.env.NODE_ENV === 'production') client.channels.cache.get(client.configs.errorlog).send(`Error: *${error.message}*\nEvent: ${e.name}`, {files: [
        {
            name: 'args.json',
            attachment: Buffer.from(JSON.stringify(args)),
        },
        {
            name: 'stack.log',
            attachment: Buffer.from(error.stack),
        },
    ]}).catch(console.error);
})));
client.ws.on('INTERACTION_CREATE', console.log);
(async () => {
    const guilds = await guild.find({});
    client.guildData = new Discord.Collection(guilds.map(e => [e._id, e]));
    client.login(process.env.TOKEN);
})();