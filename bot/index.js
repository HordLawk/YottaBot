const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const guild = require('../schemas/guild.js');
const locale = require('../locale');
const configs = require('./configs.js');

const client = new Discord.Client({
    partials: ['REACTION', 'MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'USER'],
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES
    ],
    allowedMentions: {repliedUser: false},
    failIfNotExists: false,
});
const _transformCommand = Discord.ApplicationCommandManager.transformCommand;
Discord.ApplicationCommandManager.transformCommand = command => ({
    ..._transformCommand(command),
    default_member_permissions: command.default_member_permissions?.toString(),
    dm_permission: command.dm_permission,
});
client.cooldowns = new Discord.Collection();
client.xpcds = new Discord.Collection();
client.lastdelmsg = new Discord.Collection();
client.handlers = {
    button: (err, i) => {
        console.error(err);
        const channelLanguage = locale.get((i.locale === 'pt-BR') ? 'pt' : 'en');
        const msgData = {
            content: channelLanguage.get('componentError'),
            ephemeral: true,
        };
        if(i.deferred){
            i.editReply({
                content: channelLanguage.get('componentError'),
                files: [],
                embeds: [],
                components: [],
            }).catch(console.error);
        }
        else if(i.replied){
            i.followUp(msgData).catch(console.error);
        }
        else{
            i.reply(msgData).catch(console.error);
        }
        if(process.env.NODE_ENV === 'production') client.channels.cache.get(configs.errorlog).send({
            content: `Error: *${err.message}*\n` +
                     `Button ID: ${i.customId}\n` +
                     `Interaction User: ${i.user}\n` +
                     `Interaction ID: ${i.id}`,
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
        if(process.env.NODE_ENV === 'production') client.channels.cache.get(configs.errorlog).send({
            content: `Error: *${err.message}*\nEvent: ${e.name}`,
            files: [
                {
                    name: 'args.json',
                    attachment: Buffer.from(
                        JSON.stringify(
                            args,
                            (_, value) => (
                                (typeof value === "bigint")
                                ? `${value}n`
                                : value
                            ),
                            4
                        )
                    ),
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
fs
    .readdirSync(
        path.join(
            __dirname,
            'events'
        )
    )
    .filter(file => file.endsWith('.js'))
    .map(e => require(`./events/${e}`))
    .forEach(e => (
        client.on(
            e.name,
            (...args) => (
                e
                    .execute(
                        ...args,
                        client
                    )
                    .catch(err => (
                        client.handlers.event(
                            err,
                            e,
                            args
                        )
                    ))
            )
        )
    ));
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    try{
        if(process.env.NODE_ENV === 'production') client.channels.cache.get(configs.errorlog).send({
            content: `Error: *${error.message}*`,
            files: [{
                name: 'stack.log',
                attachment: Buffer.from(error.stack),
            }],
        }).catch(console.error);
    }
    catch(err){
        console.error(err);
    }
});
(async () => {
    const guilds = await guild.find({});
    client.guildData = new Discord.Collection(guilds.map(e => [e._id, e]));
    client.login();
})();