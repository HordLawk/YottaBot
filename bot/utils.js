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

const { ApplicationCommandOptionType, UserFlags } = require('discord.js');
const locale = require('../locale');
const configs = require('./configs');
const {inspect} = require('node:util');

const getStringLocales = key => locale.reduce((acc, e) => e.get(key) ? {...acc, [e.code]: e.get(key)} : acc, {});

const timeSpanChoices = (value, locale, maxSeconds, div = 1) => {
    const choices = [];
    if((!maxSeconds || (value <= maxSeconds)) && (div == 1)){
        choices.push({name: locale.get('timeAmountSeconds', [value]), value});
    }
    if((!maxSeconds || (value <= (maxSeconds / 60))) && (div <= 60)) choices.push({
        name: locale.get('timeAmountMinutes', [value]),
        value: (value * 60) / div,
    });
    if((!maxSeconds || (value <= (maxSeconds / (60 * 60)))) && (div <= (60 * 60))) choices.push({
        name: locale.get('timeAmountHours', [value]),
        value: (value * 60 * 60) / div,
    });
    if((!maxSeconds || (value <= (maxSeconds / (24 * 60 * 60)))) && (div <= (24 * 60 * 60))) choices.push({
        name: locale.get('timeAmountDays', [value]),
        value: (value * 24 * 60 * 60) / div,
    });
    return choices;
};

const slashCommandUsages = (name, client, subcmdname, subsubcmdname) => {
    const slashCmd = (
        (process.env.NODE_ENV === 'production')
        ? client.application
        : client.guilds.cache.get(process.env.DEV_GUILD)
    ).commands.cache.find(slash => (slash.name === name));
    if(!slashCmd) return;
    if(subcmdname){
        if(subsubcmdname) return `</${slashCmd.name} ${subcmdname} ${subsubcmdname}:${slashCmd.id}>`;
        const subCommand = slashCmd.options.find(opt => (opt.name === subcmdname));
        if(!subCommand) return;
        return (
            (subCommand.type === ApplicationCommandOptionType.SubcommandGroup)
            ? subCommand.options
                .map(subsubcmd => `</${slashCmd.name} ${subCommand.name} ${subsubcmd.name}:${slashCmd.id}>`)
                .join('\n')
            : `</${slashCmd.name} ${subCommand.name}:${slashCmd.id}>`
        );
    }
    const subCommands = slashCmd.options.filter(opt => (opt.type <= ApplicationCommandOptionType.SubcommandGroup));
    return (
        subCommands.length
        ? subCommands
            .map(subcmd => {
                return (
                    (subcmd.type === ApplicationCommandOptionType.Subcommand)
                    ? `</${slashCmd.name} ${subcmd.name}:${slashCmd.id}>`
                    : subcmd.options
                        .map(subsubcmd => `</${slashCmd.name} ${subcmd.name} ${subsubcmd.name}:${slashCmd.id}>`)
                        .join('\n')
                );
            })
            .join('\n')
        : `</${slashCmd.name}:${slashCmd.id}>`
    );
}

const userBadgesString = user => {
    const validFlagsArray = (
        user.flags
            ?.remove(UserFlags.Quarantined + UserFlags.TeamPseudoUser + UserFlags.Spammer)
            .toArray()
        ??
        []
    );
    const badges = {
        Staff: '<:staff:967043602012315658>',
        Partner: '<:partner:967043547561852978>',
        Hypesquad: '<:hs:967048946612572160>',
        BugHunterLevel1: '<:bughunter:967043119407329311>',
        HypeSquadOnlineHouse1: '<:bravery:967043119780610058>',
        HypeSquadOnlineHouse2: '<:brilliance:967043119780597860>',
        HypeSquadOnlineHouse3: '<:balance:967043119809974272>',
        PremiumEarlySupporter: '<:earlysupporter:967043119717699665>',
        BugHunterLevel2: '<:bughunter2:967043119759642694>',
        VerifiedDeveloper: '<:botdev:967043120984391752>',
        CertifiedModerator: '<:mod:967043119788994610>',
        VerifiedBot: '<:verifiedbot:967049829568090143>',
        BotHTTPInteractions: '<:bot:967062591190995004>',
    };
    const userBadges = validFlagsArray.map(e => badges[e]);
    if(!user.flags.any(UserFlags.VerifiedBot + UserFlags.BotHTTPInteractions) && user.bot){
        userBadges.push('<:bot:967062591190995004>');
    }
    return userBadges.join(' ').trim();
}

const handleComponentError = async (err, i) => {
    console.error(err);
    if(process.env.NODE_ENV === 'production') await i.client.shard.broadcastEval(async (c, {channelId, msgData}) => {
        const channel = c.channels.cache.get(channelId);
        if(channel) await channel.send(msgData).catch(console.error);
    }, {context: {
        channelId: configs.errorlog,
        msgData: {
            content: `Error: *${err.message}*\n` +
                    `Component ID: ${i.customId}\n` +
                    `Interaction User: ${i.user}\n` +
                    `Interaction ID: ${i.id}`,
            files: [{
                name: 'stack.log',
                attachment: Buffer.from(err.stack),
            }],
        },
    }});
    const channelLanguage = locale.get((i.locale === 'pt-BR') ? 'pt' : 'en');
    const msgData = {
        content: channelLanguage.get('componentError'),
        ephemeral: true,
    };
    if(i.deferred){
        await i.editReply({
            content: channelLanguage.get('componentError'),
            files: [],
            embeds: [],
            components: [],
        }).catch(() => {});
    }
    else if(i.replied){
        await i.followUp(msgData).catch(() => {});
    }
    else{
        await i.reply(msgData).catch(() => {});
    }
}

const handleEventError = async (err, e, args, client) => {
    console.error(err);
    console.log(e.name);
    console.log(args);
    if(process.env.NODE_ENV === 'production') await client.shard.broadcastEval(async (c, {channelId, msgData}) => {
        const channel = c.channels.cache.get(channelId);
        if(channel) await channel.send(msgData).catch(console.error);
    }, {context: {
        channelId: configs.errorlog,
        msgData: {
            content: `Error: *${err.message}*\nEvent: ${e.name}`,
            files: [
                {
                    name: 'args.js',
                    attachment: Buffer.from(inspect(args, {
                        depth: Infinity,
                        maxArrayLength: Infinity,
                        maxStringLength: Infinity,
                        breakLength: 98,
                        numericSeparator: true,
                    })),
                },
                {
                    name: 'stack.log',
                    attachment: Buffer.from(err.stack),
                },
            ],
        },
    }});
    if(e.name === 'ready') process.exit(1);
}

module.exports = {
    getStringLocales,
    timeSpanChoices,
    slashCommandUsages,
    userBadgesString,
    handleComponentError,
    handleEventError,
};