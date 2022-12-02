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

const {
    EmbedBuilder,
    PermissionsBitField,
    ApplicationCommandOptionType,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const configs = require('../configs.js');
const { handleComponentError } = require('../utils.js');

const rankPage = (docs, page, pageSize, userId, guild) => `\`\`\`ansi\n${docs.map((doc, i) => {
    let posColour = '\u001b[';
    let resetColour = '\u001b[0';
    let tagColour = '';
    let tagResetColour = '';
    if(doc.userID === userId){
        posColour += '1;40;';
        resetColour += ';1;40';
        tagColour = '\u001b[37m';
        tagResetColour = '\u001b[0;1;40m';
    }
    else{
        posColour += '0;'
    }
    return (
        `${posColour}35m#` +
        ((page * pageSize) + i + 1).toString().padEnd((pageSize * (page + 1)).toString().length, ' ') +
        `${resetColour}m - ${tagColour}` +
        guild.members.cache.get(doc.userID).user.tag.padEnd(
            Math.max(...docs.map(d => guild.members.cache.get(d.userID).user.tag.length)),
            ' ',
        ) +
        `${tagResetColour} | \u001b[36m` +
        `${Math.floor(doc.xp).toString().padStart(Math.floor(docs[0].xp).toString().length, ' ')}xp`
    );
}).join('\n')}\`\`\``;

