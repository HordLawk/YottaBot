module.exports = {
    lang: 'en',
    get: (line, vars = []) => {
        switch(line){
            case 'mentionHelp': return `Use \`${vars[0]}help\` to see all my commands!`;
            case 'noArgs': return `You didn't provide any arguments, ${vars[0]}!\nThe proper usage would be:\n${vars[3].map(e => `\`${vars[1]}${vars[2]} ${e}\``).join('\n')}`;
            case 'cooldown': return `Please wait ${vars[0]} more second(s) before reusing the \`${vars[1]}\` command`;
            case 'error': return `There was an error trying to execute the command \`${vars[0]}\`!`;
            case 'helpDescription': return 'Lists all commands or gives info about a specific one';
            case 'helpUsage': return '[(command)]';
            case 'pingDescription': return 'Ping!';
            case 'pruneDescription': return 'Deletes a given amount of messages';
            case 'pruneUsage': return '(amount)';
            case 'botEmbed': return 'I need permission to embed links in this channel';
            case 'botManageMessages': return 'I need permission to manage messages in this channel';
            case 'helpEmbedTitle': return 'Commands help';
            case 'helpEmbedDescription': return `Use \`${vars[0]}help (command)\` for more info about a specific command\n\n__Note that:__\n- \`(channel)\` = \`<(channel mention)/(channel ID)>\`\n- \`(user)\` = \`<(user mention)/(user ID)>\`\n- \`(role)\` = \`<(role mention)/(role ID)/(role name)>\``;
            case 'helpEmbedFooter': return `${vars[0]} commands | [] = Optional - () = Variable - </> = Either`;
            case 'category0': return 'Commands';
            case 'invalidCommand': return 'This is not a valid command';
            case 'helpCommandEmbedTitle': return `Help for the ${vars[0]} command`;
            case 'helpCommandEmbedFooter': return '[] = Optional - () = Variable - </> = Either';
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
            case 'guildOnly': return 'This command is server only';
            case 'forbidden': return 'You do not have permission to use this command';
            case 'disabled': return 'This command is disabled in this channel';
            case 'permDescription': return 'Allow or deny specific roles from using a command';
            case 'permUsage0': return '<allow/deny/default> <(role mention)/(role ID)/"(role name)"> (list of commands)';
            case 'permUsage1': return 'view <(role mention)/(role ID)/"(role name)">';
            case 'ADMINISTRATOR': return 'Administrator';
            case 'invArgs': return `Invalid arguments!\nThe proper usage would be:\n${vars[2].map(e => `\`${vars[0]}${vars[1]} ${e}\``).join('\n')}`;
            case 'permSuccess': return `**${vars[0]}** was ${(vars[1] === 'allow') ? 'allowed to use' : 'denied from using'} these commands`;
            case 'noSpecialPerms': return 'There are no special permissions set to this role';
            case 'defaultPermsSuccess': return `Special permissions for **${vars[0]}** over these commands were removed`;
            case 'permsEmbedAuthor': return 'Special permissions';
            case 'permsAllowed': return 'Allowed commands';
            case 'permsDenied': return 'Denied commands';
            case 'disableDescription': return 'Disables commands from being used in a specific channel';
            case 'disableUsage0': return '(channel) <on/off> <(list of commands)/all>';
            case 'disableUsage1': return '(channel) view';
            case 'disableAll': return `All commands are now ${(vars[0] === 'on') ? 'disabled' : 'enabled'} on ${vars[1]}`;
            case 'disableSome': return `These commands are now ${(vars[0] === 'on') ? 'disabled' : 'enabled'} on ${vars[1]}`;
            case 'permsEmbedDesc': return `Role: ${vars[0]}`;
            case 'noDisabledCmds': return 'There are no commands disabled in this channel';
            case 'disabledEmbedAuthor': return 'Channel specific commands';
            case 'disabledEmbedDesc': return `Channel: ${vars[0]}`;
            case 'disabledField': return 'Disabled';
            case 'achieveGuild': return `Congratulations ${vars[0]}! You just achieved the role **${vars[1]}**`;
            case 'achieveDM': return `Congratulations! You just achieved the role **${vars[0]}** in the server **${vars[1]}**`;
        }
    },
};