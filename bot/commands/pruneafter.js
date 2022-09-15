const {PermissionsBitField, Collection, EmbedBuilder} = require('discord.js');
const locale = require('../../locale');

module.exports = {
    active: true,
    name: 'pruneafter',
    description: lang => lang.get('pruneafterDescription'),
    cooldown: 10,
    perm: PermissionsBitField.Flags.ManageChannels,
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        if(
            !interaction.channel.viewable
            ||
            !interaction.guild.members.me
                .permissionsIn(interaction.channel)
                .has(PermissionsBitField.Flags.ManageMessages)
        ) return await interaction.reply({
            content: channelLanguage.get('botCantPruneMessages'),
            ephemeral: true,
        });
        await interaction.deferReply({ephemeral: true});
        const chunkDeleteAmount = async (after, count = 0, deletedMessages = new Collection()) => {
            if(count >= 900){
                const msgs = await interaction.channel.messages.fetch({limit: 1000 - count, after});
                return await interaction.channel
                    .bulkDelete(
                        msgs.filter(e => !e.pinned),
                        true
                    )
                    .then(dels => deletedMessages.concat(dels));
            }
            const msgs = await interaction.channel.messages.fetch({limit: 100, after});
            const deleted = await interaction.channel.bulkDelete(msgs.filter(e => !e.pinned), true);
            deletedMessages = msgs.intersect(deleted).concat(deletedMessages);
            if(msgs.size < 100) return deletedMessages;
            return await chunkDeleteAmount(msgs.last().id, count + 100, deletedMessages);
        }
        const messages = await chunkDeleteAmount(interaction.targetMessage.id);
        await interaction.editReply(channelLanguage.get('pruneafterSuccess', [messages.size]));
        if(!interaction.client.guildData.get(interaction.guild.id).actionlogs.id('prune')) return;
        const relevantMessages = messages.filter(e => (!e.partial && !e.author.bot && !e.system));
        if(!relevantMessages.size) return;
        const channelModel = require('../../schemas/channel.js');
        const channelDoc = await channelModel.findById(interaction.channel.id);
        if(channelDoc && channelDoc.ignoreActions.includes('prune')) return;
        const roleModel = require('../../schemas/role.js');
        const roleDoc = await roleModel.findOne({
            guild: interaction.guild.id,
            roleID: {$in: interaction.member.roles.cache.map(e => e.id)},
            ignoreActions: 'prune',
        });
        if(roleDoc) return;
        const hook = await interaction.client
            .fetchWebhook(
                (
                    interaction.client.guildData.get(interaction.guild.id).actionlogs.id('prune')?.hookID
                    ??
                    interaction.client.guildData.get(interaction.guild.id).defaultLogsHookID
                ),
                (
                    interaction.client.guildData.get(interaction.guild.id).actionlogs.id('prune').hookToken
                    ??
                    interaction.client.guildData.get(interaction.guild.id).defaultLogsHookToken
                )
            )
            .catch(() => null);
        if(!hook) return;
        const logsLanguage = locale.get(interaction.client.guildData.get(interaction.guild.id).language);
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTimestamp()
            .setAuthor({
                name: logsLanguage.get('pruneEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true})
            })
            .addField(logsLanguage.get('pruneEmbedAmountTitle'), relevantMessages.size.toString(), true)
            .addField(logsLanguage.get('delmsgEmbedChannelTitle'), interaction.channel.toString(), true)
            .addField(logsLanguage.get('delmsgEmbedExecutorTitle'), interaction.user.toString(), true);
        await hook.send({
            username: interaction.client.user.username,
            avatarURL: interaction.client.user.avatarURL(),
            embeds: [embed],
            files: [{
                name: 'bulkDeletedMessages.log',
                attachment: Buffer.from(
                    relevantMessages
                        .reverse()
                        .map(e => (
                            `${channelLanguage.get('delmsgEmbedAuthorTitle')}: ${e.author.tag} (${e.author.id})\n` +
                            `${channelLanguage.get('delmsgEmbedSentTitle')}: ${e.createdAt.toUTCString()}` +
                            `${
                                e.content
                                ? (
                                    `\n================================================\n` +
                                    `${e.content}\n` +
                                    `================================================`
                                )
                                : ''
                            }` +
                            [...e.attachments.values()]
                                .map((ee, i) => `\nAttachment-${i + 1}-${
                                    ee.height
                                    ? `Media: ${ee.proxyURL}`
                                    : `File: ${ee.url}`
                                }`)
                                .join('')
                        ))
                        .join('\n\n')
                ),
            }],
        });
    },
    contextName: 'Prune below this',
};