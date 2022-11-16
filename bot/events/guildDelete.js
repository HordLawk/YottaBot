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

const {EmbedBuilder} = require('discord.js');
const configs = require('../configs.js');

module.exports = {
    name: 'guildDelete',
    execute: async guild => {
        if(process.env.NODE_ENV === 'development') return;
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setAuthor({
                name: 'Left Guild',
                iconURL: guild.iconURL({dynamic: true}),
            })
            .setDescription(`Member count: ${guild.memberCount}\nID: ${guild.id}\nName: ${guild.name}\nOwner: <@${guild.ownerId}>\nLocale: ${guild.preferredLocale}\nFeatures:\`\`\`${guild.features?.join('\n')}\`\`\``);
        await guild.client.shard.broadcastEval(async (c, {channelId, embed}) => {
            const channel = c.channels.cache.get(channelId);
            if(!channel) return;
            await channel.send({embeds: [embed]});
            const guildCount = (await c.shard.fetchClientValues('guilds.cache.size')).reduce((acc, n) => acc + n, 0);
            await channel.setTopic(guildCount);
        }, {context: {channelId: configs.guildlog, embed}});
    },
};