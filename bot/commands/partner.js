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

const { ApplicationCommandOptionType } = require('discord.js');
const locale = require('../../locale');

module.exports = {
    active: true,
    name: 'partner',
    description: () => 'Sets a server as bot partner',
    dev: true,
    args: true,
    usage: () => ['<add/rem> (server id)'],
    executeSlash: async (interaction, args) => {
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(args.guild, {$set: {partner: args.add}}, {new: true});
        if(!guildDoc) return interaction.reply({
            content: `Could not find a server with Id \`${args.guild}\` in the database`,
            ephemeral: true,
        });
        interaction.client.guildData.get(guildDoc._id).partner = guildDoc.partner;
        await interaction.reply(`The server with Id \`${guildDoc._id}\` had its partner status set to ` +
                                `\`${guildDoc.partner}\``);
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'add',
            description: 'Whether to add this server as partner',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'guild',
            description: 'The guild to issue the partner action on',
            required: true,
            autocomplete: true,
        },
    ],
    commandAutocomplete: {
        guild: (interaction, value) => {
            if(interaction.user.id === interaction.client.application.owner.id){
                interaction.client.shard.broadcastEval(
                    (c, {value}) => {
                        return c.guilds.cache
                            .filter(guild => guild.name.toLowerCase().startsWith(value.toLowerCase()))
                            .first(25)
                            .map(guild => ({
                                name: guild.name,
                                value: guild.id,
                            }));
                    },
                    {context: {value}},
                ).then(guilds => interaction.respond(guilds.flat()));
            }
            else{
                interaction.respond([{
                    name: locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en').get('forbidden'),
                    value: '',
                }]);
            }
        },
    },
};