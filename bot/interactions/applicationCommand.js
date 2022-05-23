const guild = require('../../schemas/guild.js');
const role = require('../../schemas/role.js');
const channel = require('../../schemas/channel.js');
const user = require('../../schemas/user.js');
const member = require('../../schemas/member.js');
const {Collection} = require('discord.js');
const locale = require('../../locale');
const configs = require('../configs.js');
const commands = require('../commands');

module.exports = {
    name: 'APPLICATION_COMMAND',
    execute: async function(interaction){
        if(interaction.guild && !interaction.guild.available) throw new Error('Invalid interaction.');
        // var roleDocs;
        // var savedChannel;
        if(interaction.guild){
            if(!interaction.client.guildData.has(interaction.guild.id)){
                let guildData = new guild({
                    _id: interaction.guild.id,
                    language: (interaction.guild.preferredLocale === 'pt-BR') ? 'pt' : 'en',
                });
                guildData.save();
                interaction.client.guildData.set(guildData._id, guildData);
            }
            if(!interaction.member) interaction.member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            // roleDocs = await role.find({
            //     guild: interaction.guild.id,
            //     roleID: {$in: interaction.guild.roles.cache.map(e => e.id)},
            // });
            // savedChannel = await channel.findById(interaction.channel.id);
            if(!interaction.member) throw new Error('Member could not be fetched.');
        }
        const channelLanguage = locale.get((interaction.locale === 'pt-BR') ? 'pt' : 'en');
        if(interaction.channel.partial) await interaction.channel.fetch();
        const userDoc = await user.findById(interaction.user.id);
        if(userDoc && userDoc.blacklisted) return interaction.reply({
            content: channelLanguage.get('blacklisted'),
            ephemeral: true,
        });
        const {commandName} = interaction;
        const subCommandGroupName = interaction.options.getSubcommandGroup(false);
        const subCommandName = interaction.options.getSubcommand(false);
        const command = interaction.isContextMenu() ? commands.find(cmd => (cmd.contextName === commandName)) : commands.get(commandName);
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
            }).catch(err => interaction.client.handlers.event(err, this, [interaction]));
        }
        const args = {};
        let options = interaction.options.data;
        if(subCommandName) options = subCommandGroupName ? interaction.options.data[0].options[0].options : interaction.options.data[0].options;
        if(options?.length > 0) options.forEach(opt => {
            args[opt.name] = opt[opt.type.toLowerCase()] ? opt[opt.type.toLowerCase()] : opt.value;
            if(opt.type === 'USER' && opt.member) args[opt.name].member = opt.member;
        });
        interaction.channelLanguage = channelLanguage;
        command[`${subCommandName ? `${(subCommandGroupName ?? '')}${subCommandName}` : 'execute'}Slash`](interaction, args).then(async () => {
            if(Math.floor(Math.random() * 100) || (interaction.guild && (interaction.client.guildData.get(interaction.guild.id).premiumUntil || interaction.client.guildData.get(interaction.guild.id).partner))) return;
            const msgData = {
                content: channelLanguage.get(`premiumAd${Math.floor(Math.random() * 3)}`, [command.name]),
                ephemeral: true,
            };
            if(interaction.replied){
                await interaction.followUp(msgData);
            }
            else{
                await interaction.reply(msgData);
            }
        }).catch(error => {
            console.error(error);
            const msgData = {
                content: channelLanguage.get('error', [command.name]),
                ephemeral: true,
            };
            if(interaction.deferred){
                interaction.editReply({
                    content: channelLanguage.get('error', [command.name]),
                    files: [],
                    embeds: [],
                    components: [],
                }).catch(console.error);
            }
            else if(interaction.replied){
                interaction.followUp(msgData).catch(console.error);
            }
            else{
                interaction.reply(msgData).catch(console.error);
            }
            if(process.env.NODE_ENV === 'production') interaction.client.channels.cache.get(configs.errorlog).send({
                content: `Error: *${error.message}*\nInteraction User: ${interaction.user}\nInteraction ID: ${interaction.id}`,
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