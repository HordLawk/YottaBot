const utils = require('../utils.js');
const axios = require('axios');

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
                    type: 'ACTION_ROW',
                    components: [{
                        type: 'TEXT_INPUT',
                        customId: 'text',
                        label: channelLanguage.get('filteridsModaltextLabel'),
                        required: true,
                        style: 'PARAGRAPH',
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
        type: 'ATTACHMENT',
        name: 'text_file',
        nameLocalizations: utils.getStringLocales('filteridsOptiontext_fileLocalisedName'),
        description: 'A text file with Discord IDs to be filtered',
        descriptionLocalizations: utils.getStringLocales('filteridsOptiontext_fileLocalisedDesc'),
        required: false,
    }],
}