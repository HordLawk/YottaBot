module.exports = {
    active: true,
    name: 'atwood',
    description: lang => lang.get('atwoodDescription'),
    cooldown: 1,
    categoryID: 5,
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        await interaction.reply(channelLanguage.get('atwoodsLaw'));
    },
};