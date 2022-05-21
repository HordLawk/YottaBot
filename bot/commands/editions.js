const {Permissions, MessageEmbed} = require('discord.js');
const guildModel = require('../../schemas/guild.js');
const editionModel = require('../../schemas/edition.js');

module.exports = {
    active: true,
    name: 'editions',
    description: lang => lang.get('editionsDescription'),
    cooldown: 5,
    categoryID: 2,
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
    storageSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        await guildModel.findByIdAndUpdate(interaction.guild.id, {$set: {storeEditions: (interaction.client.guildData.get(interaction.guild.id).storeEditions = args.enable)}});
        await interaction.reply(channelLanguage.get('storageSuccess', [args.enable]));
    },
    wipeSlash: async interaction => {
        const {channelLanguage} = interaction;
        const buttonConfirm = {
            type: 'BUTTON',
            label: channelLanguage.get('confirm'),
            style: 'SUCCESS',
            emoji: '✅',
            customId: 'confirm',
        };
        const buttonCancel = {
            type: 'BUTTON',
            label: channelLanguage.get('cancel'),
            style: 'DANGER',
            emoji: '❌',
            customId: 'cancel',
        };
        const components = [{
            type: 'ACTION_ROW',
            components: [buttonConfirm, buttonCancel],
        }];
        const reply = await interaction.reply({
            content: channelLanguage.get('wipeEditionsConfirm'),
            components,
            fetchReply: true,
        });
        const collector = reply.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
            idle: 10000,
            max: 1,
            componentType: 'BUTTON',
        });
        collector.on('collect', i => (async i => {
            switch(i.customId){
                case 'cancel': {
                    await i.reply({content: channelLanguage.get('cancelled')});
                }
                break;
                case 'confirm': {
                    await editionModel.deleteMany({guild: interaction.guild.id});
                    await i.reply({content: channelLanguage.get('wipeEditionsSuccess')});
                }
                break;
            }
        })(i).catch(err => interaction.client.handlers.button(err, i)));
        collector.on('end', async collected => {
            if(!reply.editable) return;
            buttonCancel.disabled = buttonConfirm.disabled = true;
            const msgData = {components};
            if(!collected.size) msgData.content = channelLanguage.get('timedOut');
            await interaction.editReply(msgData);
        });
    },
    infoSlash: async interaction => {
        const {channelLanguage} = interaction;
        const editionsAmount = await editionModel.countDocuments({guild: interaction.guild.id});
        const premiumLike = (interaction.client.guildData.get(interaction.guild.id).premiumUntil ?? interaction.client.guildData.get(interaction.guild.id).partner);
        const embed = new MessageEmbed()
            .setColor(0x2f3136)
            .setAuthor({
                name: channelLanguage.get('editionsinfoEmbedAuthor'), // fazer locale
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setTimestamp()
            .setDescription(channelLanguage.get('editionsinfoEmbedDescription', [interaction.client.guildData.get(interaction.guild.id).storeEditions, editionsAmount, premiumLike])); // fazer locale
        const replyData = {embeds: [embed]};
        if(!premiumLike) replyData.content = channelLanguage.get('nonPremiumStorage'); // fazer locale
        await interaction.reply(replyData);
    },
    slashOptions: [
        {
            type: 'SUB_COMMAND',
            name: 'storage',
            description: 'Sets if edited messages should be stored for later viewing',
            options: [{
                type: 'BOOLEAN',
                name: 'enable',
                description: 'Whether edited messages should be stored or not',
                required: true,
            }],
        },
        {
            type: 'SUB_COMMAND',
            name: 'wipe',
            description: 'Requests deletion of all stored previously edited messages from this server',
        },
        {
            type: 'SUB_COMMAND',
            name: 'info',
            description: 'Shows information on the current state of the edited messages storing functionality in this server',
        },
    ],
};