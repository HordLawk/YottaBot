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

const {PermissionsBitField, ApplicationCommandOptionType, ButtonStyle, ComponentType} = require('discord.js');
const { slashCommandUsages } = require('../utils.js');

const buildButtons = (channelLanguage, author) => {
    const buttonConfirm = {
        type: ComponentType.Button,
        label: channelLanguage.get('confirm'),
        style: ButtonStyle.Success,
        emoji: '✅',
        customId: 'confirm',
    };
    const buttonCancel = {
        type: ComponentType.Button,
        label: channelLanguage.get('cancel'),
        style: ButtonStyle.Danger,
        emoji: '❌',
        customId: 'cancel',
    };
    return {
        buttonConfirm,
        buttonCancel,
        components: [{
            type: ComponentType.ActionRow,
            components: [buttonConfirm, buttonCancel],
        }],
        collectorOptions: {
            filter: componentInteraction => (componentInteraction.user.id === author.id),
            idle: 10000,
            max: 1,
            componentType: ComponentType.Button,
        },
    };
}
const slashCollectorEnd = (buttonConfirm, buttonCancel, components, channelLanguage, interaction, reply) => (async collected => {
    if(!reply.editable) return;
    buttonCancel.disabled = buttonConfirm.disabled = true;
    const msgData = {components};
    if(!collected.size) msgData.content = channelLanguage.get('timedOut');
    await interaction.editReply(msgData);
});

