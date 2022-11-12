// Copyright (C) 2022  HordLawk

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const {EmbedBuilder, PermissionsBitField, ComponentType} = require('discord.js');
const guildModel = require('../../schemas/guild.js');
const locale = require('../../locale');
const configs = require('../configs.js');

module.exports = {
    name: 'guildCreate',
    execute: async guild => {
        var content = '';
        await guild.fetch();
        if(guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuild)){
            const integrations = await guild.fetchIntegrations({includeApplications: true});
            const adder = integrations.find(e => (e.application?.id === guild.client.application.id))?.user;
            if(adder){
                content = `Added by: ${adder} (${adder.tag})\n`;
                let guildLanguage = locale.get(
                    guild.client.guildData.get(guild.id)?.language
                    ??
                    ((guild.preferredLocale === 'pt-BR') ? 'pt' : 'en')
                );
                const helpSlash = (
                    (process.env.NODE_ENV === 'production')
                    ? guild.client.application
                    : guild.client.guilds.cache.get(process.env.DEV_GUILD)
                ).commands.cache.find(slash => (slash.name === 'help'));
                let dmEmbed = new EmbedBuilder()
                    .setColor(0x8000ff)
                    .setDescription(
                        guildLanguage.get(
                            'dmBotAdder',
                            [
                                adder,
                                guild.name,
                                helpSlash.id,
                                configs.support,
                            ],
                        ),
                    );
                const buttonLocale = {
                    type: ComponentType.SelectMenu,
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
                    type: ComponentType.ActionRow,
                    components: [buttonLocale],
                }];
                adder.send({embeds: [dmEmbed], components}).then(dm => {
                    const collector = dm.createMessageComponentCollector({time: 600000});
                    collector.on('collect', i => (async i => {
                        if(guild.client.guildData.has(guild.id)){
                            await guildModel.findByIdAndUpdate(
                                guild.id,
                                {$set: {language: (guild.client.guildData.get(guild.id).language = i.values[0])}},
                            );
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
                        dmEmbed.setDescription(
                            guildLanguage.get(
                                'dmBotAdder',
                                [
                                    adder,
                                    guild.name,
                                    helpSlash.id,
                                    configs.support,
                                ],
                            )
                        );
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
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setAuthor({
                name: 'Joined Guild',
                iconURL: guild.iconURL({dynamic: true}),
            })
            .setDescription(
                `${content}Member count: ${guild.memberCount}\n` +
                `ID: ${guild.id}\n` +
                `Name: ${guild.name}\n` +
                `Owner: <@${guild.ownerId}>\n` +
                `Locale: ${guild.preferredLocale}\n` +
                `Features:\`\`\`${guild.features.join('\n')}\`\`\``
            );
        await guild.client.channels.cache.get(configs.guildlog).send({embeds: [embed]});
        guild.client.channels.cache.get(configs.guildlog).setTopic(guild.client.guilds.cache.size);
    },
};