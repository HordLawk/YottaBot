const { TextInputStyle, ComponentType } = require("discord.js");

module.exports = {
    active: true,
    name: 'eval',
    description: () => 'Directly evaluates JavaScript code',
    dev: true,
    args: true,
    usage: () => ['(code)'],
    execute: async message => eval(message.content.replace(/^\S+\s+/, '')),
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
        await i.reply({
            content: 'Executing code...',
            ephemeral: true,
        });
        eval(i.fields.getTextInputValue('code'));
    },
};