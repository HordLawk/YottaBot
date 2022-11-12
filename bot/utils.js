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

const { ApplicationCommandOptionType } = require('discord.js');
const locale = require('../locale');

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

const slashCommandUsages = (name, client) => {
    const slashCmd = (
        (process.env.NODE_ENV === 'production')
        ? client.application
        : client.guilds.cache.get(process.env.DEV_GUILD)
    ).commands.cache.find(slash => (slash.name === name));
    if(!slashCmd) return;
    const subCommands = slashCmd.options.filter(opt => (opt.type <= ApplicationCommandOptionType.SubcommandGroup));
    return (
        subCommands.length
        ? subCommands
            .map(subcmd => {
                return (
                    (subcmd.type === ApplicationCommandOptionType.Subcommand)
                    ? `</${slashCmd.name} ${subcmd.name}:${slashCmd.id}>`
                    : subcmd.options
                        .filter(opt => opt.type === ApplicationCommandOptionType.Subcommand)
                        .map(subsubcmd => `</${slashCmd.name} ${subcmd.name} ${subsubcmd.name}:${slashCmd.id}>`)
                        .join('\n')
                );
            })
            .join('\n')
        : `</${slashCmd.name}:${slashCmd.id}>`
    );
}

module.exports = {getStringLocales, timeSpanChoices, slashCommandUsages};