module.exports = {
    active: true,
    name: 'xp',
    description: lang => lang.get('xpDescription'),
    aliases: ['xp', 'exp', 'rank'],
    usage: lang => [lang.get('xpUsage0'), lang.get('xpUsage1'), lang.get('xpUsage2')],
    example: ['xp @LordHawk#0001', 'xp rank', 'xp roles'],
    cooldown: 10,
    categoryID: 4,
    guildOnly: true,
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(message.guild && !message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.EmbedLinks)) return message.reply(channelLanguage.get('botEmbed'));
        if(!message.client.guildData.get(message.guild.id).gainExp && !message.client.guildData.get(message.guild.id).voiceXpCooldown) return message.reply(channelLanguage.get('xpDisabled'));
        const role = require('../../schemas/role.js');
        const member = require('../../schemas/member.js');
        switch(args[0]){
            case 'rank': {
                const verbose = (args[1] === 'verbose') && (message.author.id === message.client.application.owner.id);
                if(message.client.guildData.get(message.guild.id).processing) return message.reply(channelLanguage.get('processing'));
                message.client.guildData.get(message.guild.id).processing = true;
                let cachePage = 0;
                const cachePageSize = 100;
                let parcialMemberDocs = await member.find({
                    guild: message.guild.id,
                    xp: {$gte: 1},
                }, 'userID xp').sort({xp: -1}).limit(cachePageSize);
                if(verbose){
                    console.log('100 database members');
                }
                const members = await message.guild.members.fetch({user: parcialMemberDocs.map(e => e.userID)});
                parcialMemberDocs = parcialMemberDocs.filter(e => members.has(e.userID));
                if(!parcialMemberDocs.length) return await message.reply(channelLanguage.get('noRankedMembers'));
                if(verbose){
                    console.log('interception database and discord members:');
                    console.log(`length: ${parcialMemberDocs.length}`);
                    console.log(parcialMemberDocs.map(e => e.userID));
                }
                let page = 0;
                const pageSize = 20;
                const memberDocsSize = await member.countDocuments({
                    guild: message.guild.id,
                    xp: {$gte: 1},
                });
                const fetchMore = async () => {
                    const auxParcialMemberDocs = await member.find({
                        guild: message.guild.id,
                        xp: {$gte: 1},
                    }, 'userID xp').sort({xp: -1}).skip((cachePage++ + 1) * cachePageSize).limit(cachePageSize);
                    if(verbose){
                        console.log('more 100 database members');
                    }
                    const auxMembers = await message.guild.members.fetch({user: auxParcialMemberDocs.map(e => e.userID)});
                    if(verbose){
                        console.log('interception as database members:');
                        console.log(`length: ${auxMembers.size}`);
                        console.log(auxParcialMemberDocs.filter(e => auxMembers.has(e.userID)).map(e => e.userID));
                    }
                    parcialMemberDocs = parcialMemberDocs.concat(auxParcialMemberDocs.filter(e => auxMembers.has(e.userID)));
                    if(((((page + 1) * pageSize) + 1) > parcialMemberDocs.length) && (((cachePage + 1) * cachePageSize) < memberDocsSize)) await fetchMore();
                }
                if((pageSize + 1) > parcialMemberDocs.length) await fetchMore();
                let memberDocs = parcialMemberDocs.slice(0, pageSize + 1);
                const memberDoc = await member.findOne({
                    guild: message.guild.id,
                    userID: message.author.id,
                    xp: {$gte: 1},
                });
                let memberDocsSliced = memberDocs.slice(0, pageSize);
                const embed = new EmbedBuilder()
                    .setColor(message.guild.members.me.displayColor || 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('xpRankEmbedAuthor'),
                        iconURL: message.guild.iconURL({dynamic: true}),
                    })
                    .setTimestamp()
                    .setDescription(rankPage(memberDocsSliced, page, pageSize, message.author.id, message.guild));
                if(memberDoc){
                    const queryFilter = {
                        guild: message.guild.id,
                        xp: {$gt: memberDoc.xp},
                    };
                    if(members.has(message.author.id)) queryFilter.userID = {$in: members.map(e => e.id)};
                    const rank = await member.countDocuments(queryFilter);
                    embed.setFooter({text: channelLanguage.get('xpRankEmbedFooter', [rank + 1])});
                }
                message.client.guildData.get(message.guild.id).processing = false;
                const buttonPrevious = {
                    type: ComponentType.Button,
                    label: channelLanguage.get('previous'),
                    style: ButtonStyle.Primary,
                    emoji: '⬅',
                    customId: 'previous',
                    disabled: true,
                };
                const buttonNext = {
                    type: ComponentType.Button,
                    label: channelLanguage.get('next'),
                    style: ButtonStyle.Primary,
                    emoji: '➡',
                    customId: 'next',
                    disabled: (memberDocs.length <= pageSize),
                };
                const components = [{
                    type: ComponentType.ActionRow,
                    components: [buttonPrevious, buttonNext],
                }];
                const reply = await message.reply({embeds: [embed], components});
                if(memberDocs.length <= pageSize) return;
                const collector = reply.createMessageComponentCollector({
                    filter: componentInteraction => (componentInteraction.user.id === message.author.id),
                    time: 600000,
                    componentType: ComponentType.Button,
                });
                collector.on('collect', buttonInteraction => (async buttonInteraction => {
                    switch(buttonInteraction.customId){
                        case 'next': {
                            if(memberDocs.length <= pageSize) return;
                            page++;
                            if((((page + 1) * pageSize) + 1) > parcialMemberDocs.length){
                                await buttonInteraction.deferUpdate();
                                await fetchMore();
                            }
                            memberDocs = parcialMemberDocs.slice(page * pageSize, ((page + 1) * pageSize) + 1);
                        }
                        break;
                        case 'previous': {
                            if(!page) return;
                            memberDocs = parcialMemberDocs.slice((page - 1) * pageSize, ((page - 1) * pageSize) + pageSize + 1);
                            page--;
                        }
                        break;
                    }
                    memberDocsSliced = memberDocs.slice(0, pageSize);
                    embed.setDescription(rankPage(memberDocsSliced, page, pageSize, message.author.id, message.guild));
                    buttonPrevious.disabled = !page;
                    buttonNext.disabled = (memberDocs.length <= pageSize);
                    await buttonInteraction[buttonInteraction.deferred ? 'editReply' : 'update']({embeds: [embed], components});
                })(buttonInteraction).catch(async err => await handleComponentError(err, buttonInteraction)));
                collector.on('end', async () => {
                    if(!reply.editable) return;
                    buttonNext.disabled = buttonPrevious.disabled = true;
                    await reply.edit({embeds: [embed], components});
                });
            }
            break;
            case 'roles': {
                let roles = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                    xp: {
                        $exists: true,
                        $ne: null,
                    },
                }).sort({xp: -1});
                if(!roles.length) return message.reply(channelLanguage.get('noXpRoles'));
                const replyData = {};
                if((roles.length > configs.xpRolesLimit) && !message.client.guildData.get(message.guild.id).premiumUntil && !message.client.guildData.get(message.guild.id).partner) replyData.content = channelLanguage.get('disabledPremiumXpRolesNoHL');
                let embed = new EmbedBuilder()
                    .setColor(message.guild.members.me.displayColor || 0x8000ff)
                    .setAuthor({
                        name: channelLanguage.get('xpRolesEmbedAuthor'),
                        iconURL: message.guild.iconURL({dynamic: true}),
                    })
                    .setDescription(roles.map((e, i) => {
                        const roleStr = `\`${(new Array(roles[0].xp.toString().length - e.xp.toString().length)).fill(' ').join('')}${e.xp}\` **-** <@&${e.roleID}>`;
                        return (((roles.length - i) > configs.xpRolesLimit) && !message.client.guildData.get(message.guild.id).premiumUntil && !message.client.guildData.get(message.guild.id).partner) ? `~~${roleStr}~~` : roleStr;
                    }).join('\n'));
                replyData.embeds = [embed];
                message.reply(replyData);
            }
            break;
            default: {
                let id = args[0]?.match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
                let user = await member.findOne({
                    guild: message.guild.id,
                    userID: id || message.author.id,
                });
                if(!user) return message.reply(channelLanguage.get('noXp'));
                let roleDocs = await role.find({
                    guild: message.guild.id,
                    roleID: {$in: message.guild.roles.cache.map(e => e.id)},
                    xp: {
                        $exists: true,
                        $ne: null,
                    },
                }).sort({xp: -1});
                const availableRoles = ((roleDocs.length > configs.xpRolesLimit) && !message.client.guildData.get(message.guild.id).premiumUntil && !message.client.guildData.get(message.guild.id).partner) ? roleDocs.slice(-configs.xpRolesLimit) : roleDocs;
                let current = availableRoles.find(e => (e.xp <= user.xp));
                let next = availableRoles.reverse().find(e => (e.xp > user.xp));
                let discordMember = await message.guild.members.fetch(user.userID).catch(() => null);
                let discordUser = discordMember?.user ?? await message.client.users.fetch(id).catch(() => null);
                let embed = new EmbedBuilder()
                    .setColor(discordMember?.displayColor ?? message.guild.members.me.displayColor ?? 0x8000ff)
                    .setAuthor({
                        name: discordUser?.tag ?? channelLanguage.get('xpEmbedAuthor'),
                        iconURL: discordUser?.displayAvatarURL({dynamic: true}),
                    })
                    .setTimestamp()
                    .setDescription(channelLanguage.get('xpEmbedDescription', [current, next, Math.floor(user.xp)]));
                message.reply({embeds: [embed]});
            }
        }
    },
    infoSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(!args.user) args = {user: interaction.isUserContextMenuCommand() ? (interaction.targetUser.member = interaction.targetMember, interaction.targetUser) : (interaction.user.member = interaction.member, interaction.user)};
        if(!interaction.client.guildData.get(interaction.guild.id).gainExp && !interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown) return interaction.reply({
            content: channelLanguage.get('xpDisabled'),
            ephemeral: true,
        });
        const member = require('../../schemas/member.js');
        const user = await member.findOne({
            guild: interaction.guild.id,
            userID: args.user.id,
        });
        if(!user) return interaction.reply({
            content: channelLanguage.get('noXp'),
            ephemeral: true,
        });
        const role = require('../../schemas/role.js');
        const roleDocs = await role.find({
            guild: interaction.guild.id,
            roleID: {$in: interaction.guild.roles.cache.map(e => e.id)},
            xp: {
                $exists: true,
                $ne: null,
            },
        }).sort({xp: -1});
        const availableRoles = ((roleDocs.length > configs.xpRolesLimit) && !interaction.client.guildData.get(interaction.guild.id).premiumUntil && !interaction.client.guildData.get(interaction.guild.id).partner) ? roleDocs.slice(-configs.xpRolesLimit) : roleDocs;
        const current = availableRoles.find(e => (e.xp <= user.xp));
        const next = availableRoles.reverse().find(e => (e.xp > user.xp));
        let embed = new EmbedBuilder()
            .setColor(args.user.member?.displayColor ?? interaction.guild.members.me.displayColor ?? 0x8000ff)
            .setAuthor({
                name: args.user.tag ?? channelLanguage.get('xpEmbedAuthor'),
                iconURL: args.user.displayAvatarURL({dynamic: true}),
            })
            .setTimestamp()
            .setDescription(channelLanguage.get('xpEmbedDescription', [current, next, Math.floor(user.xp)]));
        await interaction.reply({embeds: [embed]});
    },
    rankSlash: async interaction => {
        const {channelLanguage} = interaction;
        if(!interaction.client.guildData.get(interaction.guild.id).gainExp && !interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown) return interaction.reply({
            content: channelLanguage.get('xpDisabled'),
            ephemeral: true,
        });
        if(interaction.client.guildData.get(interaction.guild.id).processing) return interaction.reply({
            content: channelLanguage.get('processing'),
            ephemeral: true,
        });
        interaction.client.guildData.get(interaction.guild.id).processing = true;
        await interaction.deferReply();
        let cachePage = 0;
        const cachePageSize = 100;
        const member = require('../../schemas/member.js');
        let parcialMemberDocs = await member.find({
            guild: interaction.guild.id,
            xp: {$gte: 1},
        }, 'userID xp').sort({xp: -1}).limit(cachePageSize);
        const members = await interaction.guild.members.fetch({user: parcialMemberDocs.map(e => e.userID)});
        parcialMemberDocs = parcialMemberDocs.filter(e => members.has(e.userID));
        if(!parcialMemberDocs.length) return await interaction.reply({
            content: channelLanguage.get('noRankedMembers'),
            ephemeral: true,
        });
        let page = 0;
        const pageSize = 20;
        const memberDocsSize = await member.countDocuments({
            guild: interaction.guild.id,
            xp: {$gte: 1},
        });
        const fetchMore = async () => {
            const auxParcialMemberDocs = await member.find({
                guild: interaction.guild.id,
                xp: {$gte: 1},
            }, 'userID xp').sort({xp: -1}).skip((cachePage++ + 1) * cachePageSize).limit(cachePageSize);
            const auxMembers = await interaction.guild.members.fetch({user: auxParcialMemberDocs.map(e => e.userID)});
            parcialMemberDocs = parcialMemberDocs.concat(auxParcialMemberDocs.filter(e => auxMembers.has(e.userID)));
            if(((((page + 1) * pageSize) + 1) > parcialMemberDocs.length) && (((cachePage + 1) * cachePageSize) < memberDocsSize)) await fetchMore();
        }
        if((pageSize + 1) > parcialMemberDocs.length) await fetchMore();
        let memberDocs = parcialMemberDocs.slice(0, pageSize + 1);
        const memberDoc = await member.findOne({
            guild: interaction.guild.id,
            userID: interaction.user.id,
            xp: {$gte: 1},
        });
        let memberDocsSliced = memberDocs.slice(0, pageSize);
        const embed = new EmbedBuilder()
            .setColor(interaction.guild.members.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('xpRankEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setTimestamp()
            .setDescription(rankPage(memberDocsSliced, page, pageSize, interaction.user.id, interaction.guild));
        if(memberDoc){
            const queryFilter = {
                guild: interaction.guild.id,
                xp: {$gt: memberDoc.xp},
            };
            if(members.has(interaction.user.id)) queryFilter.userID = {$in: members.map(e => e.id)};
            const rank = await member.countDocuments(queryFilter);
            embed.setFooter({text: channelLanguage.get('xpRankEmbedFooter', [rank + 1])});
        }
        interaction.client.guildData.get(interaction.guild.id).processing = false;
        const buttonPrevious = {
            type: ComponentType.Button,
            label: channelLanguage.get('previous'),
            style: ButtonStyle.Primary,
            emoji: '⬅',
            customId: 'previous',
            disabled: true,
        };
        const buttonNext = {
            type: ComponentType.Button,
            label: channelLanguage.get('next'),
            style: ButtonStyle.Primary,
            emoji: '➡',
            customId: 'next',
            disabled: (memberDocs.length <= pageSize),
        };
        const components = [{
            type: ComponentType.ActionRow,
            components: [buttonPrevious, buttonNext],
        }];
        const reply = await interaction.editReply({
            embeds: [embed],
            components,
            fetchReply: true,
        });
        if(memberDocs.length <= pageSize) return;
        const collector = reply.createMessageComponentCollector({
            filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
            time: 600000,
            componentType: ComponentType.Button,
        });
        collector.on('collect', buttonInteraction => (async buttonInteraction => {
            switch(buttonInteraction.customId){
                case 'next': {
                    if(memberDocs.length <= pageSize) return;
                    page++;
                    if((((page + 1) * pageSize) + 1) > parcialMemberDocs.length){
                        await buttonInteraction.deferUpdate();
                        await fetchMore();
                    }
                    memberDocs = parcialMemberDocs.slice(page * pageSize, ((page + 1) * pageSize) + 1);
                }
                break;
                case 'previous': {
                    if(!page) return;
                    memberDocs = parcialMemberDocs.slice((page - 1) * pageSize, ((page - 1) * pageSize) + pageSize + 1);
                    page--;
                }
                break;
            }
            memberDocsSliced = memberDocs.slice(0, pageSize);
            embed.setDescription(rankPage(memberDocsSliced, page, pageSize, interaction.user.id, interaction.guild));
            buttonPrevious.disabled = !page;
            buttonNext.disabled = (memberDocs.length <= pageSize);
            await buttonInteraction[buttonInteraction.deferred ? 'editReply' : 'update']({embeds: [embed], components});
        })(buttonInteraction).catch(async err => await handleComponentError(err, buttonInteraction)));
        collector.on('end', async () => {
            if(!reply.editable) return;
            buttonNext.disabled = buttonPrevious.disabled = true;
            await interaction.editReply({embeds: [embed], components});
        })
    },
    rolesSlash: async interaction => {
        const {channelLanguage} = interaction;
        if(!interaction.client.guildData.get(interaction.guild.id).gainExp && !interaction.client.guildData.get(interaction.guild.id).voiceXpCooldown) return interaction.reply({
            content: channelLanguage.get('xpDisabled'),
            ephemeral: true,
        });
        const role = require('../../schemas/role.js');
        const roles = await role.find({
            guild: interaction.guild.id,
            roleID: {$in: interaction.guild.roles.cache.map(e => e.id)},
            xp: {
                $exists: true,
                $ne: null,
            },
        }).sort({xp: -1});
        if(!roles.length) return interaction.reply({
            content: channelLanguage.get('noXpRoles'),
            ephemeral: true,
        });
        const replyData = {};
        if((roles.length > configs.xpRolesLimit) && !interaction.client.guildData.get(interaction.guild.id).premiumUntil && !interaction.client.guildData.get(interaction.guild.id).partner) replyData.content = channelLanguage.get('disabledPremiumXpRoles');
        let embed = new EmbedBuilder()
            .setColor(interaction.guild.members.me.displayColor || 0x8000ff)
            .setAuthor({
                name: channelLanguage.get('xpRolesEmbedAuthor'),
                iconURL: interaction.guild.iconURL({dynamic: true}),
            })
            .setDescription(roles.map((e, i) => {
                const roleStr = `\`${(new Array(roles[0].xp.toString().length - e.xp.toString().length)).fill(' ').join('')}${e.xp}\` **-** <@&${e.roleID}>`;
                return (((roles.length - i) > configs.xpRolesLimit) && !interaction.client.guildData.get(interaction.guild.id).premiumUntil && !interaction.client.guildData.get(interaction.guild.id).partner) ? `~~${roleStr}~~` : roleStr;
            }).join('\n'))
            .setTimestamp();
        replyData.embeds = [embed];
        await interaction.reply(replyData);
    },
    executeSlash: async function(...args){
        this.infoSlash(...args);
    },
    slashOptions: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            description: 'Shows the xp info of a selected user',
            options: [{
                type: ApplicationCommandOptionType.User,
                name: 'user',
                description: 'The user you want to see the xp info of',
                required: false,
            }]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'rank',
            description: 'Lists this server\'s members sorted by their xp',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'roles',
            description: 'Lists the roles you can aquire by earning xp',
        },
    ],
    contextName: 'Xp info',
};