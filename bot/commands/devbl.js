const user = require('../../schemas/user.js');

module.exports = {
    active: true,
    name: 'devbl',
    description: () => 'Blacklist an user from using YottaBot',
    dev: true,
    args: true,
    usage: () => ['<add/rem> (user id)'],
    executeSlash: async (interaction, args) => {
        await user.findByIdAndUpdate(args.target.id, {$set: {blacklisted: args.add}}, {
            upsert: true,
            setDefaultsOnInsert: true,
        });
        interaction.reply(`The user ${args.target} had their \`blacklisted\` property set to \`${args.add}\``);
    },
    slashOptions: [
        {
            type: 'BOOLEAN',
            name: 'add',
            description: 'How to do with the user',
            required: true,
        },
        {
            type: 'USER',
            name: 'target',
            description: 'The user to be the target of the action',
            required: true,
        },
    ],
};