module.exports = {
    active: true,
    name: 'delcases',
    description: lang => lang.get('delcasesDescription'),
    aliases: ['delmodlogs'],
    usage: lang => ['server', lang.get('delcasesUsage0'), lang.get('delcasesUsage1')], 
    example: ['user @LordHawk#0001', 'case 123'],
    cooldown: 5,
    categoryID: 1,
    args: true,
    perm: PermissionsBitField.Flags.Administrator,
    guildOnly: true,
    execute: async function(message, args){
        const {channelLanguage} = message;
        const {buttonConfirm, buttonCancel, components, collectorOptions} = buildButtons(channelLanguage, message.author);
        const collectorEnd = reply => (async collected => {
            if(!reply.editable) return;
            buttonCancel.disabled = buttonConfirm.disabled = true;
            const msgData = {components};
            if(!collected.size) msgData.content = channelLanguage.get('timedOut');
            await reply.edit(msgData);
        });
        const log = require('../../schemas/log.js');
        switch(args[0]){
            case 'server': {
                const reply = await message.reply({content: channelLanguage.get('resetServerCasesConfirm'), components});
                const collector = reply.createMessageComponentCollector(collectorOptions);
                collector.on('collect', i => (async i => {
                    switch(i.customId){
                        case 'cancel': {
                            await i.reply({content: channelLanguage.get('cancelled')});
                        }
                        break;
                        case 'confirm': {
                            await log.deleteMany({guild: message.guild.id});
                            await i.reply({content: channelLanguage.get('resetServerCasesSuccess')});
                        }
                        break;
                    }
                })(i).catch(err => message.client.handlers.button(err, i)));
                collector.on('end', collectorEnd(reply));
            }
            break;
            case 'user': {
                if(!args[1]){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: slashCommandUsages(this.name, message.client, 'user')},
                        ),
                    );
                }
                const id = args[1].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
                if(!id) return message.reply(channelLanguage.get('invUser'));
                const user = await message.client.users.fetch(id).catch(() => null);
                if(!user) return message.reply(channelLanguage.get('invUser'));
                const reply = await message.reply({content: channelLanguage.get('resetUserCasesConfirm', [user]), components});
                const collector = reply.createMessageComponentCollector(collectorOptions);
                collector.on('collect', i => (async i => {
                    switch(i.customId){
                        case 'cancel': {
                            await i.reply({content: channelLanguage.get('cancelled')});
                        }
                        break;
                        case 'confirm': {
                            await log.deleteMany({
                                guild: message.guild.id,
                                target: user.id,
                            });
                            await i.reply({content: channelLanguage.get('resetUserCasesSuccess', [user])});
                        }
                        break;
                    }
                })(i).catch(err => message.client.handlers.button(err, i)));
                collector.on('end', collectorEnd(reply));
            }
            break;
            case 'case': {
                const id = parseInt(args[1]);
                if(isNaN(id) || !isFinite(id) || (id < 0)){
                    return await message.reply(
                        channelLanguage.get(
                            'invArgsSlash',
                            {usages: slashCommandUsages(this.name, message.client, 'case')},
                        ),
                    );
                }
                const caseDoc = await log.findOneAndDelete({
                    id: id,
                    guild: message.guild.id,
                });
                if(!caseDoc) return message.reply(channelLanguage.get('caseNotFound', [caseDoc.id]));
                message.reply(channelLanguage.get('caseDeletedSuccess', [caseDoc.id]));
            }
            break;
            default: {
                await message.reply(
                    channelLanguage.get('invArgsSlash', {usages: slashCommandUsages(this.name, message.client)}),
                );
            }
        }
    },
    serverSlash: async interaction => {
        const {channelLanguage} = interaction;
        const {buttonConfirm, buttonCancel, components, collectorOptions} = buildButtons(channelLanguage, interaction.user);
        const reply = await interaction.reply({
            content: channelLanguage.get('resetServerCasesConfirm'),
            components,
            fetchReply: true,
        });
        const collector = reply.createMessageComponentCollector(collectorOptions);
        collector.on('collect', i => (async i => {
            switch(i.customId){
                case 'cancel': {
                    await i.reply({content: channelLanguage.get('cancelled')});
                }
                break;
                case 'confirm': {
                    const log = require('../../schemas/log.js');
                    await log.deleteMany({guild: interaction.guild.id});
                    await i.reply({content: channelLanguage.get('resetServerCasesSuccess')});
                }
                break;
            }
        })(i).catch(err => interaction.client.handlers.button(err, i)));
        collector.on('end', slashCollectorEnd(buttonConfirm, buttonCancel, components, channelLanguage, interaction, reply));
    },
    userSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const {buttonConfirm, buttonCancel, components, collectorOptions} = buildButtons(channelLanguage, interaction.user);
        const reply = await interaction.reply({
            content: channelLanguage.get('resetUserCasesConfirm', [args.target]),
            components,
            fetchReply: true,
        });
        const collector = reply.createMessageComponentCollector(collectorOptions);
        collector.on('collect', i => (async i => {
            switch(i.customId){
                case 'cancel': {
                    await i.reply({content: channelLanguage.get('cancelled')});
                }
                break;
                case 'confirm': {
                    const log = require('../../schemas/log.js');
                    await log.deleteMany({
                        guild: interaction.guild.id,
                        target: args.target.id,
                    });
                    await i.reply({content: channelLanguage.get('resetUserCasesSuccess', [args.target])});
                }
                break;
            }
        })(i).catch(err => interaction.client.handlers.button(err, i)));
        collector.on('end', slashCollectorEnd(buttonConfirm, buttonCancel, components, channelLanguage, interaction, reply));
    },
    caseSlash: async function(interaction, args){
        const {channelLanguage} = interaction;
        if(isNaN(args.id) || !isFinite(args.id) || (args.id < 0)) return interaction.reply({
            content: channelLanguage.get('caseNotFound', [args.id]),
            ephemeral: true,
        });
        const log = require('../../schemas/log.js');
        const caseDoc = await log.findOneAndDelete({
            id: args.id,
            guild: interaction.guild.id,
        });
        if(!caseDoc) return interaction.reply({
            content: channelLanguage.get('caseNotFound', [args.id]),
            ephemeral: true,
        });
        const modlogChannel = interaction.guild.channels.cache.get(interaction.client.guildData.get(interaction.guild.id).modlogs[caseDoc.type]);
        if(modlogChannel && modlogChannel.viewable && interaction.guild.members.me.permissionsIn(modlogChannel).has(PermissionsBitField.Flags.ManageMessages)){
            const logMessage = await modlogChannel.messages.fetch({message: caseDoc.logMessage}).catch(() => null);
            if(logMessage) await logMessage.delete();
        }
        await interaction.reply(channelLanguage.get('caseDeletedSuccess', [caseDoc.id]));
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'server',
            description: 'Deletes all logged cases from the current server',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'user',
            description: 'Deletes all logged cases which have the selected user as their target',
            options: [{
                type: ApplicationCommandOptionType.User,
                name: 'target',
                description: 'The target of the cases to be deleted',
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'case',
            description: 'Deletes an specific case by its ID',
            options: [{
                type: ApplicationCommandOptionType.Integer,
                name: 'id',
                description: 'The ID of the case to be deleted',
                required: true,
                minValue: 0,
            }],
        },
    ],
}