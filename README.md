# YottaBot
**[Invite me to your server](https://discord.com/oauth2/authorize?client_id=371902120561082368&permissions=2147483647&scope=bot+applications.commands)**

**[Join the support server](https://discord.gg/eNcsvsy)**

[![DevServer](https://discordapp.com/api/guilds/476244157245947904/widget.png?style=shield)](https://discord.gg/eNcsvsy)

## Get started
Like any other bot, the `help` command will list all the other commands and using `help (command)` will show you the correct usage for a specified command, note that all non slash commands have to be prefixed with your server's prefix ~~(duh)~~ and the default prefix is `y!`

It is recommended to first have a look at the `configs` command so you can customize the bot's behaviour to your liking before using its features

The default permission for any command is usually the closest normal Discord permission you would need to have to do whatever a command does without using the bot, for example, the default required permission for the `rolemenu` command is Manage Roles, because that is the permission you would need to have to manually give roles to a member, however, you might not want to give this dangerous permission to every staff member you want to be able to create selfrole menus, in this case, the `perm` command will let you overwrite the default permission requirements for any command

## Wiki
* [Glossary](https://github.com/HordLawk/YottaBot/wiki/Glossary)
* [Information](https://github.com/HordLawk/YottaBot/wiki/Information)
* [Administration](https://github.com/HordLawk/YottaBot/wiki/Administration)
* [Moderation](https://github.com/HordLawk/YottaBot/wiki/Moderation)
* [Levelling](https://github.com/HordLawk/YottaBot/wiki/Levelling)
* [Miscellaneous](https://github.com/HordLawk/YottaBot/wiki/Miscellaneous)
* [Premium](https://github.com/HordLawk/YottaBot/wiki/Premium)
* [Privacy Policy](https://github.com/HordLawk/YottaBot/wiki/Privacy-Policy)
* [Terms of Service](https://github.com/HordLawk/YottaBot/wiki/Terms-of-Service)

## Selfhosting
You may selfhost (AKA run your own instance of) this bot under the following circumstances:
- Your instance (referred to as a "clone") must be **private**.
    - As such, your clone must not be listed on any sort of public bot listing.
- You understand that no support will be provided to aid you in self-hosting.
- You agree to not submit any issues, features, or pull requests related to bugs exclusively related to self-hosting.

## W.I.P
- [ ] use slash commands; context menus; buttons; and stuff *
- [x] setup a patreon
- [ ] add rss feeds for youtube notifications *
- [ ] `prune` command *
- [ ] command to edit slowmode *
- [ ] command to delete cases *
- [ ] `poll` command ** \*** \**** 
- [ ] command to manage emojis *
- [ ] automated punishments when reaching a chosen amount of another type of punishment *
- [ ] other streaming notifications for premium *
- [ ] create and edit role menus with built in forms \*** \****
- [ ] button to edit action reason in the command reply ***
- [ ] logs for newly joined member with a button to ban them
- [x] show stickers in deleted messages logs
- [x] command to extract an image from a sticker with a button to add them
- [ ] command to add a sticker from an attachment * \*\****
- [ ] message context menu that shows previous versions of the target message *

\* on hold until Discord improves slash permissions

** on hold until Discord adds the date and time option type

*** on hold until discord.js adds support for modal interactions

\**** on hold until Discord adds select menus for modals

\*\**** on hold until Discord adds the file option type

## Credits
- [@elloramir](https://github.com/elloramir) for helping me with a lot issues I had in the early stages of development (I was dumb(er))
- [@Rox0z](https://github.com/Rox0z) for having coded the base of the slash commands handler I use for YottaBot while I was being lazy