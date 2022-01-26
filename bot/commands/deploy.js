module.exports = {
    active: true,
    name: 'deploy',
    dev: true,
    args: true,
    usage: () => ['(command name) <user/message/chat_input>'],
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(!args[0] || !['chat_input', 'user', 'message'].includes(args[1])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        const command = message.client.commands.get(args[0]) || message.client.commands.find(cmd => (cmd.aliases && cmd.aliases.includes(args[0])));
        if(!command) return message.reply(channelLanguage.get('invalidCommand'));
        try{
            const scope = (process.env.NODE_ENV === 'production') ? message.client.application : message.guild;
            const slashList = await scope.commands.fetch();
            const slash = slashList.find(e => ((e.name === command.name) && (e.type.toLowerCase() === args[1])));
            if(slash){
                await slash.edit((slash.type === 'CHAT_INPUT') ? {
                    description: command.description(message.client.langs['en']),
                    options: command.slashOptions,
                } : {name: command.contextName});
            }
            else{
                const data = {
                    name: command.contextName,
                    description: '',
                    type: args[1].toUpperCase(),
                };
                if(args[1] === 'chat_input'){
                    data.name = command.name;
                    data.description = command.description(message.client.langs['en']);
                    data.options = command.slashOptions;
                }
                await scope.commands.create(data);
            }
            message.reply(channelLanguage.get('deploySuccess', [command.name, args[1]]));
        }
        catch(e){
            console.error(e);
            message.reply(channelLanguage.get('deployFail', [command.name, args[1]]));
        }
    },
};