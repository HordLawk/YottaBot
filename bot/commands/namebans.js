const {Permissions} = require('discord.js');
const utils = require('../utils.js');
const namebanModel = require('../../schemas/nameban.js');

module.exports = {
    active: false,
    name: 'namebans',
    description: lang => lang.get('namebanDescription'), // fazer locale
    cooldown: 5,
    categoryID: 3,
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
    slashOptions: [
        {
            type: 'SUB_COMMAND',
            name: 'add',
            nameLocalizations: utils.getStringLocales('namebans_addLocalisedName'), // fazer locale
            description: 'Adds text to the list of banned text in usernames',
            descriptionLocalizations: utils.getStringLocales('namebans_manageLocalisedDesc'), // fazer locale
            options: [
                {
                    type: 'STRING',
                    name: 'text',
                    nameLocalizations: utils.getStringLocales('namebans_addOptiontextLocalisedName'), // fazer locale
                    description: 'The piece of text that will be banned partially or not from the server',
                    descriptionLocalizations: utils.getStringLocales('namebans_addOptiontextLocalisedDesc'), // fazer locale
                    required: true,
                },
                {
                    type: 'BOOLEAN',
                    name: 'partial',
                    nameLocalizations: utils.getStringLocales('namebans_addOptionpartialLocalisedName'), // fazer locale
                    description: 'Whether the usernames should be exact or only contain the selected text',
                    descriptionLocalizations: utils.getStringLocales('namebans_addOptionpartialLocalisedName'), // fazer locale
                    required: false,
                },
                {
                    type: 'BOOLEAN',
                    name: 'case_sensitive',
                    nameLocalizations: utils.getStringLocales('namebans_addOptioncase_sensitiveLocalisedName'), // fazer locale
                    description: 'Whether username matching should be sensitive to casing or not',
                    descriptionLocalizations: utils.getStringLocales('namebans_addOptioncase_sensitiveLocalisedDesc'), // fazer locale
                    required: false,
                },
            ],
        },
        {
            type: 'SUB_COMMAND',
            name: 'remove',
            nameLocalizations: utils.getStringLocales('namebans_removeLocalisedName'), // fazer locale
            description: 'Removes from the list of banned text in usernames',
            descriptionLocalizations: utils.getStringLocales('namebans_removeLocalisedDesc'), // fazer locale
            options: [{
                type: 'STRING',
                name: 'text',
                nameLocalizations: utils.getStringLocales('namebans_removeOptiontextLocalisedName'), // fazer locale
                description: 'The piece of text to be removed from the list of banned usernames',
                descriptionLocalizations: utils.getStringLocales('namebans_removeOptiontextDesc'), // fazer locale
                autocomplete: true,
                required: true,
            }],
        },
        {
            type: 'SUB_COMMAND',
            name: 'list',
            nameLocalizations: utils.getStringLocales('namebans_listLocalisedName'), // fazer locale
            description: 'Lists info on all currently banned usernames',
            descriptionLocalizations: utils.getStringLocales('namebans_listLocalisedName'), // fazer locale
        },
    ],
    addSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;

    },
    removeSlash: async (interaction, args) => {

    },
    listSlash: async interaction => {

    },
    removeAutocomplete: {
        // text: (interaction, value) => 
    },
};