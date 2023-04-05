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

const {EmbedBuilder, PermissionsBitField, ApplicationCommandOptionType} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'userinfo',
    aliases: ['ui'],
    description: (lang) => lang.get('userInfoDescription'),
    cooldown: 5,
    categoryID: 1,
    usage: lang => [lang.get('userinfoUsage')],
    example: ['@LordHawk#0001'],
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(
            message.guild
            &&
            !message.guild.members.me
                .permissionsIn(message.channel)
                .has(PermissionsBitField.Flags.EmbedLinks)
        ) return message.reply(channelLanguage.get('botEmbed'));
        const id = args[0]?.match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];

        const user = id && await message.client.users.fetch(id).catch(() => null) || message.author;
        const member = user === message.author ? message.member : await message.guild?.members?.fetch(id).catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle(channelLanguage.get('userInfoTitle'))
            .setColor(0x2f3136)
            .addField("ID", '\`\`\`' + user.id + '\`\`\`')
            .addField(channelLanguage.get('userInfoUsername'), '\`\`\`' + user.tag + '\`\`\`')
        
        const badges = utils.userBadgesString(user);
        if(
            badges
            &&
            (
                !message.guild
                ||
                message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.UseExternalEmojis)
            )
        ) embed.addFields({name: channelLanguage.get('userInfoBadges'), value: badges});
        
        if(member && member.nickname) embed.addField(channelLanguage.get('userInfoNickname'), '\`\`\`' + member.nickname + '\`\`\`');

        embed.addField(
            channelLanguage.get('userInfoCreatedAt'),
            '<t:' + Math.floor(user.createdAt.getTime() / 1000) + ':R>',
            true,
        );
        
        if (member) embed.addField(channelLanguage.get('userInfoJoinedAt'), '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>', true);
        if (member && member.roles.cache) embed.addField(channelLanguage.get('userInfoRoles'), '\`\`\`' + member.roles.cache.filter(c => c.id !== message.guild.id).map(c => c.name).join(', ').slice(0, 1012) + '\`\`\`');
        
        embed
            .setThumbnail(user.avatarURL())
            .setTimestamp();

        message.reply({embeds: [embed]});
    },
    executeSlash: async (interaction, args) => {
        const {channelLanguage} = interaction;
        if(
            interaction.guild
            &&
            !interaction.guild.members.me
                .permissionsIn(interaction.channel)
                .has(PermissionsBitField.Flags.EmbedLinks)
        ) return await interaction.reply({
            content: channelLanguage.get('botEmbed'),
            ephemeral: true,
        });

        const user = args.target ?? interaction.user;
        const member = args.target ? args.target.member : interaction.member;
        const embed = new EmbedBuilder()
            .setTitle(channelLanguage.get('userInfoTitle'))
            .setColor(0x2f3136)
            .addField("ID", '\`\`\`' + user.id + '\`\`\`')
            .addField(channelLanguage.get('userInfoUsername'), '\`\`\`' + user.tag + '\`\`\`');
        
        const badges = utils.userBadgesString(user);
        if(
            badges
            &&
            (
                !interaction.guild
                ||
                interaction.guild.members.me
                    .permissionsIn(interaction.channel)
                    .has(PermissionsBitField.Flags.UseExternalEmojis)
            )
        ) embed.addFields({name: channelLanguage.get('userInfoBadges'), value: badges});

        if(member && member.nickname) embed.addField(channelLanguage.get('userInfoNickname'), '\`\`\`' + member.nickname + '\`\`\`');

        embed.addField(
            channelLanguage.get('userInfoCreatedAt'),
            '<t:' + Math.floor(user.createdAt.getTime() / 1000) + ':R>',
            true,
        );
        
        if (member) embed.addField(channelLanguage.get('userInfoJoinedAt'), '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>', true);
        if (member && member.roles.cache) embed.addField(channelLanguage.get('userInfoRoles'), '\`\`\`' + member.roles.cache.filter(c => c.id !== interaction.guild.id).map(c => c.name).join(', ').slice(0, 1012) + '\`\`\`');
        
        embed
            .setThumbnail(user.avatarURL())
            .setTimestamp();

            interaction.reply({embeds: [embed]});
    },
    slashOptions: [{
        type: ApplicationCommandOptionType.User,
        name: 'target',
        nameLocalizations: utils.getStringLocales('userInfoOptiontargetLocalisedName'),
        description: 'The user to show info',
        descriptionLocalizations: utils.getStringLocales('userInfoOptiontargetLocalisedDesc'),
        required: false,
    }],
    contextName: 'User info',
};