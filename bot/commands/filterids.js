// Copyright (C) 2025  HordLawk

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

const utils = require('../utils.js');
const axios = require('axios');
const { ApplicationCommandOptionType, TextInputStyle, ComponentType } = require('discord.js');

module.exports = {
    active: true,
    name: 'filterids',
    description: lang => lang.get('filteridsDescription'),
    cooldown: 5,
    categoryID: 5,
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(args.text_file){
            if(args.text_file.size > 524288) return await interaction.reply({
                content: channelLanguage.get('fileTooBig'),
                ephemeral: true,
            });
            const res = await axios.get(args.text_file.url);
            if((typeof res.data) !== 'string') return await interaction.reply({
                content: channelLanguage.get('invalidFile'),
                ephemeral: true,
            });
            const ids = res.data.match(/(?<!\d)\d{17,19}(?!\d)/g);
            if(!ids) return await interaction.reply({
                content: channelLanguage.get('idsNotFound'),
                ephemeral: true,
            });
            await interaction.reply({files: [{
                name: 'IDs.txt',
                attachment: Buffer.from(ids.join('\n')),
            }]});
        }
        else{
            await interaction.showModal({
                customId: `filterids${interaction.id}`,
                title: 'Paste text',
                components: [{
                    type: ComponentType.ActionRow,
                    components: [{
                        type: ComponentType.TextInput,
                        customId: 'text',
                        label: channelLanguage.get('filteridsModaltextLabel'),
                        required: true,
                        style: TextInputStyle.Paragraph,
                    }],
                }],
            });
            const i = await interaction.awaitModalSubmit({
                filter: int => (int.user.id === interaction.user.id) && (int.customId === `filterids${interaction.id}`),
                time: 600_000,
            }).catch(() => null);
            if(!i) return await interaction.followUp({
                content: channelLanguage.get('modalTimeOut'),
                ephemeral: true,
            });
            const ids = i.fields.getTextInputValue('text').match(/(?<!\d)\d{17,19}(?!\d)/g);
            if(!ids) return await i.reply({
                content: channelLanguage.get('idsNotFound'),
                ephemeral: true,
            });
            await i.reply({files: [{
                name: 'IDs.txt',
                attachment: Buffer.from(ids.join('\n')),
            }]});
        }
    },
    slashOptions: [{
        type: ApplicationCommandOptionType.Attachment,
        name: 'text_file',
        nameLocalizations: utils.getStringLocales('filteridsOptiontext_fileLocalisedName'),
        description: 'A text file with Discord IDs to be filtered',
        descriptionLocalizations: utils.getStringLocales('filteridsOptiontext_fileLocalisedDesc'),
        required: false,
    }],
}