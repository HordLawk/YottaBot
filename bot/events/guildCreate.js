const {MessageEmbed, Permissions} = require('discord.js');
const guildModel = require('../../schemas/guild.js');

module.exports = {
    name: 'guildCreate',
    execute: async guild => {
        var content = '';
        if(guild.me.permissions.has(Permissions.FLAGS.MANAGE_GUILD)){
            const integrations = await guild.fetchIntegrations({includeApplications: true});
            const adder = integrations.find(e => (e.application?.id === guild.client.application.id))?.user;
            if(adder){
                content = `Added by: ${adder} (${adder.tag})\n`;
                let guildLanguage = guild.client.langs[guild.client.guildData.get(guild.id)?.language ?? ((guild.preferredLocale === 'pt-BR') ? 'pt' : 'en')];
                let dmEmbed = new MessageEmbed()
                    .setColor(0x8000ff)
                    .setDescription(guildLanguage.get('dmBotAdder', [adder, guild.name, guild.client.guildData.get(guild.id)?.prefix ?? 'y!', guild.client.configs.support]));
                await adder.send({
                    embeds: [dmEmbed],
                    components: [{
                        type: 'ACTION_ROW',
                        components: [{
                            type: 'SELECT_MENU',
                            customId: 'locale',
                            placeholder: guildLanguage.get('language'),
                            options: Object.values(guild.client.langs).map(e => ({
                                label: e.name,
                                value: e.lang,
                                emoji: e.flag,
                                default: (e.lang === guildLanguage.lang),
                            })),
                        }],
                    }],
                }).then(dm => {
                    const collector = dm.createMessageComponentCollector({time: 600000});
                    collector.on('collect', async i => {
                        if(guild.client.guildData.has(guild.id)){
                            await guildModel.findByIdAndUpdate(guild.id, {$set: {language: (guild.client.guildData.get(guild.id).language = i.values[0])}});
                        }
                        else{
                            const guildData = new guildModel({
                                _id: guild.id,
                                language: i.values[0],
                            });
                            await guildData.save();
                            guild.client.guildData.set(guildData._id, guildData);
                        }
                        guildLanguage = guild.client.langs[i.values[0]];
                        dmEmbed.setDescription(guildLanguage.get('dmBotAdder', [adder, guild.name, guild.client.guildData.get(guild.id)?.prefix ?? 'y!', guild.client.configs.support]));
                        await i.update({
                            embeds: [dmEmbed],
                            components: [{
                                type: 'ACTION_ROW',
                                components: [{
                                    type: 'SELECT_MENU',
                                    customId: 'locale',
                                    placeholder: guildLanguage.get('language'),
                                    options: Object.values(guild.client.langs).map(e => ({
                                        label: e.name,
                                        value: e.lang,
                                        emoji: e.flag,
                                        default: (e.lang === guildLanguage.lang),
                                    })),
                                }],
                            }],
                        });
                    });
                    collector.on('end', async () => await dm.edit({components: [{
                        type: 'ACTION_ROW',
                        components: [{
                            type: 'SELECT_MENU',
                            customId: 'locale',
                            placeholder: guildLanguage.get('language'),
                            options: Object.values(guild.client.langs).map(e => ({
                                label: e.name,
                                value: e.lang,
                                emoji: e.flag,
                                default: (e.lang === guildLanguage.lang),
                            })),
                            disabled: true,
                        }],
                    }]}));
                }).catch(() => null);
            }
        }
        if(process.env.NODE_ENV === 'development') return;
        const embed = new MessageEmbed()
            .setColor(0x00ff00)
            .setAuthor({
                name: 'Joined Guild',
                iconURL: guild.iconURL({dynamic: true}),
            })
            .setDescription(`${content}Member count: ${guild.memberCount}\nID: ${guild.id}\nName: ${guild.name}\nOwner: <@${guild.ownerId}>\nLocale: ${guild.preferredLocale}\nFeatures:\`\`\`${guild.features.join('\n')}\`\`\``);
        await guild.client.channels.cache.get(guild.client.configs.guildlog).send({embeds: [embed]});
        guild.client.channels.cache.get(guild.client.configs.guildlog).setTopic(guild.client.guilds.cache.size);
    },
};