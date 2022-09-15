const {PermissionsBitField, ApplicationCommandOptionType, ChannelType} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'newinvite',
    description: lang => lang.get('newinviteDescription'),
    cooldown: 5,
    categoryID: 5,
    perm: PermissionsBitField.Flags.CreateInstantInvite,
    guildOnly: true,
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const destination = (
            args.destination
            ??
            interaction.guild.rulesChannel
            ??
            interaction.guild.channels.cache
                .filter(e => (
                    e.isVoiceBased()
                    ||
                    (
                        e.isTextBased()
                        &&
                        !e.isThread()
                    )
                ))
                .sort((a, b) => (
                    (
                        (
                            a.parent?.position
                            ??
                            -1
                        ) - (
                            b.parent?.position
                            ??
                            -1
                        )
                    )
                    ||
                    (a.isVoiceBased() - b.isVoiceBased())
                    ||
                    (a.position - b.position)
                ))
                .first()
        );
        if(
            !interaction.guild.members.me
                .permissionsIn(destination)
                .has(PermissionsBitField.Flags.CreateInstantInvite)
        ) return await interaction.reply({
            content: channelLanguage.get('botCantCreateInvite', [destination]),
            ephemeral: true,
        });
        if(
            !interaction.member
                .permissionsIn(destination)
                .has(PermissionsBitField.Flags.CreateInstantInvite)
        ) return await interaction.reply({
            content: channelLanguage.get('memberCantCreateInvite', [destination]),
            ephemeral: true,
        });
        const invite = await destination.createInvite({
            temporary: args.require_role,
            maxAge: (args.expire_after ?? 0) * 3600,
            maxUses: args.max_uses,
        });
        await interaction.reply({
            content: invite.toString(),
            ephemeral: true,
        });
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Channel,
            name: 'destination',
            nameLocalizations: utils.getStringLocales('newinviteOptiondestinationLocalisedName'),
            description: 'The channel this invite leads to',
            descriptionLocalizations: utils.getStringLocales('newinviteOptiondestinationLocalisedDesc'),
            channelTypes: [
                ChannelType.GuildText,
                ChannelType.GuildVoice,
                ChannelType.GuildNews,
                ChannelType.GuildStageVoice,
            ],
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'require_role',
            nameLocalizations: utils.getStringLocales('newinviteOptionrequire_roleLocalisedName'),
            description: 'Whether members should be automatically kicked after 24 hours if they have not yet ' +
                         'received a role',
            descriptionLocalizations: utils.getStringLocales('newinviteOptionrequire_roleLocalisedDesc'),
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'expire_after',
            nameLocalizations: utils.getStringLocales('newinviteOptionexpire_afterLocalisedName'),
            description: 'How long the invite should last for in hours',
            descriptionLocalizations: utils.getStringLocales('newinviteOptionexpire_afterLocalisedDesc'),
            minValue: 1,
            maxValue: 168,
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'max_uses',
            nameLocalizations: utils.getStringLocales('newinviteOptionmax_usesLocalisedName'),
            description: 'Maximum number of times this invite can be used',
            descriptionLocalizations: utils.getStringLocales('newinviteOptionmax_usesLocalisedDesc'),
            minValue: 1,
            maxValue: 100,
        },
    ],
};