const {Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'getsticker',
    description: lang => lang.get('getstickerDescription'),
    cooldown: 5,
    categoryID: 5,
    executeSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(!interaction.targetMessage.stickers.size) return interaction.reply({
            content: channelLanguage.get('noStickerFound'),
            ephemeral: true,
        });
        if(interaction.member.permissions.has(Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS)){
            const buttonAdd = {
                type: 'BUTTON',
                label: channelLanguage.get('add'),
                customId: 'add',
                style: 'SUCCESS',
                emoji: '📥',
            };
            const components = [{
                type: 'ACTION_ROW',
                components: [buttonAdd],
            }];
            const reply = await interaction.reply({
                content: channelLanguage.get('getstickerContent'),
                files: [interaction.targetMessage.stickers.first().url],
                ephemeral: true,
                fetchReply: true,
                components,
            });
            const collector = reply.createMessageComponentCollector({
                filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
                idle: 10000,
                max: 1,
                componentType: 'BUTTON',
            });
            collector.on('collect', i => (async i => {
                await interaction.guild.stickers.fetch();
                const maxStickers = {
                    NONE: 0,
                    TIER_1: 15,
                    TIER_2: 30,
                    TIER_3: 60,
                };
                if(interaction.guild.stickers.cache.size >= maxStickers[interaction.guild.premiumTier]) return i.reply({
                    content: channelLanguage.get('maxStickersReached'),
                    ephemeral: true,
                });
                await interaction.targetMessage.stickers.first().fetch();
                await interaction.guild.stickers.create(interaction.targetMessage.stickers.first().url, interaction.targetMessage.stickers.first().name, interaction.targetMessage.stickers.first().tags[0], {
                    description: interaction.targetMessage.stickers.first().description,
                    reason: channelLanguage.get('stickerCreator', [interaction.user.tag, interaction.user.id]),
                });
                await i.reply({
                    content: channelLanguage.get('stickerAdded'),
                    ephemeral: true,
                });
            })(i).catch(err => interaction.client.handlers.button(err, i)));
            collector.on('end', async () => {
                buttonAdd.disabled = true;
                await interaction.editReply({components});
            });
        }
        else{
            await interaction.reply({
                content: channelLanguage.get('getstickerContent'),
                files: [interaction.targetMessage.stickers.first().url],
                ephemeral: true,
            });
        }
    },
    contextName: 'Extract sticker file',
}