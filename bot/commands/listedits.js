// Copyright (C) 2023  HordLawk

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
    ButtonStyle,
    ComponentType,
    escapeCodeBlock,
    cleanContent,
} = require('discord.js');
const {sha256} = require('js-sha256');
const aesjs = require('aes-js');
const { handleComponentError } = require('../utils.js');

module.exports = {
    active: true,
    name: 'listedits',
    description: lang => lang.get('listeditsDescription'),
    cooldown: 5,
    perm: PermissionsBitField.Flags.ManageMessages,
    guildOnly: true,
    premium: true,
    contextName: 'List previous edits',
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        const edition = require('../../schemas/edition.js');
        const edits = await edition.find({messageID: interaction.targetMessage.id}).sort({timestamp: -1});
        if(!edits.length) return await interaction.reply({
            content: channelLanguage.get('noEditsFound'),
            ephemeral: true,
        });
        const pageSize = 5;
        const fields = edits.map((e, i) => {
            const aesCtr = new aesjs.ModeOfOperation.ctr(sha256.array(process.env.CRYPT_PASSWD));
            return {
                name: channelLanguage.get('listeditsEmbedVersionTitle', [edits.length - i]),
                value: channelLanguage.get(
                    'listeditsEmbedVersionValue',
                    [
                        escapeCodeBlock(
                            cleanContent(
                                aesjs.utils.utf8.fromBytes(aesCtr.decrypt(e.content)),
                                interaction.channel
                            )
                        ),
                        Math.round(e.timestamp.getTime() / 1000),
                    ]
                ),
            };
        });
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setAuthor({
                name: channelLanguage.get('listeditsEmbedAuthor'),
                iconURL: interaction.targetMessage.author.avatarURL({dynamic: true}),
            })
            .setFields(fields.slice(0, pageSize))
            .setTimestamp();
        const buttonPrevious = {
            type: ComponentType.Button,
            label: channelLanguage.get('previous'),
            style: ButtonStyle.Primary,
            emoji: '⬅',
            customId: 'previous',
            disabled: true,
        };
        const buttonNext = {
            type: ComponentType.Button,
            label: channelLanguage.get('next'),
            style: ButtonStyle.Primary,
            emoji: '➡',
            customId: 'next',
            disabled: (fields.length <= pageSize),
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonPrevious, buttonNext],
        }];
        const reply = await interaction.reply({
            embeds: [embed],
            components,
            fetchReply: true,
            ephemeral: true,
        });
        if(fields.length <= pageSize) return;
        const collector = reply.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
            time: 600000,
            componentType: ComponentType.Button,
        });
        let page = 0;
        collector.on('collect', i => (async () => {
            if(i.customId === 'next'){
                if(!fields.slice((page + 1) * pageSize).length) return;
                page++;
            }
            else{
                if(!page) return;
                page--;
            }
            embed.setFields(fields.slice(page * pageSize, (page + 1) * pageSize));
            buttonPrevious.disabled = !page;
            buttonNext.disabled = (!fields.slice((page + 1) * pageSize).length);
            await i.update({embeds: [embed], components});
        })().catch(async err => await handleComponentError(err, i)));
        collector.on('end', async () => {
            if(!reply.editable) return;
            buttonNext.disabled = buttonPrevious.disabled = true;
            await interaction.editReply({embeds: [embed], components});
        });
    },
};