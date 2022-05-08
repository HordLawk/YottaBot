const {Permissions} = require('discord.js');
const log = require('../../schemas/log.js');

const buildButtons = (channelLanguage, author) => {
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
    return {
        buttonConfirm,
        buttonCancel,
        components: [{
            type: 'ACTION_ROW',
            components: [buttonConfirm, buttonCancel],
        }],
        collectorOptions: {
            filter: componentInteraction => (componentInteraction.user.id === author.id),
            idle: 10000,
            max: 1,
            componentType: 'BUTTON',
        },
    };
}
const slashCollectorEnd = (buttonConfirm, buttonCancel, components, channelLanguage, interaction) => (async collected => {
    buttonCancel.disabled = buttonConfirm.disabled = true;
    const msgData = {components};
    if(!collected.size) msgData.content = channelLanguage.get('timedOut');
    await interaction.editReply(msgData);
});

module.exports = {
    active: true,
    name: 'delcases',
    description: lang => lang.get('delcasesDescription'),
    aliases: ['delmodlogs'],
    usage: lang => ['server', lang.get('delcasesUsage0'), lang.get('delcasesUsage1')], 
    example: ['user @LordHawk#0001', 'case 123'],
    cooldown: 5,
    categoryID: 1,
    args: true,
    perm: Permissions.FLAGS.ADMINISTRATOR,
    guildOnly: true,
    execute: async function(message, args){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        const {buttonConfirm, buttonCancel, components, collectorOptions} = buildButtons(channelLanguage, message.author);
        const collectorEnd = reply => (async collected => {
            buttonCancel.disabled = buttonConfirm.disabled = true;
            const msgData = {components};
            if(!collected.size) msgData.content = channelLanguage.get('timedOut');
            await reply.edit(msgData);
        });
        switch(args[0]){
            case 'server': {
                const reply = await message.reply({content: channelLanguage.get('resetServerCasesConfirm'), components});
                const collector = reply.createMessageComponentCollector(collectorOptions);
                collector.on('collect', i => (async i => {
                    switch(i.customId){
                        case 'cancel': {
                            await i.reply({content: channelLanguage.get('cancelled')});
                        }
                        break;
                        case 'confirm': {
                            await log.deleteMany({guild: message.guild.id});
                            await i.reply({content: channelLanguage.get('resetServerCasesSuccess')});
                        }
                        break;
                    }
                })(i).catch(err => message.client.handlers.button(err, i)));
                collector.on('end', collectorEnd(reply));
            }
            break;
            case 'user': {
                if(!args[1]) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                const id = args[1].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
                if(!id) return message.reply(channelLanguage.get('invUser'));
                const user = await message.client.users.fetch(id).catch(() => null);
                if(!user) return message.reply(channelLanguage.get('invUser'));
                const reply = await message.reply({content: channelLanguage.get('resetUserCasesConfirm', [user]), components});
                const collector = reply.createMessageComponentCollector(collectorOptions);
                collector.on('collect', i => (async i => {
                    switch(i.customId){
                        case 'cancel': {
                            await i.reply({content: channelLanguage.get('cancelled')});
                        }
                        break;
                        case 'confirm': {
                            await log.deleteMany({
                                guild: message.guild.id,
                                target: user.id,
                            });
                            await i.reply({content: channelLanguage.get('resetUserCasesSuccess', [user])});
                        }
                        break;
                    }
                })(i).catch(err => message.client.handlers.button(err, i)));
                collector.on('end', collectorEnd(reply));
            }
            break;
            case 'case': {
                const id = parseInt(args[1]);
                if(isNaN(id) || !isFinite(id) || (id < 0)) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
                const caseDoc = await log.findOneAndDelete({
                    id: id,
                    guild: message.guild.id,
                });
                if(!caseDoc) return message.reply(channelLanguage.get('caseNotFound', [caseDoc.id]));
                message.reply(channelLanguage.get('caseDeletedSuccess', [caseDoc.id]));
            }
            break;
            default: return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        }
    },
    serverSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        const {buttonConfirm, buttonCancel, components, collectorOptions} = buildButtons(channelLanguage, interaction.user);
        const reply = await interaction.reply({
            content: channelLanguage.get('resetServerCasesConfirm'),
            components,
            fetchReply: true,
        });
        const collector = reply.createMessageComponentCollector(collectorOptions);
        collector.on('collect', i => (async i => {
            switch(i.customId){
                case 'cancel': {
                    await i.reply({content: channelLanguage.get('cancelled')});
                }
                break;
                case 'confirm': {
                    await log.deleteMany({guild: interaction.guild.id});
                    await i.reply({content: channelLanguage.get('resetServerCasesSuccess')});
                }
                break;
            }
        })(i).catch(err => interaction.client.handlers.button(err, i)));
        collector.on('end', slashCollectorEnd(buttonConfirm, buttonCancel, components, channelLanguage, interaction));
    },
    userSlash: async (interaction, args) => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        const {buttonConfirm, buttonCancel, components, collectorOptions} = buildButtons(channelLanguage, interaction.user);
        const reply = await interaction.reply({
            content: channelLanguage.get('resetUserCasesConfirm', [args.target]),
            components,
            fetchReply: true,
        });
        const collector = reply.createMessageComponentCollector(collectorOptions);
        collector.on('collect', i => (async i => {
            switch(i.customId){
                case 'cancel': {
                    await i.reply({content: channelLanguage.get('cancelled')});
                }
                break;
                case 'confirm': {
                    await log.deleteMany({
                        guild: interaction.guild.id,
                        target: args.target.id,
                    });
                    await i.reply({content: channelLanguage.get('resetUserCasesSuccess', [args.target])});
                }
                break;
            }
        })(i).catch(err => interaction.client.handlers.button(err, i)));
        collector.on('end', slashCollectorEnd(buttonConfirm, buttonCancel, components, channelLanguage, interaction));
    },
    caseSlash: async function(interaction, args){
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(isNaN(args.id) || !isFinite(args.id) || (args.id < 0)) return interaction.reply({
            content: channelLanguage.get('invArgs', [interaction.client.guildData.get(interaction.guild.id).prefix, this.name, this.usage(channelLanguage)]),
            ephemeral: true,
        });
        const caseDoc = await log.findOneAndDelete({
            id: args.id,
            guild: interaction.guild.id,
        });
        if(!caseDoc) return interaction.reply({
            content: channelLanguage.get('caseNotFound', [caseDoc.id]),
            ephemeral: true,
        });
        await interaction.reply(channelLanguage.get('caseDeletedSuccess', [caseDoc.id]));
    },
    slashOptions: [
        {
            type: 'SUB_COMMAND',
            name: 'server',
            description: 'Deletes all logged cases from the current server',
        },
        {
            type: 'SUB_COMMAND',
            name: 'user',
            description: 'Deletes all logged cases which have the selected user as their target',
            options: [{
                type: 'USER',
                name: 'target',
                description: 'The target of the cases to be deleted',
                required: true,
            }],
        },
        {
            type: 'SUB_COMMAND',
            name: 'case',
            description: 'Deletes an specific case by its ID',
            options: [{
                type: 'INTEGER',
                name: 'id',
                description: 'The ID of the case to be deleted',
                required: true,
                minValue: 0,
            }],
        },
    ],
}