const { PermissionsBitField, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'lockignore',
    description: lang => lang.get('lockignoreDescription'),
    cooldown: 5,
    categoryID: 2,
    perm: PermissionsBitField.Flags.ManageRoles,
    guildOnly: true,
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'toggle',
            nameLocalizations: utils.getStringLocales('lockignore_toggleLocalisedName'),
            description: 'Toggles a role as ignored by the lock command between on and off',
            descriptionLocalizations: utils.getStringLocales('lockignore_toggleLocalisedDesc'),
            options: [{
                type: ApplicationCommandOptionType.Role,
                name: 'role',
                nameLocalizations: utils.getStringLocales('lockignore_toggleOptionroleLocalisedName'),
                description: 'The role to be toggled between ignored and not ignored',
                descriptionLocalizations: utils.getStringLocales('lockignore_toggleOptionroleLocalisedDesc'),
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'list',
            nameLocalizations: utils.getStringLocales('lockignore_listLocalisedName'),
            description: 'Lists roles ignored by the lock command',
            descriptionLocalizations: utils.getStringLocales('lockignore_listLocalisedDesc'),
        },
    ],
    toggleSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const roleModel = require('../../schemas/role.js');
        const roleDoc = await roleModel.findOneAndUpdate({
            guild: interaction.guild.id,
            roleID: args.role.id,
            ignoreLock: true,
        }, {$set: {ignoreLock: false}});
        if(roleDoc) return await interaction.reply(channelLanguage.get('lockignoreRemoveSuccess', [args.role]));
        if(interaction.guild.members.me.roles.highest.comparePositionTo(args.role) < 0) return await interaction.reply({
            content: channelLanguage.get('botCantManageRole'),
            ephemeral: true,
        });
        const roleCount = await roleModel.countDocuments({
            guild: interaction.guild.id,
            roleID: {$in: interaction.guild.roles.cache.map(r => r.id)},
            ignoreLock: true,
        });
        if(
            (roleCount > 10)
            ||
            (
                (roleCount > 0)
                &&
                !interaction.client.guildData.get(interaction.guild.id).premiumUntil
                &&
                !interaction.client.guildData.get(interaction.guild.id).partner
            )
        ) return await interaction.reply({
            content: channelLanguage.get('lockignoreTooManyRoles'),
            ephemeral: true,
        });
        await roleModel.findOneAndUpdate({
            guild: interaction.guild.id,
            roleID: args.role.id,
        }, {$set: {ignoreLock: true}}, {
            upsert: true,
            setDefaultsOnInsert: true,
        });
        await interaction.reply(channelLanguage.get('lockignoreSuccess', [args.role]));
    },
    listSlash: async interaction => {
        const {channelLanguage} = interaction;
        const roleModel = require('../../schemas/role.js');
        const roleDocs = await roleModel.find({
            guild: interaction.guild.id,
            roleID: {$in: interaction.guild.roles.cache.map(r => r.id)},
            ignoreLock: true,
        });
        const replyData = {};
        const rolesLimit = (
            (
                interaction.client.guildData.get(interaction.guild.id).premiumUntil
                ??
                interaction.client.guildData.get(interaction.guild.id).partner
            )
            ? 10
            : 1
        );
        if(roleDocs.length >= rolesLimit) replyData.content = channelLanguage.get('lockignoreTooManyRoles');
        const embed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setAuthor({
                name: channelLanguage.get('lockignore_listEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setTimestamp()
            .setDescription(roleDocs.map((e, i) => {
                const str = `<@&${e.roleID}>`;
                return (i < rolesLimit) ? str : `~~${str}~~`;
            }).join('\n'));
        replyData.embeds = [embed];
        await interaction.reply(replyData);
    },
};