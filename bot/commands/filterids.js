const locale = require('../../locale');
const axios = require('axios');

const getStringLocales = key => [...locale.values()].reduce((acc, e) => e.get(key) ? {...acc, [e.code]: e.get(key)} : acc, {});

module.exports = {
    active: true,
    name: 'filterids',
    description: lang => lang.get('filteridsDescription'),
    cooldown: 3,
    categoryID: 5,
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(args.text_file){
            if(args.text_file.size > 102400) return await interaction.reply({
                content: channelLanguage.get('fileTooBig'),
                ephemeral: true,
            });
            const res = await axios.get(args.text_file.url);
            if((typeof res.data) !== 'string') return await interaction.reply({
                content: channelLanguage.get('invalidFile'),
                ephemeral: true,
            });
            await interaction.reply({files: [{
                name: 'IDs.txt',
                attachment: Buffer.from(res.data.match(/(?<!\d)\d{17,19}(?!\d)/g).join('\n')),
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
            await i.reply({files: [{
                name: 'IDs.txt',
                attachment: Buffer.from(i.fields.getTextInputValue('text').match(/(?<!\d)\d{17,19}(?!\d)/g).join('\n')),
            }]});
        }
    },
    slashOptions: [{
        type: 'ATTACHMENT',
        name: 'text_file',
        nameLocalizations: getStringLocales('filteridsOptiontext_fileLocalisedName'),
        description: 'A text file with Discord IDs to be filtered',
        descriptionLocalizations: getStringLocales('filteridsOptiontext_fileLocalisedDesc'),
        required: false,
    }],
}