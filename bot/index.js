const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const client = new Discord.Client({
    partials: ['REACTION', 'MESSAGE', 'CHANNEL'],
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.GUILD_BANS, Discord.Intents.FLAGS.GUILD_VOICE_STATES],
    allowedMentions: {repliedUser: false},
    failIfNotExists: false,
});
const guild = require('../schemas/guild.js');
client.configs = require('./configs.js');
client.langs = fs.readdirSync(path.join(__dirname, '..', 'locale')).filter(file => file.endsWith('.js')).map(e => require(`../locale/${e}`)).reduce((obj, e) => ({...obj, [e.lang]: e}), {});
client.commands = new Discord.Collection(fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js')).map(e => require(`./commands/${e}`)).filter(e => e.active).map(e => [e.name, e]));
client.interactions = new Discord.Collection(fs.readdirSync(path.join(__dirname, 'interactions')).filter(file => file.endsWith('.js')).map(e => require(`./interactions/${e}`)).map(e => [e.name, e]));
client.cooldowns = new Discord.Collection();
client.xpcds = new Discord.Collection();
client.lastdelmsg = new Discord.Collection();
client.handlers = {
    button: (err, i) => {
        console.error(err);
        const channelLanguage = client.langs[(i.locale === 'pt-BR') ? 'pt' : 'en'];
        i.reply({
            content: channelLanguage.get('componentError'),
            ephemeral: true,
        });
        if(process.env.NODE_ENV === 'production') client.channels.cache.get(client.configs.errorlog).send({
            content: `Error: *${err.message}*\nButton ID: ${i.customId}\nInteraction User: ${i.user}\nInteraction ID: ${i.id}`,
            files: [{
                name: 'stack.log',
                attachment: Buffer.from(err.stack),
            }],
        }).catch(console.error);
    },
    event: (err, e, args) => {
        console.error(err);
        console.log(e.name);
        console.log(args);
        if(process.env.NODE_ENV === 'production') client.channels.cache.get(client.configs.errorlog).send({
            content: `Error: *${err.message}*\nEvent: ${e.name}`,
            files: [
                {
                    name: 'args.json',
                    attachment: Buffer.from(JSON.stringify(args, (key, value) => ((typeof value === "bigint") ? `${value}n` : value), 4)),
                },
                {
                    name: 'stack.log',
                    attachment: Buffer.from(err.stack),
                },
            ],
        }).catch(console.error);
    },
};
eval(process.env.UNDOCUMENTED);
fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js')).map(e => require(`./events/${e}`)).forEach(e => client.on(e.name, (...args) => e.execute(...args, client).catch(err => client.handlers.event(err, e, args))));
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    if(process.env.NODE_ENV === 'production') client.channels.cache.get(client.configs.errorlog).send({
        content: `Error: *${error.message}*`,
        files: [{
            name: 'stack.log',
            attachment: Buffer.from(error.stack),
        }],
    }).catch(console.error);
});
(async () => {
    const guilds = await guild.find({});
    client.guildData = new Discord.Collection(guilds.map(e => [e._id, e]));
    client.login();
})();