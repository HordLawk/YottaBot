const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const locale = require('../../locale');

module.exports = {
    active: true,
    name: 'deploy',
    dev: true,
    args: true,
    usage: () => ['<user/message/chat_input> (command name)'],
    addSlash: async (interaction, args) => {
        const commands = require('.');
        const {channelLanguage} = interaction;
        const type = parseInt(args.type, 10);
        if(
            !args.name ||
            ![
                ApplicationCommandType.ChatInput,
                ApplicationCommandType.User,
                ApplicationCommandType.Message,
            ].includes(type)
        ) throw new Error('Invalid slash command options');
        const command = commands.get(args.name);
        if(!command) return interaction.reply({
            content: channelLanguage.get('invalidCommand'),
            ephemeral: true,
        });
        try{
            const slash = await (
                ((process.env.NODE_ENV === 'production') && !command.dev)
                ? interaction.client.application
                : interaction.guild
            ).commands.create({
                type: type,
                defaultMemberPermissions: command.perm,
                dmPermission: !command.guildOnly,
                ...((type === ApplicationCommandType.ChatInput) ? {
                    name: command.name,
                    nameLocalizations: locale
                        .filter((_, i) => (i !== 'en'))
                        .reduce((acc, e) => (
                            e.get(`${command.name}LocalisedName`)
                            ? {...acc, [e.code]: e.get(`${command.name}LocalisedName`)}
                            : acc
                        ), {}),
                    description: command.description(locale.get('en')),
                    descriptionLocalizations: locale
                        .filter((_, i) => (i !== 'en'))
                        .reduce((acc, e) => ({...acc, [e.code]: command.description(e)}), {}),
                    options: command.slashOptions,
                } : {
                    name: command.contextName,
                    nameLocalizations: locale
                        .filter((_, i) => (i !== 'en'))
                        .reduce((acc, e) => (
                            e.get(`${command.name}ContextName`)
                            ? {...acc, [e.code]: e.get(`${command.name}ContextName`)}
                            : acc
                        ), {}),
                }),
            });
            await interaction.reply(channelLanguage.get('deploySuccess', [slash.name, slash.type]));
        }
        catch(e){
            console.error(e);
            await interaction.reply(channelLanguage.get('deployFail', [command.name, type]));
        }
    },
    editSlash: async (interaction, args) => {
        const commands = require('.');
        const {channelLanguage} = interaction;
        const type = parseInt(args.type, 10);
        if(
            !args.slash_name ||
            !args.command_name ||
            ![
                ApplicationCommandType.ChatInput,
                ApplicationCommandType.User,
                ApplicationCommandType.Message,
            ].includes(type)
        ) throw new Error('Invalid slash command options');
        const command = commands.get(args.command_name);
        const slash = (
            (process.env.NODE_ENV === 'production')
            ? interaction.client.application
            : interaction.guild
        ).commands.cache.get(args.slash_name);
        if(!command || !slash) return interaction.reply({
            content: channelLanguage.get('invalidCommand'),
            ephemeral: true,
        });
        try{
            await slash.edit({
                defaultMemberPermissions: command.perm,
                dmPermission: !command.guildOnly,
                ...((slash.type === ApplicationCommandType.ChatInput) ? {
                    name: command.name,
                    nameLocalizations: locale
                        .filter((_, i) => (i !== 'en'))
                        .reduce((acc, e) => (
                            e.get(`${command.name}LocalisedName`)
                            ? {...acc, [e.code]: e.get(`${command.name}LocalisedName`)}
                            : acc
                        ), {}),
                    description: command.description(locale.get('en')),
                    descriptionLocalizations: locale
                        .filter((_, i) => (i !== 'en'))
                        .reduce((acc, e) => ({...acc, [e.code]: command.description(e)}), {}),
                    options: command.slashOptions,
                } : {
                    name: command.contextName,
                    nameLocalizations: locale
                        .filter((_, i) => (i !== 'en'))
                        .reduce((acc, e) => (
                            e.get(`${command.name}ContextName`)
                            ? {...acc, [e.code]: e.get(`${command.name}ContextName`)}
                            : acc
                        ), {}),
                })
            });
            await interaction.reply(channelLanguage.get('deploySuccess', [slash.name, slash.type]));
        }
        catch(e){
            console.error(e);
            await interaction.reply(channelLanguage.get('deployFail', [slash.name, slash.type]));
        }
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'add',
            description: 'Add a new command',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'type',
                    description: 'The type of this command',
                    required: true,
                    choices: [
                        {
                            name: 'Chat command',
                            value: ApplicationCommandType.ChatInput.toString(),
                        },
                        {
                            name: 'User context menu command',
                            value: ApplicationCommandType.User.toString(),
                        },
                        {
                            name: 'Message context menu command',
                            value: ApplicationCommandType.Message.toString(),
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'name',
                    description: 'The name of this command',
                    required: true,
                    autocomplete: true,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'edit',
            description: 'Edit an existing command',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'type',
                    description: 'The type of this command',
                    required: true,
                    choices: [
                        {
                            name: 'Chat command',
                            value: ApplicationCommandType.ChatInput.toString(),
                        },
                        {
                            name: 'User context menu command',
                            value: ApplicationCommandType.User.toString(),
                        },
                        {
                            name: 'Message context menu command',
                            value: ApplicationCommandType.Message.toString(),
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'slash_name',
                    description: 'Registered slash command name',
                    required: true,
                    autocomplete: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'command_name',
                    description: 'Internal command name',
                    required: true,
                    autocomplete: true,
                },
            ],
        },
    ],
    addAutocomplete: {
        name: (interaction, value) => interaction.respond(
            require('.')
                .filter(e => e.name.startsWith(value.toLowerCase()))
                .first(25)
                .map(e => ({
                    name: e.name,
                    value: e.name,
                }))
        ),
    },
    editAutocomplete: {
        slash_name: (interaction, value) => interaction.respond(
            (
                (process.env.NODE_ENV === 'production')
                ? interaction.client.application
                : interaction.client.guilds.cache.get(process.env.DEV_GUILD)
            ).commands.cache
                .filter(e => (
                    e.name.toLowerCase().startsWith(value.toLowerCase()) &&
                    (e.type === parseInt(interaction.options.data[0].options.find(ee => (ee.name === 'type')).value, 10))
                ))
                .first(25)
                .map(e => ({
                    name: e.name,
                    value: e.id,
                }))
        ),
        command_name: (interaction, value) => interaction.respond(
            require('.')
                .filter(e => e.name.startsWith(value.toLowerCase()))
                .first(25)
                .map(e => ({
                    name: e.name,
                    value: e.name,
                }))
        ),
    },
};