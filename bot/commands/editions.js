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

const {
    PermissionsBitField,
    EmbedBuilder,
    ApplicationCommandOptionType,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const { handleComponentError } = require('../utils.js');

module.exports = {
    active: true,
    name: 'editions',
    description: lang => lang.get('editionsDescription'),
    cooldown: 5,
    categoryID: 2,
    perm: PermissionsBitField.Flags.Administrator,
    guildOnly: true,
    storageSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guildModel = require('../../schemas/guild.js');
        await guildModel.findByIdAndUpdate(
            interaction.guild.id,
            {
                $set: {
                    storeEditions: (interaction.client.guildData.get(interaction.guild.id).storeEditions = args.enable),
                },
            }
        );
        await interaction.reply(channelLanguage.get('storageSuccess', [args.enable]));
    },
    wipeSlash: async interaction => {
        const {channelLanguage} = interaction;
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
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonConfirm, buttonCancel],
        }];
        const reply = await interaction.reply({
            content: channelLanguage.get('wipeEditionsConfirm'),
            components,
            fetchReply: true,
        });
        const collector = reply.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
            idle: 10000,
            max: 1,
            componentType: ComponentType.Button,
        });
        collector.on('collect', i => (async i => {
            switch(i.customId){
                case 'cancel': {
                    await i.reply({content: channelLanguage.get('cancelled')});
                }
                break;
                case 'confirm': {
                    const editionModel = require('../../schemas/edition.js');
                    await editionModel.deleteMany({guild: interaction.guild.id});
                    await i.reply({content: channelLanguage.get('wipeEditionsSuccess')});
                }
                break;
            }
        })(i).catch(async err => await handleComponentError(err, i)));
        collector.on('end', async collected => {
            if(!reply.editable) return;
            buttonCancel.disabled = buttonConfirm.disabled = true;
            const msgData = {components};
            if(!collected.size) msgData.content = channelLanguage.get('timedOut');
            await interaction.editReply(msgData);
        });
    },
    infoSlash: async interaction => {
        const {channelLanguage} = interaction;
        const editionModel = require('../../schemas/edition.js');
        const editionsAmount = await editionModel.countDocuments({guild: interaction.guild.id});
        const premiumLike = (
            interaction.client.guildData.get(interaction.guild.id).premiumUntil
            ||
            interaction.client.guildData.get(interaction.guild.id).partner
        );
        const embed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setAuthor({
                name: channelLanguage.get('editionsinfoEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setTimestamp()
            .setDescription(
                channelLanguage.get(
                    'editionsinfoEmbedDescription',
                    [
                        interaction.client.guildData.get(interaction.guild.id).storeEditions,
                        editionsAmount,
                        premiumLike
                    ]
                )
            );
        const replyData = {embeds: [embed]};
        if(!premiumLike) replyData.content = channelLanguage.get('nonPremiumStorage');
        await interaction.reply(replyData);
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'storage',
            description: 'Sets if edited messages should be stored for later viewing',
            options: [{
                type: ApplicationCommandOptionType.Boolean,
                name: 'enable',
                description: 'Whether edited messages should be stored or not',
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'wipe',
            description: 'Requests deletion of all stored previously edited messages from this server',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            description: 'Shows information on the current state of the edited messages storing functionality in ' +
                         'this server',
        },
    ],
};