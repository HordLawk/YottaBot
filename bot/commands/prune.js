const {Permissions, Collection} = require('discord.js');
const channelModel = require('../../schemas/channel.js');
const roleModel = require('../../schemas/role.js');

const chunkFetch = async (maxAmount, channel, authorId, fetched = (new Collection()), count = 0, before) => {
    if(fetched.size >= maxAmount) return fetched.first(maxAmount);
    if(count >= 1000) return [...fetched.values()];
    const auxFetched = await channel.messages.fetch({limit: 100, before});
    return await chunkFetch(maxAmount, channel, authorId, fetched.concat(auxFetched.filter(e => (e.author.id === authorId))), count + 100, auxFetched.first().id);
}
const chunkDeleteMessages = async (channel, msgsLeft, deletedMessages = new Collection()) => {
    if(msgsLeft.length <= 100) return await channel.bulkDelete(msgsLeft, true).then(dels => deletedMessages.concat(dels));
    const deleted = await channel.bulkDelete(msgsLeft.slice(0, 100), true);
    return await chunkDeleteMessages(msgsLeft.slice(100), deletedMessages.concat(deleted));
}
const chunkDeleteAmount = async (channel, count, deletedMessages = new Collection()) => {
    if(count <= 100){
        const msgs = await channel.messages.fetch({limit: count});
        return await channel.bulkDelete(msgs.filter(e => !e.pinned), true).then(dels => deletedMessages.concat(dels));
    }
    const msgs = await channel.messages.fetch({limit: 100});
    const deleted = await channel.bulkDelete(msgs.filter(e => !e.pinned), true);
    if((deleted.size < 100) || (count < 101)) return deletedMessages.concat(deleted);
    return await chunkDeleteAmount(count - 100, deletedMessages.concat(deleted));
}

module.exports = {
    active: true,
    name: 'prune',
    description: lang => lang.get('pruneDescription'),
    aliases: ['clear', 'purge'],
    usage: lang => [lang.get('pruneUsage')],
    example: ['20 @LordHawk#0001'],
    cooldown: 10,
    categoryID: 3,
    args: true,
    perm: Permissions.FLAGS.MANAGE_CHANNELS,
    guildOnly: true,
    execute: async (message, args) => {
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        const amount = parseInt(args[0]) + 1;
        if(isNaN(amount) || !isFinite(amount) || (amount < 2) || (amount > 999)) return message.reply(channelLanguage.get('invalidPruneAmount'));
        let messages;
        if(args[1]){
            const id = args[1].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
            if(!id) return message.reply(channelLanguage.get('invUser'));
            const user = await message.client.users.fetch(id).catch(() => null);
            if(!user) return message.reply(channelLanguage.get('invUser'));
            const msgs = await chunkFetch(amount, message.channel, user.id);
            messages = await chunkDeleteMessages(message.channel, msgs.filter(e => !e.pinned));
        }
        else{
            messages = await chunkDeleteAmount(message.channel, amount);
        }
        const relevantMessages = messages.first(-1).filter(e => (!e.partial && !e.author.bot && !e.system));
        if(!relevantMessages.size) return;
        const channelDoc = await channelModel.findById(message.channel.id);
        if(channelDoc && channelDoc.ignoreActions.includes('prune')) return;
        if(!message.member) await message.member.fetch();
        const roleDoc = await roleModel.findOne({
            guild: message.guild.id,
            roleID: {$in: message.member.roles.cache.map(e => e.id)},
            ignoreActions: 'prune',
        });
        if(roleDoc) return;
        const hook = await message.client.fetchWebhook(message.client.guildData.get(message.guild.id).actionlogs.id('prune')?.hookID ?? message.client.guildData.get(message.guild.id).defaultLogsHookID, message.client.guildData.get(message.guild.id).actionlogs.id('prune').hookToken ?? message.client.guildData.get(message.guild.id).defaultLogsHookToken).catch(() => null);
        if(!hook) return;
        await hook.send({
            username: message.client.user.username,
            avatarURL: message.client.user.avatarURL(),
            content: `\
${channelLanguage.get('delmsgEmbedChannelTitle')}: ${message.channel}
${channelLanguage.get('delmsgEmbedExecutorTitle')}: ${message.author}\
            `,
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
    executeSlash: async (interaction, args) => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(isNaN(args.amount) || !isFinite(args.amount) || (args.amount < 2) || (args.amount > 1000)) return interaction.reply({
            content: channelLanguage.get('invalidPruneAmount'),
            ephemeral: true,
        });
        await interaction.deferReply({ephemeral: true});
        let messages;
        if(args.author){
            const msgs = await chunkFetch(args.amount, interaction.channel, args.author.id);
            messages = await chunkDeleteMessages(interaction.channel, msgs.filter(e => !e.pinned));
        }
        else{
            messages = await chunkDeleteAmount(interaction.channel, args.amount);
        }
        if(messages.size === args.amount){
            await interaction.editReply(channelLanguage.get('pruneSuccess', [args.amount]));
        }
        else{
            await interaction.editReply(channelLanguage.get('prunePartial', [messages.size, args.amount]));
        }
        const relevantMessages = messages.filter(e => (!e.partial && !e.author.bot && !e.system));
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
        await hook.send({
            username: interaction.client.user.username,
            avatarURL: interaction.client.user.avatarURL(),
            content: `\
${channelLanguage.get('delmsgEmbedChannelTitle')}: ${interaction.channel}
${channelLanguage.get('delmsgEmbedExecutorTitle')}: ${interaction.user}\
            `,
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
    slashOptions: [
        {
            type: 'INTEGER',
            name: 'amount',
            description: 'The number of messages to delete',
            required: true,
            minValue: 2,
            maxValue: 999,
        },
        {
            type: 'USER',
            name: 'author',
            description: 'The author of the messages to delete',
            required: false,
        },
    ],
}