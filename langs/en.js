module.exports = {
    lang: 'en',
    get: (line, vars = []) => {
        switch(line){
            case 'mentionHelp': return `Use \`${vars[0]}help\` to see all my commands!`;
            case 'noArgs': return `You didn't provide any arguments, ${vars[0]}!\nThe proper usage would be: \`${vars[1]}${vars[2]} ${vars[3]}\``;
            case 'cooldown': return `Please wait ${vars[0]} more second(s) before reusing the \`${vars[1]}\` command`;
            case 'error': return `There was an error trying to execute the command \`${vars[0]}\`!`;
            case 'helpDescription': return 'Lists all commands or gives info about a specific one';
            case 'helpUsage': return '[(command)]';
            case 'pingDescription': return 'Ping!';
            case 'pruneDescription': return 'Deletes a given amount of messages';
            case 'pruneUsage': return '(amount)';
            case 'prunePerm': return 'Administrator';
            case 'botEmbed': return 'I need permission to embed links in this channel';
            case 'botManageMessages': return 'I need permission to manage messages in this channel';
            case 'helpEmbedTitle': return 'Commands help';
            case 'helpEmbedDescription': return `Use \`${vars[0]}help (command)\` for more info about a specific command`;
            case 'helpEmbedFooter': return `${vars[0]} commands`;
            case 'category0': return 'Commands';
            case 'invalidCommand': return 'This is not a valid command';
            case 'helpCommandEmbedTitle': return `Help for the ${vars[0]} command`;
            case 'helpCommandEmbedFooter': return '[] = Optional - () = Variable - <|> = Either';
            case 'syntax': return 'Syntax';
            case 'example': return 'Example';
            case 'aliases': return 'Aliases';
            case 'permissionLevel': return 'Permission level';
            case 'helpCommandCooldown': return `${vars[0]} second(s)`;
            case 'terrible': return 'Terrible';
            case 'bad': return 'Bad';
            case 'normal': return 'Normal';
            case 'good': return 'Good';
            case 'average': return 'Average';
            case 'current': return 'Current';
            case 'invalidValue': return `Invalid value. ${vars[0]}`;
            case 'maintenance': return 'Currently in maintenance, try again later';
            case 'guildOnly': return 'This command is guild only';
        }
    },
};