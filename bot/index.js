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

const { ShardingManager, EmbedBuilder } = require('discord.js');
const configs = require('./configs');
const path = require('path')

EmbedBuilder.prototype.addField = function(name, value, inline = false){
    return this.addFields([{name, value, inline}]);
}
const manager = new ShardingManager(path.join(__dirname, 'spawner.js'));
manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
manager.spawn();
process.on('unhandledRejection', async error => {
    console.error('Unhandled promise rejection:', error);
    try{
        if(process.env.NODE_ENV === 'production') await manager.broadcastEval(async (c, {channelId, error}) => {
            const channel = c.channels.cache.get(channelId);
            if(channel) await channel.send({
                content: `Error: *${error.message}*`,
                files: [{
                    name: 'stack.log',
                    attachment: Buffer.from(error.stack),
                }],
            }).catch(console.error);
        }, {context: {channelId: configs.errorlog, error}}).catch(console.error);
    }
    catch(err){
        console.error(err);
    }
});