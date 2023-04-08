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

const { TextInputStyle, ComponentType, EmbedBuilder } = require("discord.js");
const {inspect} = require('node:util');

module.exports = {
    active: true,
    name: 'eval',
    description: () => 'Directly evaluates JavaScript code',
    dev: true,
    args: true,
    usage: () => ['(code)'],
    execute: async message => {
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setAuthor({
                name: 'eval',
                iconURL: message.client.user.avatarURL(),
            })
            .setDescription(`\`\`\`ansi\n${inspect(eval(message.content.replace(/^\S+\s+/, '')), {
                depth: 1,
                colors: true,
                maxArrayLength: 3,
                breakLength: 62,
                numericSeparator: true,
            })}\`\`\``);
        await message.reply({embeds: [embed]});
    },
    executeSlash: async interaction => {
        await interaction.showModal({
            customId: `eval${interaction.id}`,
            title: 'eval',
            components: [{
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.TextInput,
                    customId: 'code',
                    label: 'Code',
                    placeholder: 'console.log("Hello, World!");',
                    required: true,
                    style: TextInputStyle.Paragraph,
                }],
            }],
        });
        const i = await interaction.awaitModalSubmit({
            filter: i => (
                (i.customId === `eval${interaction.id}`)
                &&
                (i.user.id === interaction.client.application.owner.id)
            ),
            time: 600_000,
        }).catch(() => null);
        if(!i) return await interaction.followUp({
            content: 'Modal timed out!',
            ephemeral: true,
        });
        const code = i.fields.getTextInputValue('code');
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setAuthor({
                name: 'eval',
                iconURL: interaction.client.user.avatarURL(),
            })
            .setDescription(`\`\`\`ansi\n${inspect(eval(code), {
                depth: 1,
                colors: true,
                maxArrayLength: 3,
                breakLength: 62,
                numericSeparator: true,
            })}\`\`\``)
            .addFields({
                name: 'Code',
                value: `\`\`\`js\n${code}\`\`\``,
            });
        await i.reply({
            embeds: [embed],
            ephemeral: true,
        });
    },
};