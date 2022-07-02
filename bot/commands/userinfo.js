const {MessageEmbed, Permissions} = require('discord.js');
const utils = require('../utils.js');

module.exports = {
    active: true,
    name: 'userinfo',
    aliases: 'ui',
    description: (lang) => lang.get('userInfoDescription'),
    cooldown: 5,
    categoryID: 1,
    execute: async (message, args) => {
        const {channelLanguage} = message;
        if(
            message.guild
            &&
            !message.guild.me
                .permissionsIn(message.channel)
                .has(Permissions.FLAGS.EMBED_LINKS)
        ) return message.reply(channelLanguage.get('botEmbed'));
        const id = args ?? args[0]?.match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];

        const user = id && await message.client.users.fetch(id).catch(() => null) || message.author;
        const member = user === message.author ? message.member : message.guild?.members?.cache.get(id);

        const embed = new MessageEmbed()
            .setTitle(channelLanguage.get('userInfoTitle'))
            .setColor(0x2f3136)
            .addField(channelLanguage.get('userInfoUsername'), '\`\`\`' + user.tag + '\`\`\`');
        
        if(member && member.nickname) embed.addField(channelLanguage.get('userInfoNickname'), '\`\`\`' + member.nickname + '\`\`\`');

        embed
            .addField("ID", '\`\`\`' + user.id + '\`\`\`')
            .addField(channelLanguage.get('userInfoCreatedAt'), '<t:' + Math.floor(user.createdAt.getTime() / 1000) + ':R>', true);
        
        if (member) embed.addField(channelLanguage.get('userInfoJoinedAt'), '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>', true);
        if (member && member.roles.cache) embed.addField(channelLanguage.get('userInfoRoles'), '\`\`\`' + member.roles.cache.filter(c => c.name != '\@everyone').map(c => c.name).join(', ') + '\`\`\`');
        
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
            !interaction.guild.me
                .permissionsIn(interaction.channel)
                .has(Permissions.FLAGS.EMBED_LINKS)
        ) return interaction.reply(channelLanguage.get('botEmbed'));
        const id = args ?? args[0]?.match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];

        const user = id && await interaction.client.users.fetch(id).catch(() => null) || interaction.author;
        const member = user === interaction.author ? interaction.member : interaction.guild?.members?.cache.get(id);
        const embed = new MessageEmbed()
            .setTitle(channelLanguage.get('userInfoTitle'))
            .setColor(0x2f3136)
            .addField(channelLanguage.get('userInfoUsername'), '\`\`\`' + user.tag + '\`\`\`');
        
        if(member && member.nickname) embed.addField(channelLanguage.get('userInfoNickname'), '\`\`\`' + member.nickname + '\`\`\`');

        embed
            .addField("ID", '\`\`\`' + user.id + '\`\`\`')
            .addField(channelLanguage.get('userInfoCreatedAt'), '<t:' + Math.floor(user.createdAt.getTime() / 1000) + ':R>', true);
        
        if (member) embed.addField(channelLanguage.get('userInfoJoinedAt'), '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>', true);
        if (member && member.roles.cache) embed.addField(channelLanguage.get('userInfoRoles'), '\`\`\`' + member.roles.cache.filter(c => c.name != '\@everyone').map(c => c.name).join(', ') + '\`\`\`');
        
        embed
            .setThumbnail(user.avatarURL())
            .setTimestamp();

            interaction.reply({embeds: [embed]});
    },
    slashOptions: [{
        type: 'USER',
        name: 'target',
        nameLocalizations: utils.getStringLocales('banOptiontargetLocalisedName'),
        description: 'The user to show info',
        descriptionLocalizations: utils.getStringLocales('userInfoOptiontargetLocalisedDesc'),
        required: false,
    }],
};