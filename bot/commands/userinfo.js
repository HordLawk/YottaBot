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
        const member = user === message.author ? message.member : await message.guild?.members?.fetch(id).catch(() => null);

        const embed = new MessageEmbed()
            .setTitle(channelLanguage.get('userInfoTitle'))
            .setColor(0x2f3136)
            .addField(channelLanguage.get('userInfoUsername'), '\`\`\`' + user.tag + '\`\`\`');
        
        if(member && member.nickname) embed.addField(channelLanguage.get('userInfoNickname'), '\`\`\`' + member.nickname + '\`\`\`');

        embed
            .addField("ID", '\`\`\`' + user.id + '\`\`\`')
            .addField(channelLanguage.get('userInfoCreatedAt'), '<t:' + Math.floor(user.createdAt.getTime() / 1000) + ':R>', true);
        
        if (member) embed.addField(channelLanguage.get('userInfoJoinedAt'), '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>', true);
        if (member && member.roles.cache) embed.addField(channelLanguage.get('userInfoRoles'), '\`\`\`' + member.roles.cache.filter(c => c.name != '\@everyone').map(c => c.name).join(', ').slice(0, 1012) + '\`\`\`');
        
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
        ) return await interaction.reply({
            content: channelLanguage.get('botEmbed'),
            ephemeral: true,
        });

        const user = args.target ?? interaction.user;
        const member = args.target ? args.target.member : interaction.member;
        const embed = new MessageEmbed()
            .setTitle(channelLanguage.get('userInfoTitle'))
            .setColor(0x2f3136)
            .addField(channelLanguage.get('userInfoUsername'), '\`\`\`' + user.tag + '\`\`\`');
        
        if(member && member.nickname) embed.addField(channelLanguage.get('userInfoNickname'), '\`\`\`' + member.nickname + '\`\`\`');

        embed
            .addField("ID", '\`\`\`' + user.id + '\`\`\`')
            .addField(channelLanguage.get('userInfoCreatedAt'), '<t:' + Math.floor(user.createdAt.getTime() / 1000) + ':R>', true);
        
        if (member) embed.addField(channelLanguage.get('userInfoJoinedAt'), '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>', true);
        if (member && member.roles.cache) embed.addField(channelLanguage.get('userInfoRoles'), '\`\`\`' + member.roles.cache.filter(c => c.id !== interaction.guild.id).map(c => c.name).join(', ').slice(0, 1012) + '\`\`\`');
        
        embed
            .setThumbnail(user.avatarURL())
            .setTimestamp();

            interaction.reply({embeds: [embed]});
    },
    slashOptions: [{
        type: 'USER',
        name: 'target',
        nameLocalizations: utils.getStringLocales('userInfoOptiontargetLocalisedName'),
        description: 'The user to show info',
        descriptionLocalizations: utils.getStringLocales('userInfoOptiontargetLocalisedDesc'),
        required: false,
    }],
};