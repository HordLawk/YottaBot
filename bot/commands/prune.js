const {Permissions, Collection} = require('discord.js');

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
        if(args[1]){
            const id = args[1].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
            if(!id) return message.reply(channelLanguage.get('invUser'));
            const user = await message.client.users.fetch(id).catch(() => null);
            if(!user) return message.reply(channelLanguage.get('invUser'));
            const chunkFetch = async (fetched = (new Collection()), count = 0, before) => {
                if(fetched.size >= amount) return fetched.first(amount);
                if(count >= 1000) return [...fetched.values()];
                const auxFetched = await message.channel.messages.fetch({limit: 100, before});
                return await chunkFetch(fetched.concat(auxFetched.filter(e => (e.author.id === user.id))), count + 100, auxFetched.first().id);
            }
            const msgs = await chunkFetch();
            const chunkDelete = async msgsLeft => {
                if(msgsLeft.length <= 100) return await message.channel.bulkDelete(msgsLeft, true);
                const deleted = await message.channel.bulkDelete(msgsLeft.slice(0, 100), true);
                if(deleted.size === 100) await chunkDelete(msgsLeft.slice(100));
            }
            await chunkDelete(msgs.filter(e => !e.pinned));
        }
        else{
            const chunkDelete = async count => {
                if(count <= 100){
                    const msgs = await message.channel.messages.fetch({limit: count});
                    return await message.channel.bulkDelete(msgs.filter(e => !e.pinned), true);
                }
                const msgs = await message.channel.messages.fetch({limit: 100});
                const deleted = await message.channel.bulkDelete(msgs.filter(e => !e.pinned), true);
                if(deleted.size === 100) await chunkDelete(count - 100);
            }
            await chunkDelete(amount);
        }
    },
    executeSlash: async (interaction, args) => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(isNaN(args.amount) || !isFinite(args.amount) || (args.amount < 2) || (args.amount > 1000)) return interaction.reply({
            content: channelLanguage.get('invalidPruneAmount'),
            ephemeral: true,
        });
        await interaction.deferReply({ephemeral: true});
        let deletedAmount;
        if(args.author){
            const chunkFetch = async (fetched = (new Collection()), count = 0, before) => {
                if(fetched.size >= args.amount) return fetched.first(args.amount);
                if(count >= 1000) return [...fetched.values()];
                const auxFetched = await interaction.channel.messages.fetch({limit: 100, before});
                return await chunkFetch(fetched.concat(auxFetched.filter(e => (e.author.id === args.author.id))), count + 100, auxFetched.first().id);
            }
            const msgs = await chunkFetch();
            const chunkDelete = async (msgsLeft, deletedCount = 0) => {
                if(msgsLeft.length <= 100) return await interaction.channel.bulkDelete(msgsLeft, true).then(dels => deletedCount + dels.size);
                const deleted = await interaction.channel.bulkDelete(msgsLeft.slice(0, 100), true);
                if(deleted.size < 100) return deletedCount + deleted.size;
                return await chunkDelete(msgsLeft.slice(100), deletedCount + 100);
            }
            deletedAmount = await chunkDelete(msgs.filter(e => !e.pinned));
        }
        else{
            const chunkDelete = async (count, deletedCount = 0) => {
                if(count <= 100){
                    const msgs = await interaction.channel.messages.fetch({limit: count});
                    return await interaction.channel.bulkDelete(msgs.filter(e => !e.pinned), true).then(dels => deletedCount + dels.size);
                }
                const msgs = await interaction.channel.messages.fetch({limit: 100});
                const deleted = await interaction.channel.bulkDelete(msgs.filter(e => !e.pinned), true);
                if(deleted.size < 100) return deletedCount + deleted.size;
                return await chunkDelete(count - 100, deletedCount + 100);
            }
            deletedAmount = await chunkDelete(args.amount);
        }
        if(deletedAmount === args.amount) return interaction.editReply(channelLanguage.get('pruneSuccess', [args.amount]));
        interaction.editReply(channelLanguage.get('prunePartial', [deletedAmount, args.amount]));
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