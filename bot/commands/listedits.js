const {Permissions, MessageEmbed, Util} = require('discord.js');
const {sha256} = require('js-sha256');
const aesjs = require('aes-js');

module.exports = {
    active: true,
    name: 'listedits',
    description: lang => lang.get('listeditsDescription'),
    cooldown: 5,
    perm: Permissions.FLAGS.MANAGE_MESSAGES,
    guildOnly: true,
    premium: true,
    contextName: 'List previous edits',
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        const edition = require('../../schemas/edition.js');
        const edits = await edition.find({messageID: interaction.targetMessage.id}).sort({timestamp: -1});
        if(!edits.length) return await interaction.reply({
            content: channelLanguage.get('noEditsFound'),
            ephemeral: true,
        });
        const pageSize = 5;
        const fields = edits.map((e, i) => {
            const aesCtr = new aesjs.ModeOfOperation.ctr(sha256.array(process.env.CRYPT_PASSWD));
            return {
                name: channelLanguage.get('listeditsEmbedVersionTitle', [edits.length - i]),
                value: channelLanguage.get(
                    'listeditsEmbedVersionValue',
                    [
                        Util.escapeCodeBlock(
                            Util.cleanContent(
                                aesjs.utils.utf8.fromBytes(aesCtr.decrypt(e.content)),
                                interaction.channel
                            )
                        ),
                        Math.round(e.timestamp.getTime() / 1000),
                    ]
                ),
            };
        });
        const embed = new MessageEmbed()
            .setColor(0x2f3136)
            .setAuthor({
                name: channelLanguage.get('listeditsEmbedAuthor'),
                iconURL: interaction.targetMessage.author.avatarURL({dynamic: true}),
            })
            .setFields(fields.slice(0, pageSize))
            .setTimestamp();
        const buttonPrevious = {
            type: 'BUTTON',
            label: channelLanguage.get('previous'),
            style: 'PRIMARY',
            emoji: '⬅',
            customId: 'previous',
            disabled: true,
        };
        const buttonNext = {
            type: 'BUTTON',
            label: channelLanguage.get('next'),
            style: 'PRIMARY',
            emoji: '➡',
            customId: 'next',
            disabled: (fields.length <= pageSize),
        };
        const components = [{
            type: 'ACTION_ROW',
            components: [buttonPrevious, buttonNext],
        }];
        const reply = await interaction.reply({
            embeds: [embed],
            components,
            fetchReply: true,
            ephemeral: true,
        });
        if(fields.length <= pageSize) return;
        const collector = reply.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
            time: 600000,
            componentType: 'BUTTON',
        });
        let page = 0;
        collector.on('collect', i => (async () => {
            if(i.customId === 'next'){
                if(!fields.slice((page + 1) * pageSize).length) return;
                page++;
            }
            else{
                if(!page) return;
                page--;
            }
            embed.setFields(fields.slice(page * pageSize, (page + 1) * pageSize));
            buttonPrevious.disabled = !page;
            buttonNext.disabled = (!fields.slice((page + 1) * pageSize).length);
            await i.update({embeds: [embed], components});
        })().catch(err => interaction.client.handlers.button(err, i)));
        collector.on('end', async () => {
            if(!reply.editable) return;
            buttonNext.disabled = buttonPrevious.disabled = true;
            await interaction.editReply({embeds: [embed], components});
        });
    },
};