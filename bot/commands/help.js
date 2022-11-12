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

const {
    EmbedBuilder,
    PermissionsBitField,
    ApplicationCommandType,
    ApplicationCommandOptionType,
    ComponentType,
} = require('discord.js');
const configs = require('../configs');
const { slashCommandUsages } = require('../utils');

module.exports = {
    active: true,
    name: 'help',
    description: lang => lang.get('helpDescription'),
    aliases: ['cmds', 'commands'],
    usage: lang => [lang.get('helpUsage')],
    example: ['ping'],
    cooldown: 5,
    categoryID: 1,
    execute: async (message, args) => {
        const commands = require('.');
        const {channelLanguage} = message;
        if(message.guild && !message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
        const prefix = message.guild ? message.client.guildData.get(message.guild.id).prefix : configs.defaultPrefix;
        let embed;
        const commandsManager = (
            (process.env.NODE_ENV === 'production')
            ? message.client.application
            : message.client.guilds.cache.get(process.env.DEV_GUILD)
        ).commands.cache;
        if(!args.length){
            let perms = await message.client.generateInvite({
                scopes: ['bot', 'applications.commands'],
                permissions: configs.permissions,
            });
            embed = new EmbedBuilder()
                .setColor(message.guild ? (message.guild.members.me.displayColor || 0x8000ff) : 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('helpEmbedTitle'),
                    iconURL: message.client.user.avatarURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(channelLanguage.get('helpEmbedDescription', [configs.support, perms, message.client.user.id]))
                .setFooter({text: channelLanguage.get('helpEmbedFooter', [commands.filter(command => !command.dev).size])})
                .setTimestamp();
            const categories = commands.
                filter(cmd => {
                    return (
                        !cmd.dev
                        &&
                        (
                            cmd.execute
                            ||
                            (commandsManager.find(e => e.name === cmd.name)?.type === ApplicationCommandType.ChatInput)
                        )
                    );
                })
                .reduce((arr, cmd) => (arr[cmd.categoryID] = [...(arr[cmd.categoryID] || []), cmd], arr), []);
            categories.forEach((e, i) => {
                embed.addField(channelLanguage.get(`category${i}`), e.map(cmd => `\`${cmd.name}\``).join(' '));
            });
            const categoryEmojis = [,'ℹ️', '⚙️', '🔨', '📈', '🪣'];
            const menuCategory = {
                type: ComponentType.SelectMenu,
                customId: 'category',
                placeholder: channelLanguage.get('selectCategory'),
                options: ([{
                    label: channelLanguage.get('helpHome'),
                    value: 'home',
                    emoji: '🏠',
                    default: true,
                }]).concat(categories.map((_, i) => ({
                    label: channelLanguage.get(`category${i}`),
                    value: i.toString(),
                    emoji: categoryEmojis[i],
                })).filter(e => e)),
            };
            const menuCommand = {
                type: ComponentType.SelectMenu,
                customId: 'command',
                placeholder: channelLanguage.get('selectCategoryFirst'),
                options: [{
                    label: '\u200B',
                    value: '\u200B',
                }],
                disabled: true,
            };
            const components = [
                {
                    type: ComponentType.ActionRow,
                    components: [menuCategory],
                },
                {
                    type: ComponentType.ActionRow,
                    components: [menuCommand],
                },
            ]
            const reply = await message.reply({
                embeds: [embed],
                components,
                fetchReply: true,
            });
            const collectorCategory = reply.createMessageComponentCollector({
                filter: componentInteraction => ((componentInteraction.user.id === message.author.id) && (componentInteraction.customId === 'category')),
                time: 600000,
                componentType: ComponentType.SelectMenu,
            });
            collectorCategory.on('collect', i => (async () => {
                if(i.values[0] === 'home'){
                    menuCommand.disabled = true;
                    menuCommand.placeholder = channelLanguage.get('selectCategoryFirst'),
                    menuCommand.options = [{
                        label: '\u200B',
                        value: '\u200B',
                    }];
                    menuCategory.options = menuCategory.options.map(e => ({
                        label: e.label,
                        value: e.value,
                        emoji: e.emoji,
                        default: (e.value === 'home'),
                    }));
                    return await i.update({embeds: [embed], components});
                }
                const categoryEmbed = new EmbedBuilder()
                    .setColor(0x2f3136)
                    .setAuthor({
                        name: channelLanguage.get(`EmbedHelpCategory${i.values[0]}Author`),
                        iconURL:  message.client.user.avatarURL()
                    })
                    .setTimestamp()
                    .setFields(categories[i.values[0]].map(e => ({
                        name: e.name,
                        value: e.description(channelLanguage),
                    })));
                menuCommand.disabled = false;
                menuCommand.options = categories[i.values[0]].map(e => ({
                    label: e.name,
                    value: e.name,
                    description: e.description(channelLanguage),
                }));
                menuCommand.placeholder = channelLanguage.get('selectCommand');
                menuCategory.options = menuCategory.options.map(e => ({
                    label: e.label,
                    value: e.value,
                    emoji: e.emoji,
                    default: (e.value === i.values[0]),
                }));
                await i.update({embeds: [categoryEmbed], components});
            })().catch(err => message.client.handlers.button(err, i)));
            collectorCategory.on('end', async () => {
                if(!reply.editable) return;
                menuCategory.disabled = true;
                await reply.edit({components});
            });
            const collectorCommand = reply.createMessageComponentCollector({
                filter: componentInteraction => ((componentInteraction.user.id === message.author.id) && (componentInteraction.customId === 'command')),
                time: 600000,
                componentType: ComponentType.SelectMenu,
            });
            collectorCommand.on('collect', i => (async () => {
                const cmd = commands.get(i.values[0]);
                const commandEmbed = new EmbedBuilder()
                    .setColor(0x2f3136)
                    .setAuthor({
                        name: channelLanguage.get('helpCommandEmbedTitle', [cmd.name]),
                        iconURL: message.client.user.avatarURL({}),
                    })
                    .setDescription(cmd.description(channelLanguage))
                    .setFooter({text: channelLanguage.get('helpCommandEmbedFooter')})
                    .setTimestamp();
                const usages = slashCommandUsages(cmd.name, message.client);
                if(usages){
                    commandEmbed.addFields({
                        name: channelLanguage.get('syntax'),
                        value: usages,
                    });
                }
                else{
                    if(cmd.usage){
                        commandEmbed.addField(
                            channelLanguage.get('syntax'),
                            `${cmd.usage(channelLanguage).map(e => `\`${prefix}${cmd.name} ${e}\``).join('\n')}`,
                        );
                    }
                    if(cmd.example){
                        commandEmbed.addField(
                            channelLanguage.get('example'),
                            `${cmd.example.map(e => `\`${prefix}${cmd.name} ${e}\``).join('\n')}`,
                        );
                    }
                    if(cmd.aliases){
                        commandEmbed.addField(
                            channelLanguage.get('aliases'),
                            cmd.aliases.map(a => `\`${a}\``).join(' '),
                        );
                    }
                }
                if(cmd.perm) commandEmbed.addField(channelLanguage.get('permissionLevel'), channelLanguage.get(`permission${cmd.perm}`), true);
                commandEmbed.addField('Cooldown', channelLanguage.get('helpCommandCooldown', [cmd.cooldown]), true);
                menuCommand.options = categories[cmd.categoryID].map(e => ({
                    label: e.name,
                    value: e.name,
                    description: e.description(channelLanguage),
                    default: (cmd.name === e.name),
                }));
                menuCategory.options = menuCategory.options.map(e => ({
                    label: e.label,
                    value: e.value,
                    emoji: e.emoji,
                }));
                await i.update({embeds: [commandEmbed], components});
            })().catch(err => message.client.handlers.button(err, i)));
            collectorCommand.on('end', async () => {
                if(!reply.editable) return;
                menuCommand.disabled = true;
                await reply.edit({components});
            });
        }
        else{
            const name = args[0];
            const command = commands.get(name) || commands.find(c => (c.aliases && c.aliases.includes(name)));
            if(
                !command
                ||
                command.dev
                ||
                (
                    !command.execute
                    &&
                    (commandsManager.find(e => (e.name === command.name))?.type !== ApplicationCommandType.ChatInput)
                )
            ){
                return message.reply(channelLanguage.get('invalidCommand'));
            }
            embed = new EmbedBuilder()
                .setColor(message.guild ? (message.guild.members.me.displayColor || 0x8000ff) : 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('helpCommandEmbedTitle', [command.name]),
                    iconURL: message.client.user.avatarURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(command.description(channelLanguage))
                .setFooter({text: channelLanguage.get('helpCommandEmbedFooter')})
                .setTimestamp();
            const usages = slashCommandUsages(command.name, message.client);
            if(usages){
                embed.addFields({
                    name: channelLanguage.get('syntax'),
                    value: usages,
                });
            }
            else{
                if(command.usage){
                    embed.addField(
                        channelLanguage.get('syntax'),
                        `${command.usage(channelLanguage).map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`,
                    );
                }
                if(command.example){
                    embed.addField(
                        channelLanguage.get('example'),
                        `${command.example.map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`,
                    );
                }
                if(command.aliases){
                    embed.addField(channelLanguage.get('aliases'), command.aliases.map(a => `\`${a}\``).join(' '));
                }
            }
            if(command.perm) embed.addField(channelLanguage.get('permissionLevel'), channelLanguage.get(`permission${command.perm}`), true);
            embed.addField('Cooldown', channelLanguage.get('helpCommandCooldown', [command.cooldown]), true);
            message.reply({embeds: [embed]});
        }
    },
    executeSlash: async (interaction, args) => {
        const commands = require('.');
        const {channelLanguage} = interaction;
        const prefix = interaction.guild ? interaction.client.guildData.get(interaction.guild.id).prefix : configs.defaultPrefix;
        let embed;
        const commandsManager = (
            (process.env.NODE_ENV === 'production')
            ? interaction.client.application
            : interaction.client.guilds.cache.get(process.env.DEV_GUILD)
        ).commands.cache;
        if(!args.command){
            let perms = await interaction.client.generateInvite({
                scopes: ['bot', 'applications.commands'],
                permissions: configs.permissions,
            });
            embed = new EmbedBuilder()
                .setColor(interaction.guild ? (interaction.guild.members.me.displayColor || 0x8000ff) : 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('helpEmbedTitle'),
                    iconURL: interaction.client.user.avatarURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(channelLanguage.get('helpEmbedDescription', [configs.support, perms, interaction.client.user.id]))
                .setFooter({text: channelLanguage.get('helpEmbedFooter', [commands.filter(command => !command.dev).size])})
                .setTimestamp();
            const categories = commands
                .filter(cmd => {
                    return (
                        !cmd.dev
                        &&
                        (
                            cmd.execute
                            ||
                            (commandsManager.find(e => e.name === cmd.name)?.type === ApplicationCommandType.ChatInput)
                        )
                    );
                })
                .reduce((arr, cmd) => (arr[cmd.categoryID] = [...(arr[cmd.categoryID] || []), cmd], arr), []);
            categories.forEach((e, i) => {
                embed.addField(channelLanguage.get(`category${i}`), e.map(cmd => `\`${cmd.name}\``).join(' '));
            });
            const categoryEmojis = [,'ℹ️', '⚙️', '🔨', '📈', '🪣'];
            const menuCategory = {
                type: ComponentType.SelectMenu,
                customId: 'category',
                placeholder: channelLanguage.get('selectCategory'),
                options: ([{
                    label: channelLanguage.get('helpHome'),
                    value: 'home',
                    emoji: '🏠',
                    default: true,
                }]).concat(categories.map((_, i) => ({
                    label: channelLanguage.get(`category${i}`),
                    value: i.toString(),
                    emoji: categoryEmojis[i],
                })).filter(e => e)),
            };
            const menuCommand = {
                type: ComponentType.SelectMenu,
                customId: 'command',
                placeholder: channelLanguage.get('selectCategoryFirst'),
                options: [{
                    label: '\u200B',
                    value: '\u200B',
                }],
                disabled: true,
            };
            const components = [
                {
                    type: ComponentType.ActionRow,
                    components: [menuCategory],
                },
                {
                    type: ComponentType.ActionRow,
                    components: [menuCommand],
                },
            ]
            const reply = await interaction.reply({
                embeds: [embed],
                components,
                fetchReply: true,
            });
            const collectorCategory = reply.createMessageComponentCollector({
                filter: componentInteraction => ((componentInteraction.user.id === interaction.user.id) && (componentInteraction.customId === 'category')),
                time: 600000,
                componentType: ComponentType.SelectMenu,
            });
            collectorCategory.on('collect', i => (async () => {
                if(i.values[0] === 'home'){
                    menuCommand.disabled = true;
                    menuCommand.placeholder = channelLanguage.get('selectCategoryFirst'),
                    menuCommand.options = [{
                        label: '\u200B',
                        value: '\u200B',
                    }];
                    menuCategory.options = menuCategory.options.map(e => ({
                        label: e.label,
                        value: e.value,
                        emoji: e.emoji,
                        default: (e.value === 'home'),
                    }));
                    return await i.update({embeds: [embed], components});
                }
                const categoryEmbed = new EmbedBuilder()
                    .setColor(0x2f3136)
                    .setAuthor({
                        name: channelLanguage.get(`EmbedHelpCategory${i.values[0]}Author`),
                        iconURL:  interaction.client.user.avatarURL()
                    })
                    .setTimestamp()
                    .setFields(categories[i.values[0]].map(e => ({
                        name: e.name,
                        value: e.description(channelLanguage),
                    })));
                menuCommand.disabled = false;
                menuCommand.options = categories[i.values[0]].map(e => ({
                    label: e.name,
                    value: e.name,
                    description: e.description(channelLanguage),
                }));
                menuCommand.placeholder = channelLanguage.get('selectCommand');
                menuCategory.options = menuCategory.options.map(e => ({
                    label: e.label,
                    value: e.value,
                    emoji: e.emoji,
                    default: (e.value === i.values[0]),
                }));
                await i.update({embeds: [categoryEmbed], components});
            })().catch(err => interaction.client.handlers.button(err, i)));
            collectorCategory.on('end', async () => {
                if(!reply.editable) return;
                menuCategory.disabled = true;
                await interaction.editReply({components});
            });
            const collectorCommand = reply.createMessageComponentCollector({
                filter: componentInteraction => ((componentInteraction.user.id === interaction.user.id) && (componentInteraction.customId === 'command')),
                time: 600000,
                componentType: ComponentType.SelectMenu,
            });
            collectorCommand.on('collect', i => (async () => {
                const cmd = commands.get(i.values[0]);
                const commandEmbed = new EmbedBuilder()
                    .setColor(0x2f3136)
                    .setAuthor({
                        name: channelLanguage.get('helpCommandEmbedTitle', [cmd.name]),
                        iconURL: interaction.client.user.avatarURL({}),
                    })
                    .setDescription(cmd.description(channelLanguage))
                    .setFooter({text: channelLanguage.get('helpCommandEmbedFooter')})
                    .setTimestamp();
                const usages = slashCommandUsages(cmd.name, interaction.client);
                if(usages){
                    commandEmbed.addFields({
                        name: channelLanguage.get('syntax'),
                        value: usages,
                    });
                }
                else{
                    if(cmd.usage){
                        commandEmbed.addField(
                            channelLanguage.get('syntax'),
                            `${cmd.usage(channelLanguage).map(e => `\`${prefix}${cmd.name} ${e}\``).join('\n')}`,
                        );
                    }
                    if(cmd.example){
                        commandEmbed.addField(
                            channelLanguage.get('example'),
                            `${cmd.example.map(e => `\`${prefix}${cmd.name} ${e}\``).join('\n')}`,
                        );
                    }
                    if(cmd.aliases){
                        commandEmbed.addField(
                            channelLanguage.get('aliases'),
                            cmd.aliases.map(a => `\`${a}\``).join(' '),
                        );
                    }
                }
                if(cmd.perm) commandEmbed.addField(channelLanguage.get('permissionLevel'), channelLanguage.get(`permission${cmd.perm}`), true);
                commandEmbed.addField('Cooldown', channelLanguage.get('helpCommandCooldown', [cmd.cooldown]), true);
                menuCommand.options = categories[cmd.categoryID].map(e => ({
                    label: e.name,
                    value: e.name,
                    description: e.description(channelLanguage),
                    default: (cmd.name === e.name),
                }));
                menuCategory.options = menuCategory.options.map(e => ({
                    label: e.label,
                    value: e.value,
                    emoji: e.emoji,
                }));
                await i.update({embeds: [commandEmbed], components});
            })().catch(err => interaction.client.handlers.button(err, i)));
            collectorCommand.on('end', async () => {
                if(!reply.editable) return;
                menuCommand.disabled = true;
                await interaction.editReply({components});
            });
        }
        else{
            const command = commands.get(args.command);
            if(
                !command
                ||
                command.dev
                ||
                (
                    !command.execute
                    &&
                    (commandsManager.find(e => (e.name === command.name))?.type !== ApplicationCommandType.ChatInput)
                )
            ){
                return interaction.reply({
                    content: channelLanguage.get('invalidCommand'),
                    ephemeral: true,
                });
            }
            embed = new EmbedBuilder()
                .setColor(interaction.guild ? (interaction.guild.members.me.displayColor || 0x8000ff) : 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('helpCommandEmbedTitle', [command.name]),
                    iconURL: interaction.client.user.avatarURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(command.description(channelLanguage))
                .setFooter({text: channelLanguage.get('helpCommandEmbedFooter')})
                .setTimestamp();
            const usages = slashCommandUsages(command.name, interaction.client);
            if(usages){
                embed.addFields({
                    name: channelLanguage.get('syntax'),
                    value: usages,
                });
            }
            else{
                if(command.usage){
                    embed.addField(
                        channelLanguage.get('syntax'),
                        `${command.usage(channelLanguage).map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`,
                    );
                }
                if(command.example){
                    embed.addField(
                        channelLanguage.get('example'),
                        `${command.example.map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`,
                    );
                }
                if(command.aliases){
                    embed.addField(channelLanguage.get('aliases'), command.aliases.map(a => `\`${a}\``).join(' '));
                }
            }
            if(command.perm) embed.addField(channelLanguage.get('permissionLevel'), channelLanguage.get(`permission${command.perm}`), true);
            embed.addField('Cooldown', channelLanguage.get('helpCommandCooldown', [command.cooldown]), true);
            await interaction.reply({embeds: [embed]});
        }
    },
    slashOptions: [{
        type: ApplicationCommandOptionType.String,
        name: 'command',
        description: 'The command you need help with',
        required: false,
        autocomplete: true,
    }],
    commandAutocomplete: {
        command: (interaction, value) => interaction.respond(require('.').filter(e => (e.name.startsWith(value.toLowerCase()) && !e.dev && (e.execute || (((process.env.NODE_ENV === 'production') ? interaction.client.application : interaction.client.guilds.cache.get(process.env.DEV_GUILD)).commands.cache.find(cmd => (e.name === cmd.name))?.type === ApplicationCommandType.ChatInput)))).first(25).map(e => ({
            name: e.name,
            value: e.name,
        }))),
    },
};