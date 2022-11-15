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
const { handleEventError } = require('./utils.js');

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
    ],
    allowedMentions: {repliedUser: false},
    failIfNotExists: false,
    presence: {activities: [{
        name: '/help',
        type: Discord.ActivityType.Listening,
    }]},
});
client.cooldowns = new Discord.Collection();
client.xpcds = new Discord.Collection();
client.lastdelmsg = new Discord.Collection();
client.lastMoveAudit = new Discord.Collection();
client.lastDisconnectAudit = new Discord.Collection();
client.inviteUses = new Discord.Collection();
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
                    .catch(async err => await handleEventError(err, e, args, client))
            )
        )
    ));
(async () => {
    const guilds = await guild.find({});
    client.guildData = new Discord.Collection(guilds.map(e => [e._id, e]));
    client.login();
})();