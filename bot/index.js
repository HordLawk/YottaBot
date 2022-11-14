// Copyright (C) 2022  HordLawk

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const fs = require('fs');
const path = require('path');
const Discord = require('discord.js')
const guild = require('../schemas/guild.js');
const locale = require('../locale');
const configs = require('./configs.js');

const client = new Discord.Client({
    partials: [
        Discord.Partials.Reaction,
        Discord.Partials.Message,
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.User,
    ],
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildPresences,
    ],
    allowedMentions: {repliedUser: false},
    failIfNotExists: false,
});
Discord.EmbedBuilder.prototype.addField = function(name, value, inline = false){
    return this.addFields([{name, value, inline}]);
}
// const __patch = Discord.Presence.prototype._patch;
// Discord.Presence.prototype._patch = function(data){
//     __patch.call(this, data);
//     this.activities = data.activities?.map(e => {
//         const activity = new Discord.Activity(this, e);
//         activity.syncId = e.sync_id;
//         return activity;
//     });
//     return this;
// }
client.cooldowns = new Discord.Collection();
client.xpcds = new Discord.Collection();
client.lastdelmsg = new Discord.Collection();
client.lastMoveAudit = new Discord.Collection();
client.lastDisconnectAudit = new Discord.Collection();
client.inviteUses = new Discord.Collection();
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
        if(e.name === 'ready') process.exit(1);
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