module.exports = {
    active: true,
    name: 'deploy',
    dev: true,
    args: true,
    usage: () => '(commandName) [user/message/chat_input]',
    execute: async (message, args) => {
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(!args[0] || !['chat_input', 'user', 'message'].includes(args[1])) return message.reply(channelLanguage.get('invalidCommand'));
        const command = message.client.commands.get(args[0]) || message.client.commands.find(cmd => (cmd.aliases && cmd.aliases.includes(args[0])));
        if(!command) return message.reply(channelLanguage.get('invalidCommand'));
        try{
            const scope = (process.env.NODE_ENV === 'production') ? message.client.application : message.guild;
            const slash = scope.commands.cache.find(e => ((e.name === command.name) && (e.type.toLowerCase() === args[1])));
            if(slash){
                const data = {defaultPermission: !command.dev};
                if(slash.type === 'CHAT_INPUT'){
                    data.description = command.description(message.client.langs['en']);
                    data.options = command.slashOptions;
                }
                await slash.edit(data);
            }
            else{
                const data = {
                    name: command.name,
                    description: '',
                    type: args[1].toUpperCase(),
                    defaultPermission: !command.dev,
                };
                if(args[1] === 'chat_input'){
                    data.description = command.description(message.client.langs['en']);
                    data.options = command.slashOptions;
                }
                const newCommand = await scope.commands.create(data);
                newCommand.permissions.add({permissions: [{
                    id: message.client.application.owner.id,
                    type: 'USER',
                    permission: true,
                }]});
            }
            message.reply(channelLanguage.get('deploySuccess', [command.name, args[1]]));
        }
        catch(e){
            console.error(e);
            message.reply(channelLanguage.get('deployFail', [command.name, args[1]]));
        }
    },
};