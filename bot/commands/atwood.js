module.exports = {
    active: true,
    name: 'atwood',
    description: lang => lang.get('atwoodDescription'),
    cooldown: 1,
    categoryID: 5,
    executeSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        interaction.reply(channelLanguage.get('atwoodsLaw'));
    },
};