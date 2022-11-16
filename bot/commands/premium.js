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

const {EmbedBuilder, ApplicationCommandOptionType, ButtonStyle, ComponentType} = require('discord.js');
const axios = require('axios');
const { handleComponentError } = require('../utils.js');

module.exports = {
    active: true,
    name: 'premium',
    description: lang => lang.get('premiumDescription'),
    cooldown: 5,
    categoryID: 5,
    args: true,
    usage: lang => ['activate', 'info', lang.get('premiumUsage0')],
    example: ['renew on 476244157245947904'],
    activateSlash: async interaction => {
        const {channelLanguage} = interaction;
        if(interaction.guild && (interaction.client.guildData.get(interaction.guild.id).premiumUntil || interaction.client.guildData.get(interaction.guild.id).partner)) return interaction.reply({
            content: channelLanguage.get('alreadyPremium'),
            ephemeral: true,
        });
        const user = require('../../schemas/user.js');
        const userDoc = await user.findById(interaction.user.id);
        if(!interaction.guild) return interaction.reply(channelLanguage.get('activatePremium', [userDoc?.premiumKeys]));
        const buttonKey = {
            type: ComponentType.Button,
            label: channelLanguage.get('premiumKeysLabel'),
            style: ButtonStyle.Primary,
            emoji: '🔑',
            customId: 'useKey',
            disabled: !userDoc?.premiumKeys
        };
        const buttonReward = {
            type: ComponentType.Button,
            label: channelLanguage.get('premiumPatreonLabel'),
            style: ButtonStyle.Secondary,
            emoji: '943405711243739176',
            customId: 'useReward',
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonKey, buttonReward],
        }];
        const reply = await interaction.reply({
            content: channelLanguage.get('activatePremium', [userDoc?.premiumKeys]),
            components,
            ephemeral: true,
            fetchReply: true,
        });
        const collector = reply.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
            idle: 10000,
            max: 1,
            componentType: ComponentType.Button,
        });
        collector.on('collect', i => (async i => {
            const guild = require('../../schemas/guild.js');
            switch(i.customId){
                case 'useKey': {
                    if(!userDoc?.premiumKeys) return;
                    userDoc.premiumKeys--;
                    await userDoc.save();
                    const premiumUntil = new Date(Date.now() + 2592000000);
                    await guild.findByIdAndUpdate(interaction.guild.id, {$set: {premiumUntil: premiumUntil}});
                    interaction.client.guildData.get(interaction.guild.id).premiumUntil = premiumUntil;
                    await i.update({
                        content: channelLanguage.get('activatePremiumSuccess'),
                        components: [],
                    });
                }
                break;
                case 'useReward': {
                    await i.deferUpdate();
                    const searchPledge = async url => {
                        const pledges = await axios({
                            method: 'GET',
                            url: url,
                            headers: {Authorization: `Bearer ${process.env.PATREON_TOKEN}`},
                        }).then(res => res.data);
                        const user = pledges.included.find(e => ((e.type === 'user') && (e.attributes.social_connections.discord?.user_id === interaction.user.id)));
                        if(!user){
                            if(!pledges.links.next) return null;
                            return await searchPledge(pledges.links.next);
                        }
                        return pledges.data.find(e => ((e.type === 'pledge') && (e.relationships.patron.data.id === user.id)));
                    }
                    const pledge = await searchPledge('https://www.patreon.com/api/oauth2/api/campaigns/8230487/pledges');
                    if(!pledge) return await i.editReply(({
                        content: channelLanguage.get('pledgeNotFound'),
                        components: [],
                    }));
                    const rewardTotal = {
                        '8304182': 1,
                        '8307567': 2,
                        '8307569': 3,
                    };
                    if(interaction.client.guildData.filter(e => (e.patron === interaction.user.id)).size >= rewardTotal[pledge.relationships.reward.data.id]) return await i.editReply({
                        content: channelLanguage.get('noRewardsRemaining'),
                        components: [],
                    });
                    const guildData = await guild.findByIdAndUpdate(interaction.guild.id, {$set: {
                        premiumUntil: new Date(Date.now() + 2764800000),
                        patron: interaction.user.id,
                    }}, {new: true});
                    interaction.client.guildData.set(interaction.guild.id, guildData);
                    const buttonRenew = {
                        type: ComponentType.Button,
                        label: channelLanguage.get('enableRenew'),
                        style: ButtonStyle.Primary,
                        emoji: '♻️',
                        customId: 'renew',
                    };
                    const components = [{
                        type: ComponentType.ActionRow,
                        components: [buttonRenew],
                    }];
                    const reply2 = await i.editReply({
                        content: channelLanguage.get('patreonRewardClaimed'),
                        components,
                        fetchReply: true,
                    });
                    const collector2 = reply2.createMessageComponentCollector({
                        filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
                        idle: 10000,
                        max: 1,
                        componentType: ComponentType.Button,
                    });
                    collector2.on('collect', i2 => (async i2 => {
                        await guild.findByIdAndUpdate(interaction.guild.id, {$set: {renewPremium: (interaction.client.guildData.get(interaction.guild.id).renewPremium = true)}});
                        await i2.update({
                            content: channelLanguage.get('renewEnabled'),
                            components: [],
                        });
                    })(i2).catch(async err => await handleComponentError(err, i2)));
                    collector2.on('end', async collected => {
                        if(!reply2.editable) return;
                        if(collected.size) return;
                        buttonRenew.disabled = true;
                        await i.editReply({components});
                    });
                }
                break;
            }
        })(i).catch(async err => await handleComponentError(err, i)));
        collector.on('end', async collected => {
            if(!reply.editable) return;
            if(collected.size) return;
            buttonReward.disabled = buttonKey.disabled = true;
            await interaction.editReply({content: channelLanguage.get('timedOut'), components});
        });
    },
    infoSlash: async interaction => {
        const {channelLanguage} = interaction;
        const fields = (
            await interaction.client.shard.broadcastEval(async (c, {userId, channelLanguage}) => {
                return c.guildData.filter(e => (e.patron === userId)).map(e => {
                    const guild = c.guilds.cache.get(e.id);
                    return {
                        name: guild?.name ?? channelLanguage.get('unknownGuild'),
                        value: channelLanguage.get(
                            'premiumInfoFieldValue',
                            [Math.floor(e.premiumUntil.getTime() / 1000), guild && e.renewPremium],
                        ),
                    };
                })
            }, {context: {userId: interaction.user.id, channelLanguage}})
        ).flat();
        if(!fields.length) return interaction.reply({
            content: channelLanguage.get('notPatron'),
            ephemeral: true,
        });
        const embed = new EmbedBuilder()
            .setColor(interaction.guild?.members.me.displayColor || 0x8000ff)
            .addFields(fields);
        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    },
    renewSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        const guildName = (
            await interaction.client.shard.broadcastEval(
                (c, {guildId}) => c.guilds.cache.get(guildId)?.name,
                {context: {guildId: args.guild}},
            )
        ).find(name => name);
        if(!guildName) return interaction.reply({
            content: channelLanguage.get('invGuild'),
            ephemeral: true,
        });
        const guild = require('../../schemas/guild.js');
        const guildDoc = await guild.findByIdAndUpdate(args.guild, {$set: {renewPremium: args.enable}}, {new: true});
        if(!guildDoc) return interaction.reply({
            content: channelLanguage.get('invGuild'),
            ephemeral: true,
        });
        await interaction.client.shard.broadcastEval((c, {guildId, renewPremium}) => {
            const guildData = c.guildData.get(guildId);
            if(guildData) guildData.renewPremium = renewPremium;
        }, {context: {
            guildId: guildDoc._id,
            renewPremium: guildDoc.renewPremium,
        }});
        await interaction.reply({
            content: channelLanguage.get('renewChangeSuccess', [guildName, guildDoc.renewPremium]),
            ephemeral: true,
        });
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'activate',
            description: 'Enabled premium features in the current server',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            description: 'Shows information about which servers you have used Patreon rewards and their renew status',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'renew',
            description: 'Manages the renew status for servers you have given premium through Patreon rewards',
            options: [
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'enable',
                    description: 'Whether to enable monthly automatic premium renewals for the chosen server',
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'guild',
                    description: 'The guild to enable or disable automatic premium renewals',
                    required: true,
                    autocomplete: true,
                },
            ],
        },
    ],
    renewAutocomplete: {
        guild: (interaction, value) => {
            interaction.client.shard.broadcastEval(
                (c, {userId, value}) => {
                    return c.guilds.cache
                        .filter(guild => {
                            return (
                                (c.guildData.get(guild.id)?.patron === userId)
                                &&
                                guild.name.toLowerCase().startsWith(value.toLowerCase())
                            );
                        })
                        .map(guild => ({
                            name: guild.name,
                            value: guild.id,
                        }));
                },
                {context: {userId: interaction.user.id, value}},
            ).then(guildOptions => interaction.respond(guildOptions.flat().slice(0, 25)));
        },
    },
};