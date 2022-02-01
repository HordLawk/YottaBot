module.exports = {
    active: false,
    name: 'poll',
    description: lang => lang.get('pollDescription'),
    cooldown: 3,
    categoryID: 5,
    args: true,
    usage: lang => {},
    example: [],
    guildOnly: true,
    executeSlash: (interaction, args) => {

    },
    slashOptions: [

    ],
};