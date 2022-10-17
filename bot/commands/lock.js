const { PermissionsBitField, ApplicationCommandOptionType, OverwriteType } = require("discord.js");
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'lock',
    description: lang => lang.get('lockDescription'),
    aliases: ['l'],
    usage: lang => [lang.get('lockUsage')],
    example: ['on'],
    cooldown: 3,
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
        const stateIgnore = args.disable ? null : true;
        for(
            const discordRole
            of interaction.guild.roles.cache
                .filter(r => roleDocs.some(rds => (r.id === rds.roleID)))
                .sort((ra, rb) => (rb.position - ra.position))
                .first(
                    (
                        interaction.client.guildData.get(interaction.guild.id).premiumUntil
                        ??
                        interaction.client.guildData.get(interaction.guild.id).partner
                    )
                    ? 10
                    : 1
                )
        ){
            if(discordRole.comparePositionTo(interaction.guild.members.me.roles.highest) < 0){
                await interaction.channel.permissionOverwrites.edit(discordRole.id, {
                    SendMessages: stateIgnore,
                    SendMessagesInThreads: stateIgnore,
                }, {
                    type: OverwriteType.Role,
                    reason: channelLanguage.get('lockAuditReason', [args.disable, interaction.user.tag]),
                });
            }
        }
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: !!args.disable,
            SendMessagesInThreads: !!args.disable,
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
        for(
            const discordRole
            of message.guild.roles.cache
                .filter(r => roleDocs.some(rds => (r.id === rds.roleID)))
                .sort((ra, rb) => (rb.position - ra.position))
                .first(
                    (
                        message.client.guildData.get(message.guild.id).premiumUntil
                        ??
                        message.client.guildData.get(message.guild.id).partner
                    )
                    ? 10
                    : 1
                )
        ){
            if(discordRole.comaparePositionTo(message.guild.members.me.roles.highest) < 0){
                await message.channel.permissionOverwrites.edit(discordRole.id, {
                    SendMessages: stateIgnore,
                    SendMessagesInThreads: stateIgnore,
                }, {
                    type: OverwriteType.Role,
                    reason: channelLanguage.get('lockAuditReason', [disable, message.author.tag]),
                });
            }
        }
        await message.channel.permissionOverwrites.edit(message.guild.id, {
            SendMessages: disable,
            SendMessagesInThreads: disable,
        }, {
            type: OverwriteType.Role,
            reason: channelLanguage.get('lockAuditReason', [disable, message.author.tag]),
        });
        await message.reply(channelLanguage.get('lockSuccess', [disable]));
    },
};