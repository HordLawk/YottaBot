module.exports = {
    lang: 'en',
    get: (line, vars = []) => {
        switch(line){
            case 'mentionHelp': return `Use \`${vars[0]}help\` to see all my commands!`;
            case 'noArgs': return `You didn't provide any arguments, ${vars[0]}!\nThe proper usage would be:\n${vars[3].map(e => `\`${vars[1]}${vars[2]} ${e}\``).join('\n')}`;
            case 'cooldown': return `Please wait ${vars[0]} more second(s) before reusing the \`${vars[1]}\` command${vars[3] ? '' : `\nTip: Premium servers have half the cooldown for all commands\nTo get __premium__ use \`${vars[2]}premium\``}`;
            case 'error': return `There was an error trying to execute the command \`${vars[0]}\`\nThe issue was sent to the support team and will be fixed in the near future`;
            case 'helpDescription': return 'Lists all commands or gives info about a specific one';
            case 'helpUsage': return '[(command)]';
            case 'pingDescription': return 'Ping!';
            case 'pruneDescription': return 'Deletes a given amount of messages';
            case 'pruneUsage': return '(amount)';
            case 'botEmbed': return 'I need permission to embed links in this channel';
            case 'botManageMessages': return 'I need permission to manage messages in this channel';
            case 'helpEmbedTitle': return 'Commands help';
            case 'helpEmbedDescription': return `**[Support server](https://discord.gg/${vars[0]})**\n**[Invite me](${vars[1]})**\nUse \`${vars[2]}help (command)\` for more info about a specific command\n\n__Note that:__\n- \`(channel)\` = \`<(channel mention)/(channel ID)>\`\n- \`(user)\` = \`<(user mention)/(user ID)>\`\n- \`(role)\` = \`<(role mention)/(role ID)/(role name)>\`\n- \`(emoji)\` = \`<(emoji)/(custom emoji name)/(custom emoji ID)>\``;
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
            case 'average': return 'Connection';
            case 'current': return 'Response';
            case 'invalidValue': return `Invalid value. ${vars[0]}`;
            case 'maintenance': return 'Currently in maintenance, try again later';
            case 'guildOnly': return 'This command is server only';
            case 'forbidden': return 'You do not have permission to use this command';
            case 'disabled': return 'This command is disabled in this channel';
            case 'permDescription': return 'Allow or deny specific roles from using a command';
            case 'permUsage0': return '<allow/deny/default> <(role mention)/(role ID)/"(role name)"> (list of commands)';
            case 'permUsage1': return 'view <(role mention)/(role ID)/"(role name)">';
            case 'ADMINISTRATOR': return 'Administrator';
            case 'MANAGE_ROLES': return 'Manage Roles';
            case 'BAN_MEMBERS': return 'Ban Members';
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
            case 'msgexpDescription': return 'Manages this server\'s xp system';
            case 'msgexpUsage0': return '<enable/stack> <on/off>';
            case 'msgexpUsage1': return 'roles set (role) (xp)';
            case 'msgexpUsage2': return 'roles remove <(role)/all>';
            case 'msgexpUsage3': return 'user <add/remove/set> (xp) (list of users)';
            case 'msgexpUsage4': return 'ignore role <add/remove> (role)';
            case 'msgexpUsage5': return 'ignore channel <add/remove> (channel)';
            case 'msgexpUsage6': return 'notify <default/none/dm/(channel)>';
            case 'msgexpUsage7': return '<view/reset>';
            case 'xpEnable': return `Server xp system successfully ${(vars[0] === 'on') ? 'enabled': 'disabled'}`
            case 'xpStack': return `Role stacking successfully ${(vars[0] === 'on') ? 'enabled': 'disabled'}`
            case 'manageRole': return 'I need permissions to manage this role';
            case 'sameXp': return 'There is another role being rewarded at this amount of xp';
            case 'maxXpRoles': return `The maximum amount of xp roles for non premium servers is 10, but you can add more with __premium__! To understand how, use \`${vars[0]}premium\``;
            case 'setXpRole': return `**${vars[0]}** is now achieveable at **${vars[1]}** xp\nbe aware that members will only get this role when they send new messages`;
            case 'resetXpRoles': return `All xp roles were removed\nbe aware that these roles won't be automatically removed from members, if you want this, it's recommended that you delete the roles from the server so no member can have it`;
            case 'removeXpRole': return `**${vars[0]}** was removed from the xp rewards\nbe aware that this role won't be automatically removed from members, if you want this, it's recommended that you delete the role from the server so no member can have it`;
            case 'setUserXp': return 'Xp values defined';
            case 'xpIgnoreRole': return `The role **${vars[0]}** ${(vars[1] === 'add') ? 'will' : 'won\'t'} be ignored from earning xp`;
            case 'xpIgnoreChannel': return `Users ${(vars[0] === 'add') ? 'won\'t' : 'will'} be able to earn xp in ${vars[1]}`;
            case 'notifyDefault': return `New role notifications will be sent ${(vars[0] === 'dm') ? 'on DMs' : 'in the channel where the achievement happened'}`;
            case 'notifyNone': return 'No new role notifications will be sent';
            case 'notifyChannel': return `New role notifications will be sent in ${vars[0]}`;
            case 'notifyDefaultView': return '\`Same channel\`';
            case 'notifyDMView': return '\`DMs\`';
            case 'notifyNoneView': return '\`None\`';
            case 'xpViewEmbedAuthor': return 'Server xp system settings';
            case 'xpViewEmbedDesc': return `Enabled: \`${vars[0] ? 'on': 'off'}\`\nStacking: \`${vars[1] ? 'off': 'on'}\`\nNotifications: ${vars[2]}`;
            case 'xpViewRoles': return 'Achieveable roles';
            case 'xpViewIgnoredRoles': return 'Ignored roles';
            case 'xpViewIgnoredChannels': return 'Ignored channels';
            case 'resetXpConfirm': return 'This will **__RESET ALL USERS XP__** to 0, are you sure you want to proceed?';
            case 'timedOut': return 'Operation timed out';
            case 'cancelled': return 'Operation cancelled';
            case 'resetXp': return 'Server xp successfully reset';
            case 'memberManageRole': return 'You don\'t have permission to manage this role';
            case 'sendMessages': return 'I need permission to send messages in this channel';
            case 'rolemenuDescription': return 'Creates a message where users can react to claim one or more roles';
            case 'rolemenuUsage0': return 'create (channel) <(role mention)/(role ID)/"(role name)"> (emoji) [(list of roles and emojis)] [toggle]';
            case 'rolemenuUsage1': return 'edit (menu ID) <(role mention)/(role ID)/"(role name)"> (emoji) [(list of roles and emojis)] [toggle]';
            case 'maxRolesMenu': return 'The maximum amount of roles per menu is 20';
            case 'botReactions': return 'I need permission to add reactions in this channel';
            case 'maxRolemenus': return `The maximum amount of menus for non premium servers is 10, but you can add more with __premium__! To understand how, use \`${vars[0]}premium\``;
            case 'uniqueEmoji': return 'Each emoji can only be used once per menu';
            case 'loading': return 'Loading...';
            case 'rolemenuEmbedAuthor': return 'React to claim a role';
            case 'rolemenuCreated': return 'Rolemenu successfully created';
            case 'menu404': return 'Menu not found';
            case 'rolemenuEdited': return 'Rolemenu successfully edited';
            case 'configsDescription': return 'General server settings';
            case 'configsUsage0': return 'prefix (new prefix)';
            case 'configsUsage1': return 'language <en/pt>';
            case 'configsUsage2': return 'view';
            case 'longPrefix': return 'A prefix can\'t have more than 10 characters';
            case 'newPrefix': return 'Server prefix updated';
            case 'lang404': return 'Language not supported';
            case 'newLang': return 'Server language updated';
            case 'configsEmbedAuthor': return 'Server settings';
            case 'configsEmbedDesc': return `Prefix: \`${vars[0]}\`\nLanguage: \`${vars[1]}\`\nLog attachments: \`${vars[2] ? 'on' : 'off'}\`\nWarn log channel: ${vars[3].warn ? `<#${vars[3].warn}>` : '`none`'}\nMute log channel: ${vars[3].mute ? `<#${vars[3].mute}>` : '`none`'}\nKick log channel: ${vars[3].kick ? `<#${vars[3].kick}>` : '`none`'}\nBan log channel: ${vars[3].ban ? `<#${vars[3].ban}>` : '`none`'}\nDays of messages to delete on ban: \`${vars[4]}\`\nMute role: ${vars[5] ? `<@&${vars[5]}>` : '`none`'}\nAuto setup mute: \`${vars[6] ? 'on' : 'off'}\``;
            case 'betaCommand': return 'This command is currently only available for servers that enabled open beta features in the bot settings';
            case 'premiumCommand': return `This command is a premium feature, use \`${vars[0]}premium\` for more information on becoming premium`;
            case 'botWebhooks': return 'I need permission to manage webhooks in this channel';
            case 'executor': return `\nExecutor: ${vars[0]}`;
            case 'delmsgEmbedFooter': return `${vars[0]} | Original message sent at:`;
            case 'delmsgEmbedAuthor': return 'Deleted message';
            case 'delmsgEmbedDesc': return `Author: ${vars[0]}\nChannel: ${vars[1]}${vars[2]}`;
            case 'delmsgEmbedContent': return 'Content';
            case 'delmsgEmbedAttachmentsTitle': return 'Attachments';
            case 'delmsgEmbedAttachmentsMedia': return `**[Attachment-${vars[0]}-Media](${vars[1]})**`;
            case 'delmsgEmbedAttachmentsFile': return `**[Attachment-${vars[0]}-File](${vars[1]})**`;
            case 'actionlogsDescription': return 'Manages action logs for the server';
            case 'actionlogsUsage0': return 'defaultchannel (channel)';
            case 'actionlogsUsage1': return 'set delmsg <(channel)/default>';
            case 'actionlogsUsage2': return 'ignore channel <add/remove> (channel) <delmsg/all>';
            case 'actionlogsUsage3': return 'ignore channel view (channel)';
            case 'actionlogsUsage4': return 'ignore role <add/remove> (role) <delmsg/all/view>';
            case 'actionlogsUsage5': return 'ignore role view (role)';
            case 'newDefaultHookReason': return 'Default log channel webhook';
            case 'oldDefaultHookReason': return 'Old default log channel webhook';
            case 'newDefaultLog': return `Default log channel set to ${vars[0]}`;
            case 'noDefaultLog': return 'Default log channel not defined';
            case 'oldHookReason': return `Old ${vars[0]} log channel webhook`;
            case 'newDefaultLogSuccess': return 'This action was set to log in the default log channel';
            case 'newHookReason': return `${vars[0]} log channel webhook`;
            case 'newLogSuccess': return `This action was set to log in ${vars[0]}`;
            case 'removeLogSuccess': return 'This action won\'t be logged';
            case 'noIgnoredActionsChannel': return 'No action is being ignored in this channel'
            case 'ignoredActionsChannelEmbedAuthor': return 'Ignored channel';
            case 'ignoredActionsChannelEmbedDesc': return `Channel: ${vars[0]}`;
            case 'ignoredActionsEmbedFooter': return `${vars[0]} ignored actions`;
            case 'ignoredActionsEmbedActionsTitle': return 'Actions';
            case 'actiondelmsg': return '**deleted messages**';
            case 'noIgnoredActionsRole': return 'No actions are being ignored for this role';
            case 'ignoredActionsRoleEmbedAuthor': return 'Ignored role';
            case 'ignoredActionsRoleEmbedDesc': return `Role: ${vars[0]}`;
            case 'allActionsIgnoredChannelSuccess': return `All actions will be ignored in ${vars[0]}`;
            case 'noActionsIgnoredChannelSuccess': return `No actions will be ignored in ${vars[0]}`;
            case 'allActionsIgnoredRoleSuccess': return `All actions will be ignored for **${vars[0]}**`;
            case 'noActionsIgnoredRoleSuccess': return `No actions will be ignored for **${vars[0]}**`;
            case 'actionIgnoredChannelSuccess': return `**${vars[0]}** will be ignored in ${vars[1]}`;
            case 'actionNotIgnoredChannelSuccess': return `**${vars[0]}** won't be ignored in ${vars[1]}`;
            case 'actionIgnoredRoleSuccess': return `**${vars[0]}** will be ignored for **${vars[1]}**`;
            case 'actionNotIgnoredRoleSuccess': return `**${vars[0]}** won't be ignored for **${vars[1]}**`;
            case 'logsViewEmbedAuthor': return 'Action logs info';
            case 'logsViewEmbedDesc': return `Default channel: ${vars[0] ? `<#${vars[0].channelID}>` : '\`none\`'}`;
            case 'logsViewEmbedActionsTitle': return 'Logged actions';
            case 'logsViewEmbedActions': return `**${vars[0]}** - ${vars[1] ? `<#${vars[1]}>` : '`Default`'}`
            case 'logsViewEmbedIgnoredChannelsTitle': return 'Ignored channels';
            case 'logsViewEmbedIgnoredRolesTitle': return 'Ignored roles';
            case 'logsViewEmbedIgnoredSome': return 'Some';
            case 'logsViewEmbedIgnoredAll': return 'All';
            case 'logattachmentsBadArgs': return 'Choose to turn this setting `on` or `off`';
            case 'logattachmentsNoHook': return 'Choose a channel to log deleted messages first';
            case 'logattachmentsNoNSFW': return 'To use this settings your deleted messages log channel needs to be set to NSFW';
            case 'logattachmentsOnSuccess': return 'Attachments will be logged';
            case 'logattachmentsOffSuccess': return 'Attachments will not be logged';
            case 'premiumDescription': return 'Information on becoming premium';
            case 'alreadyPremium': return 'This server already has access to premium features';
            case 'premiumEmbedDesc': return `Buying premium status is not ready yet, if you wish to apply for partnership or pay for premium directly **[join the support server](https://discord.gg/${vars[0]})** and contact the developers`;
        }
    },
};