const {MessageEmbed, Permissions} = require('discord.js');
const guildModel = require('../../schemas/guild.js');
const locale = require('../../locale');
const configs = require('../configs.js');

module.exports = {
    name: 'guildCreate',
    execute: async guild => {
        var content = '';
        if(guild.me.permissions.has(Permissions.FLAGS.MANAGE_GUILD)){
            const integrations = await guild.fetchIntegrations({includeApplications: true});
            const adder = integrations.find(e => (e.application?.id === guild.client.application.id))?.user;
            if(adder){
                content = `Added by: ${adder} (${adder.tag})\n`;
                let guildLanguage = locale.get(guild.client.guildData.get(guild.id)?.language ?? ((guild.preferredLocale === 'pt-BR') ? 'pt' : 'en'));
                let dmEmbed = new MessageEmbed()
                    .setColor(0x8000ff)
                    .setDescription(guildLanguage.get('dmBotAdder', [adder, guild.name, guild.client.guildData.get(guild.id)?.prefix ?? 'y!', configs.support]));
                const buttonLocale = {
                    type: 'SELECT_MENU',
                    customId: 'locale',
                    placeholder: guildLanguage.get('language'),
                    options: locale.map((e, i) => ({
                        label: e.name,
                        value: i,
                        emoji: e.flag,
                        default: (i === guildLanguage.lang),
                    })),
                };
                const components = [{
                    type: 'ACTION_ROW',
                    components: [buttonLocale],
                }];
                adder.send({embeds: [dmEmbed], components}).then(dm => {
                    const collector = dm.createMessageComponentCollector({time: 600000});
                    collector.on('collect', i => (async i => {
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
                        guildLanguage = locale.get(i.values[0]);
                        dmEmbed.setDescription(guildLanguage.get('dmBotAdder', [adder, guild.name, guild.client.guildData.get(guild.id)?.prefix ?? 'y!', configs.support]));
                        buttonLocale.placeholder = guildLanguage.get('language');
                        buttonLocale.options = locale.map((e, i) => ({
                            label: e.name,
                            value: i,
                            emoji: e.flag,
                            default: (i === guildLanguage.lang),
                        }));
                        await i.update({embeds: [dmEmbed], components});
                    })(i).catch(err => guild.client.handlers.button(err, i)));
                    collector.on('end', async () => {
                        if(!dm.editable) return;
                        buttonLocale.disabled = true;
                        await dm.edit({components});
                    });
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
        await guild.client.channels.cache.get(configs.guildlog).send({embeds: [embed]});
        guild.client.channels.cache.get(configs.guildlog).setTopic(guild.client.guilds.cache.size);
    },
};