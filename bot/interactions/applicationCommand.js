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

const guild = require('../../schemas/guild.js');
const user = require('../../schemas/user.js');
const member = require('../../schemas/member.js');
const {Collection, InteractionType, ApplicationCommandOptionType} = require('discord.js');
const locale = require('../../locale');
const configs = require('../configs.js');
const commands = require('../commands');
const { handleEventError } = require('../utils.js');

module.exports = {
    type: InteractionType.ApplicationCommand,
    execute: async function(interaction){
        if(interaction.guild && !interaction.guild.available) throw new Error('Invalid interaction.');
        if(interaction.guild){
            if(!interaction.client.guildData.has(interaction.guild.id)){
                let guildDoc = await guild.findById(interaction.guild.id);
                if(!guildDoc){
                    guildDoc = new guild({
                        _id: interaction.guild.id,
                        language: (interaction.guild.preferredLocale === 'pt-BR') ? 'pt' : 'en',
                    });
                    await guildDoc.save();
                }
                interaction.client.guildData.set(interaction.guild.id, guildDoc);
            }
            if(!interaction.member) interaction.member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            if(!interaction.member) throw new Error('Member could not be fetched.');
        }
        const channelLanguage = locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en');
        if(!interaction.channel || interaction.channel.partial){
            await interaction.client.channels.fetch(interaction.channelId);
        }
        const userDoc = await user.findById(interaction.user.id);
        if(userDoc && userDoc.blacklisted) return interaction.reply({
            content: channelLanguage.get('blacklisted'),
            ephemeral: true,
        });
        const {commandName} = interaction;
        const subCommandGroupName = interaction.options.getSubcommandGroup(false);
        const subCommandName = interaction.options.getSubcommand(false);
        const command = interaction.isContextMenuCommand() ? commands.find(cmd => (cmd.contextName === commandName)) : commands.get(commandName);
        if(!command) throw new Error('Invalid command.');
        if((command.dev && (interaction.user.id !== interaction.client.application.owner.id)) || (command.alpha && !interaction.client.guildData.get(interaction.guild.id).alpha)) return interaction.reply({
            content: channelLanguage.get('invalidCommand'),
            ephemeral: true,
        });
        if(configs.maintenance && (interaction.user.id !== interaction.client.application.owner.id)) return interaction.reply({
            content: channelLanguage.get('maintenance'),
            ephemeral: true,
        });
        if(command.guildOnly && !interaction.guild) return interaction.reply({
            content: channelLanguage.get('guildOnly'),
            ephemeral: true,
        });
        if(command.premium && !interaction.client.guildData.get(interaction.guild.id).premiumUntil && !interaction.client.guildData.get(interaction.guild.id).partner) return interaction.reply(channelLanguage.get('premiumCommand', ['/']));
        if(command.beta && !interaction.client.guildData.get(interaction.guild.id).beta) return interaction.reply({
            content: channelLanguage.get('betaCommand'),
            ephemeral: true,
        });
        if(!interaction.client.cooldowns.has(command.name)) interaction.client.cooldowns.set(command.name, new Collection());
        const now = Date.now();
        const timestamps = interaction.client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown / (1 + (!!interaction.client.guildData.get(interaction.guild?.id)?.premiumUntil || !!interaction.client.guildData.get(interaction.guild?.id)?.partner))) * 1000;
        if(timestamps.has(interaction.user.id) && (interaction.user.id !== interaction.client.application.owner.id)){
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if(now < expirationTime){
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({
                    content: channelLanguage.get('cooldown', [timeLeft.toFixed(1), command.name, (interaction.client.guildData.get(interaction.guild.id).premiumUntil || interaction.client.guildData.get(interaction.guild.id).partner)]),
                    ephemeral: true,
                });
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        if(interaction.inGuild()){
            member.findOneAndUpdate({
                guild: interaction.guild.id,
                userID: interaction.user.id,
                "commandUses._id": command.name,
            }, {$inc: {"commandUses.$.count": 1}}).then(async (doc, err) => {
                if(err) throw err;
                if(doc) return;
                await member.findOneAndUpdate({
                    guild: interaction.guild.id,
                    userID: interaction.user.id,
                }, {$addToSet: {commandUses: {
                    _id: command.name,
                    count: 1,
                }}}, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                });
            }).catch(async err => await handleEventError(err, this, [interaction], interaction.client));
        }
        const args = {};
        let options = interaction.options.data;
        if(subCommandName) options = subCommandGroupName ? interaction.options.data[0].options[0].options : interaction.options.data[0].options;
        if(options?.length > 0) options.forEach(opt => {
            switch(opt.type){
                case ApplicationCommandOptionType.String:
                case ApplicationCommandOptionType.Boolean:
                case ApplicationCommandOptionType.Integer:
                case ApplicationCommandOptionType.Number: {
                    args[opt.name] = opt.value;
                }
                break;
                case ApplicationCommandOptionType.Attachment: {
                    args[opt.name] = opt.attachment;
                }
                break;
                case ApplicationCommandOptionType.Channel: {
                    args[opt.name] = opt.channel;
                }
                break;
                case ApplicationCommandOptionType.Role: {
                    args[opt.name] = opt.role;
                }
                break;
                case ApplicationCommandOptionType.User: {
                    args[opt.name] = opt.user;
                    if(opt.member) args[opt.name].member = opt.member;
                }
                break;
            }
        });
        interaction.channelLanguage = channelLanguage;
        command[`${subCommandName ? `${(subCommandGroupName ?? '')}${subCommandName}` : 'execute'}Slash`](interaction, args).then(async () => {
            if(Math.floor(Math.random() * 100) || (interaction.guild && (interaction.client.guildData.get(interaction.guild.id).premiumUntil || interaction.client.guildData.get(interaction.guild.id).partner))) return;
            await interaction[interaction.replied ? 'followUp' : 'reply']({
                content: channelLanguage.get(`premiumAd${Math.floor(Math.random() * 3)}`, [command.name]),
                ephemeral: true,
            });
        }).catch(error => {
            console.error(error);
            if(interaction.deferred){
                interaction.editReply({
                    content: channelLanguage.get('error', [command.name]),
                    files: [],
                    embeds: [],
                    components: [],
                }).catch(console.error);
            }
            else{
                interaction[interaction.replied ? 'followUp' : 'reply']({
                    content: channelLanguage.get('error', [command.name]),
                    ephemeral: true,
                }).catch(console.error);
            }
            if(process.env.NODE_ENV === 'production') interaction.client.channels.cache.get(configs.errorlog).send({
                content: `Error: *${error.message}*\n` +
                         `Interaction User: ${interaction.user}\n` +
                         `Interaction Channel: ${interaction.channel}`,
                files: [
                    {
                        name: 'args.json',
                        attachment: Buffer.from(JSON.stringify(interaction.options.data, (key, value) => ((typeof value === 'bigint') ? `${value}n` : value), 4)),
                    },
                    {
                        name: 'stack.log',
                        attachment: Buffer.from(error.stack),
                    },
                ],
            }).catch(console.error);
        });
    },
};