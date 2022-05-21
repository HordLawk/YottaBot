const {MessageEmbed, Permissions} = require('discord.js');

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
        const {channelLanguage} = message;
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
        const prefix = message.guild ? message.client.guildData.get(message.guild.id).prefix : message.client.configs.defaultPrefix;
        let embed;
        if(!args.length){
            let perms = await message.client.generateInvite({
                scopes: ['bot', 'applications.commands'],
                permissions: message.client.configs.permissions,
            });
            embed = new MessageEmbed()
                .setColor(message.guild ? (message.guild.me.displayColor || 0x8000ff) : 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('helpEmbedTitle'),
                    iconURL: message.client.user.avatarURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(channelLanguage.get('helpEmbedDescription', [message.client.configs.support, perms, prefix, message.client.user.id]))
                .setFooter({text: channelLanguage.get('helpEmbedFooter', [message.client.commands.filter(command => !command.dev).size])})
                .setTimestamp();
            const categories = message.client.commands.filter(cmd => (!cmd.dev && (cmd.execute || (((process.env.NODE_ENV === 'production') ? message.client.application : message.client.guilds.cache.get(process.env.DEV_GUILD)).commands.cache.find(e => (e.name === cmd.name))?.type === 'CHAT_INPUT')))).reduce((arr, cmd) => (arr[cmd.categoryID] = [...(arr[cmd.categoryID] || []), cmd], arr), []);
            categories.forEach((e, i) => embed.addField(channelLanguage.get(`category${i}`), e.map(cmd => `\`${cmd.name}\``).join(' ')));
            const categoryEmojis = [,'ℹ️', '⚙️', '🔨', '📈', '🪣'];
            const menuCategory = {
                type: 'SELECT_MENU',
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
                }))),
            };
            const menuCommand = {
                type: 'SELECT_MENU',
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
                    type: 'ACTION_ROW',
                    components: [menuCategory],
                },
                {
                    type: 'ACTION_ROW',
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
                componentType: 'SELECT_MENU',
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
                const categoryEmbed = new MessageEmbed()
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
                componentType: 'SELECT_MENU',
            });
            collectorCommand.on('collect', i => (async () => {
                const cmd = message.client.commands.get(i.values[0]);
                const commandEmbed = new MessageEmbed()
                    .setColor(0x2f3136)
                    .setAuthor({
                        name: channelLanguage.get('helpCommandEmbedTitle', [cmd.name]),
                        iconURL: message.client.user.avatarURL({}),
                    })
                    .setDescription(cmd.description(channelLanguage))
                    .setFooter({text: channelLanguage.get('helpCommandEmbedFooter')})
                    .setTimestamp();
                if(cmd.usage) commandEmbed.addField(channelLanguage.get('syntax'), `${cmd.usage(channelLanguage).map(e => `\`${prefix}${cmd.name} ${e}\``).join('\n')}`);
                if(cmd.example) commandEmbed.addField(channelLanguage.get('example'), `${cmd.example.map(e => `\`${prefix}${cmd.name} ${e}\``).join('\n')}`);
                if(cmd.aliases) commandEmbed.addField(channelLanguage.get('aliases'), cmd.aliases.map(a => `\`${a}\``).join(' '));
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
            const command = message.client.commands.get(name) || message.client.commands.find(c => (c.aliases && c.aliases.includes(name)));
            if(!command || command.dev || (!command.execute && (((process.env.NODE_ENV === 'production') ? message.client.application : message.client.guilds.cache.get(process.env.DEV_GUILD)).commands.cache.find(e => (e.name === command.name))?.type !== 'CHAT_INPUT'))) return message.reply(channelLanguage.get('invalidCommand'));
            embed = new MessageEmbed()
                .setColor(message.guild ? (message.guild.me.displayColor || 0x8000ff) : 0x8000ff)
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
            if(command.usage) embed.addField(channelLanguage.get('syntax'), `${command.usage(channelLanguage).map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`);
            if(command.example) embed.addField(channelLanguage.get('example'), `${command.example.map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`);
            if(command.aliases) embed.addField(channelLanguage.get('aliases'), command.aliases.map(a => `\`${a}\``).join(' '));
            if(command.perm) embed.addField(channelLanguage.get('permissionLevel'), channelLanguage.get(`permission${command.perm}`), true);
            embed.addField('Cooldown', channelLanguage.get('helpCommandCooldown', [command.cooldown]), true);
            message.reply({embeds: [embed]});
        }
    },
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const prefix = interaction.guild ? interaction.client.guildData.get(interaction.guild.id).prefix : interaction.client.configs.defaultPrefix;
        let embed;
        if(!args.command){
            let perms = await interaction.client.generateInvite({
                scopes: ['bot', 'applications.commands'],
                permissions: interaction.client.configs.permissions,
            });
            embed = new MessageEmbed()
                .setColor(interaction.guild ? (interaction.guild.me.displayColor || 0x8000ff) : 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('helpEmbedTitle'),
                    iconURL: interaction.client.user.avatarURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(channelLanguage.get('helpEmbedDescription', [interaction.client.configs.support, perms, prefix, interaction.client.user.id]))
                .setFooter({text: channelLanguage.get('helpEmbedFooter', [interaction.client.commands.filter(command => !command.dev).size])})
                .setTimestamp();
            const categories = interaction.client.commands.filter(cmd => (!cmd.dev && (cmd.execute || (((process.env.NODE_ENV === 'production') ? interaction.client.application : interaction.client.guilds.cache.get(process.env.DEV_GUILD)).commands.cache.find(e => (e.name === cmd.name))?.type === 'CHAT_INPUT')))).reduce((arr, cmd) => (arr[cmd.categoryID] = [...(arr[cmd.categoryID] || []), cmd], arr), []);
            categories.forEach((e, i) => embed.addField(channelLanguage.get(`category${i}`), e.map(cmd => `\`${cmd.name}\``).join(' ')));
            const categoryEmojis = [,'ℹ️', '⚙️', '🔨', '📈', '🪣'];
            const menuCategory = {
                type: 'SELECT_MENU',
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
                }))),
            };
            const menuCommand = {
                type: 'SELECT_MENU',
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
                    type: 'ACTION_ROW',
                    components: [menuCategory],
                },
                {
                    type: 'ACTION_ROW',
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
                componentType: 'SELECT_MENU',
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
                const categoryEmbed = new MessageEmbed()
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
                componentType: 'SELECT_MENU',
            });
            collectorCommand.on('collect', i => (async () => {
                const cmd = interaction.client.commands.get(i.values[0]);
                const commandEmbed = new MessageEmbed()
                    .setColor(0x2f3136)
                    .setAuthor({
                        name: channelLanguage.get('helpCommandEmbedTitle', [cmd.name]),
                        iconURL: interaction.client.user.avatarURL({}),
                    })
                    .setDescription(cmd.description(channelLanguage))
                    .setFooter({text: channelLanguage.get('helpCommandEmbedFooter')})
                    .setTimestamp();
                if(cmd.usage) commandEmbed.addField(channelLanguage.get('syntax'), `${cmd.usage(channelLanguage).map(e => `\`${prefix}${cmd.name} ${e}\``).join('\n')}`);
                if(cmd.example) commandEmbed.addField(channelLanguage.get('example'), `${cmd.example.map(e => `\`${prefix}${cmd.name} ${e}\``).join('\n')}`);
                if(cmd.aliases) commandEmbed.addField(channelLanguage.get('aliases'), cmd.aliases.map(a => `\`${a}\``).join(' '));
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
            const command = interaction.client.commands.get(args.command);
            if(!command || command.dev || (!command.execute && (((process.env.NODE_ENV === 'production') ? interaction.client.application : interaction.client.guilds.cache.get(process.env.DEV_GUILD)).commands.cache.find(e => (e.name === command.name))?.type !== 'CHAT_INPUT'))) return interaction.reply({
                content: channelLanguage.get('invalidCommand'),
                ephemeral: true,
            });
            embed = new MessageEmbed()
                .setColor(interaction.guild ? (interaction.guild.me.displayColor || 0x8000ff) : 0x8000ff)
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
            if(command.usage) embed.addField(channelLanguage.get('syntax'), `${command.usage(channelLanguage).map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`);
            if(command.example) embed.addField(channelLanguage.get('example'), `${command.example.map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`);
            if(command.aliases) embed.addField(channelLanguage.get('aliases'), command.aliases.map(a => `\`${a}\``).join(' '));
            if(command.perm) embed.addField(channelLanguage.get('permissionLevel'), channelLanguage.get(`permission${command.perm}`), true);
            embed.addField('Cooldown', channelLanguage.get('helpCommandCooldown', [command.cooldown]), true);
            await interaction.reply({embeds: [embed]});
        }
    },
    slashOptions: [{
        type: 'STRING',
        name: 'command',
        description: 'The command you need help with',
        required: false,
        autocomplete: true,
    }],
    commandAutocomplete: {command: (interaction, value) => interaction.respond(interaction.client.commands.filter(e => (e.name.startsWith(value.toLowerCase()) && !e.dev && (e.execute || (((process.env.NODE_ENV === 'production') ? interaction.client.application : interaction.client.guilds.cache.get(process.env.DEV_GUILD)).commands.cache.find(cmd => (e.name === cmd.name))?.type === 'CHAT_INPUT')))).first(25).map(e => ({
        name: e.name,
        value: e.name,
    })))},
};