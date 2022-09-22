const { PermissionsBitField, ApplicationCommandOptionType, OverwriteType } = require("discord.js");
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'lock',
    description: lang => lang.get('lockDescription'),
    aliases: ['l'],
    usage: lang => [lang.get('lockUsage')],
    example: ['on'],
    cooldown: 5,
    categoryID: 3,
    perm: PermissionsBitField.Flags.ManageRoles,
    guildOnly: true,
    slashOptions: [{
        type: ApplicationCommandOptionType.Boolean,
        name: 'disable',
        nameLocalizations: utils.getStringLocales('lockOptiondisableLocalisedName'),
        description: 'Set to true to unlock the channel',
        descriptionLocalizations: utils.getStringLocales('lockOptiondisableLocalisedDesc'),
        required: false,
    }],
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(
            !interaction.guild.members.me
                .permissionsIn(interaction.channel)
                .has(PermissionsBitField.Flags.ManageRoles)
        ) await interaction.reply({
            content: channelLanguage.get('botCantLock'),
            ephemeral: true,
        });
        const roleModel = require('../../schemas/role.js');
        const roleDocs = await roleModel.find({
            guild: interaction.guild.id,
            ignoreLock: true,
        });
        const stateIgnore = args.disable || null;
        for(const roleDoc of roleDocs){
            if(
                interaction.guild.roles.cache
                    .get(roleDoc.roleID)
                    ?.comaparePositionTo(interaction.guild.members.me.roles.highest)
                <
                0
            ) await interaction.channel.permissionOverwrites.edit(roleDoc.roleID, {
                SendMessages: stateIgnore,
                SendMessagesInThreads: stateIgnore,
            }, {
                type: OverwriteType.Role,
                reason: channelLanguage.get('lockAuditReason', [args.disable, interaction.user.tag]),
            });
        }
        const stateEveryone = args.disable ? null : false;
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: stateEveryone,
            SendMessagesInThreads: stateEveryone,
        }, {
            type: OverwriteType.Role,
            reason: channelLanguage.get('lockAuditReason', [args.disable, interaction.user.tag]),
        });
        await interaction.reply(channelLanguage.get('lockSuccess', [args.disable]));
    },
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(
            !message.guild.members.me
                .permissionsIn(message.channel)
                .has(PermissionsBitField.Flags.ManageRoles)
        ) await message.reply(channelLanguage.get('botCantLock'));
        const roleModel = require('../../schemas/role.js');
        const roleDocs = await roleModel.find({
            guild: message.guild.id,
            ignoreLock: true,
        });
        const disable = args[0] === 'off';
        const stateIgnore = disable || null;
        for(const roleDoc of roleDocs){
            if(
                message.guild.roles.cache
                    .get(roleDoc.roleID)
                    ?.comaparePositionTo(message.guild.members.me.roles.highest)
                <
                0
            ) await message.channel.permissionOverwrites.edit(roleDoc.roleID, {
                SendMessages: stateIgnore,
                SendMessagesInThreads: stateIgnore,
            }, {
                type: OverwriteType.Role,
                reason: channelLanguage.get('lockAuditReason', [disable, message.author.tag]),
            });
        }
        const stateEveryone = disable ? null : false;
        await message.channel.permissionOverwrites.edit(message.guild.id, {
            SendMessages: stateEveryone,
            SendMessagesInThreads: stateEveryone,
        }, {
            type: OverwriteType.Role,
            reason: channelLanguage.get('lockAuditReason', [disable, message.author.tag]),
        });
        await message.reply(channelLanguage.get('lockSuccess', [disable]));
    },
};