const {MessageEmbed, Permissions} = require('discord.js');
const user = require('../../schemas/user.js');
const guild = require('../../schemas/guild.js');

module.exports = {
    active: true,
    name: 'premium',
    description: lang => lang.get('premiumDescription'),
    cooldown: 5,
    categoryID: 5,
    execute: async message => {
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(message.guild && (message.client.guildData.get(message.guild.id).premiumUntil || message.client.guildData.get(message.guild.id).partner)) return message.reply(channelLanguage.get('alreadyPremium'));
        const userDoc = await user.findById(message.author.id);
        if(!userDoc?.premiumKeys){
            if(message.guild && !message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
            const embed = new MessageEmbed()
                .setColor(message.guild?.me.displayColor || 0x8000ff)
                .setDescription(channelLanguage.get('premiumEmbedDesc', [message.client.configs.support]));
            message.reply({embeds: [embed]});
        }
        else{
            if(!message.guild) return message.reply(`You have **${userDoc.premiumKeys}** premium keys remaining`);
            let msg = await message.reply({
                content: channelLanguage.get('activatePremium', [userDoc.premiumKeys]),
                components: [{
                    type: 'ACTION_ROW',
                    components: [
                        {
                            type: 'BUTTON',
                            label: channelLanguage.get('confirm'),
                            style: 'SUCCESS',
                            emoji: '✅',
                            customId: 'confirm',
                        },
                        {
                            type: 'BUTTON',
                            label: channelLanguage.get('cancel'),
                            style: 'DANGER',
                            emoji: '❌',
                            customId: 'cancel',
                        },
                    ],
                }],
            });
            const collector = msg.createMessageComponentCollector({
                idle: 10000,
                max: 1,
                componentType: 'BUTTON',
            });
            collector.on('end', async c => {
                if(!c.size) return msg.edit({
                    content: channelLanguage.get('timedOut'),
                    components: [],
                });
                if(c.first().customId === 'cancel') return c.first().update({
                    content: channelLanguage.get('cancelled'),
                    components: [],
                });
                userDoc.premiumKeys--;
                await userDoc.save();
                const premiumUntil = new Date(Date.now() + 2592000000);
                await guild.findByIdAndUpdate(message.guild.id, {$set: {premiumUntil: premiumUntil}});
                message.client.guildData.get(message.guild.id).premiumUntil = premiumUntil;
                await c.first().update({
                    content: channelLanguage.get('activatePremiumSuccess'),
                    components: [],
                });
            });
        }
    },
    executeSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(interaction.guild && (interaction.client.guildData.get(interaction.guild.id).premiumUntil || interaction.client.guildData.get(interaction.guild.id).partner)) return interaction.reply({
            content: channelLanguage.get('alreadyPremium'),
            ephemeral: true,
        });
        const userDoc = await user.findById(interaction.user.id);
        if(!userDoc?.premiumKeys){
            const embed = new MessageEmbed()
                .setColor(interaction.guild?.me.displayColor || 0x8000ff)
                .setDescription(channelLanguage.get('premiumEmbedDesc', [interaction.client.configs.support]));
            interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
        }
        else{
            if(!interaction.guild) return interaction.reply(`You have **${userDoc.premiumKeys}** premium keys remaining`);
            const reply = await interaction.reply({
                content: channelLanguage.get('activatePremium', [userDoc.premiumKeys]),
                components: [{
                    type: 'ACTION_ROW',
                    components: [
                        {
                            type: 'BUTTON',
                            label: channelLanguage.get('confirm'),
                            style: 'SUCCESS',
                            emoji: '✅',
                            customId: 'confirm',
                        },
                        {
                            type: 'BUTTON',
                            label: channelLanguage.get('cancel'),
                            style: 'DANGER',
                            emoji: '❌',
                            customId: 'cancel',
                        },
                    ],
                }],
                ephemeral: true,
                fetchReply: true,
            });
            const collector = reply.createMessageComponentCollector({
                filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
                idle: 10000,
                max: 1,
                componentType: 'BUTTON',
            });
            collector.on('end', async c => {
                if(!c.size) return reply.edit({
                    content: channelLanguage.get('timedOut'),
                    components: [],
                });
                if(c.first().customId === 'cancel') return c.first().update({
                    content: channelLanguage.get('cancelled'),
                    components: [],
                });
                userDoc.premiumKeys--;
                await userDoc.save();
                const premiumUntil = new Date(Date.now() + 2592000000);
                await guild.findByIdAndUpdate(interaction.guild.id, {$set: {premiumUntil: premiumUntil}});
                interaction.client.guildData.get(interaction.guild.id).premiumUntil = premiumUntil;
                await c.first().update({
                    content: channelLanguage.get('activatePremiumSuccess'),
                    components: [],
                });
            });
        }
    },
};