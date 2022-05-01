const {Permissions, Collection, MessageEmbed} = require('discord.js');
const channelModel = require('../../schemas/channel.js');
const roleModel = require('../../schemas/role.js');

module.exports = {
    active: true,
    name: 'pruneafter',
    description: lang => lang.get('pruneafterDescription'),
    cooldown: 10,
    perm: Permissions.FLAGS.MANAGE_CHANNELS,
    executeSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(!interaction.guild.me.permissionsIn(interaction.channel).has(Permissions.FLAGS.MANAGE_MESSAGES)) return interaction.reply({
            content: channelLanguage.get('botCantPruneMessages'),
            ephemeral: true,
        });
        await interaction.deferReply({ephemeral: true});
        const chunkDeleteAmount = async (after, count = 0, deletedMessages = new Collection()) => {
            console.log(`after ${count} messages`);
            if(count >= 900){
                const msgs = await interaction.channel.messages.fetch({limit: 1000 - count, after});
                return await interaction.channel.bulkDelete(msgs.filter(e => !e.pinned), true).then(dels => deletedMessages.concat(dels));
            }
            const msgs = await interaction.channel.messages.fetch({limit: 100, after});
            console.log(`fetched ${msgs.size} and ${msgs.filter(e => e.partial).size} are partial`);
            const deleted = await interaction.channel.bulkDelete(msgs.filter(e => !e.pinned), true);
            deletedMessages = msgs.intersect(deleted).concat(deletedMessages);
            console.log(`the total collection now has ${deletedMessages.size} messages and ${deletedMessages.filter(e => e.partial).size} are partial`);
            if(msgs.size < 100) return deletedMessages;
            return await chunkDeleteAmount(msgs.last().id, count + 100, deletedMessages);
        }
        const messages = await chunkDeleteAmount(interaction.targetMessage.id);
        await interaction.editReply(channelLanguage.get('pruneafterSuccess', [messages.size]));
        if(!interaction.client.guildData.get(interaction.guild.id).actionlogs.id('prune')) return;
        const relevantMessages = messages.filter(e => (!e.partial && !e.author.bot && !e.system));
        console.log(messages.filter(e => e.partial).size);
        if(!relevantMessages.size) return;
        const channelDoc = await channelModel.findById(interaction.channel.id);
        if(channelDoc && channelDoc.ignoreActions.includes('prune')) return;
        const roleDoc = await roleModel.findOne({
            guild: interaction.guild.id,
            roleID: {$in: interaction.member.roles.cache.map(e => e.id)},
            ignoreActions: 'prune',
        });
        if(roleDoc) return;
        const hook = await interaction.client.fetchWebhook(interaction.client.guildData.get(interaction.guild.id).actionlogs.id('prune')?.hookID ?? interaction.client.guildData.get(interaction.guild.id).defaultLogsHookID, interaction.client.guildData.get(interaction.guild.id).actionlogs.id('prune').hookToken ?? interaction.client.guildData.get(interaction.guild.id).defaultLogsHookToken).catch(() => null);
        if(!hook) return;
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setTimestamp()
            .setAuthor({
                name: channelLanguage.get('pruneEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true})
            })
            .addField(channelLanguage.get('pruneEmbedAmountTitle'), relevantMessages.size.toString(), true)
            .addField(channelLanguage.get('delmsgEmbedChannelTitle'), interaction.channel.toString(), true)
            .addField(channelLanguage.get('delmsgEmbedExecutorTitle'), interaction.user.toString(), true);
        await hook.send({
            username: interaction.client.user.username,
            avatarURL: interaction.client.user.avatarURL(),
            embeds: [embed],
            files: [{
                name: 'bulkDeletedMessages.log',
                attachment: Buffer.from(`\
${relevantMessages.reverse().map(e => `\
${channelLanguage.get('delmsgEmbedAuthorTitle')}: ${e.author.tag} (${e.author.id})
${channelLanguage.get('delmsgEmbedSentTitle')}: ${e.createdAt.toUTCString()}${e.content ? `
================================================
${e.content}
================================================\
` : ''}${[...e.attachments.values()].map((ee, i) => `\nAttachment-${i + 1}-${ee.height ? `Media: ${ee.proxyURL}` : `File: ${ee.url}`}`).join('')}\
`).join('\n\n')}\
                `),
            }],
        });
    },
    contextName: 'Prune below this',
};