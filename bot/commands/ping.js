const {EmbedBuilder, PermissionsBitField} = require('discord.js');

module.exports = {
    active: true,
    name: 'ping',
    description: (lang) => lang.get('pingDescription'),
    cooldown: 5,
    categoryID: 1,
    execute: async message => {
        const {channelLanguage} = message;
        if(
            message.guild
            &&
            !message.guild.members.me
                .permissionsIn(message.channel)
                .has(PermissionsBitField.Flags.EmbedLinks)
        ) return message.reply(channelLanguage.get('botEmbed'));
        const hex = (latency) => {
            if(latency <= 100) return '00ff00';
            if(latency >= 1000) return 'ff0000';
            const a = Math.round((510 * (latency - 100)) / 900);
            if(a <= 255) return `${(`0${a.toString(16)}`).slice(-2)}ff00`;
            return `ff${(`0${(255 - (a - 255)).toString(16)}`).slice(-2)}00`;
        };
        const foot = (latency) => {
            if(latency >= 1000) return channelLanguage.get('terrible');
            if(latency >= 300) return channelLanguage.get('bad');
            if(latency >= 100) return channelLanguage.get('normal');
            return channelLanguage.get('good');
        }
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor(hex(message.client.ws.ping))
            .addField(channelLanguage.get('average'), `${message.client.ws.ping}ms`, true)
            .setFooter({text: foot(message.client.ws.ping)})
            .setTimestamp();
        const msg = await message.reply({embeds: [embed]});
        const current = msg.createdTimestamp - message.createdTimestamp;
        embed
            .setColor(hex(current))
            .setFooter({text: foot(current)})
            .addField(
                channelLanguage.get('current'),
                `${current}ms`,
                true
            );
        await msg.edit({embeds: [embed]});
    },
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        const hex = (latency) => {
            if(latency <= 100) return '00ff00';
            if(latency >= 1000) return 'ff0000';
            const a = Math.round((510 * (latency - 100)) / 900);
            if(a <= 255) return `${(`0${a.toString(16)}`).slice(-2)}ff00`;
            return `ff${(`0${(255 - (a - 255)).toString(16)}`).slice(-2)}00`;
        };
        const foot = (latency) => {
            if(latency >= 1000) return channelLanguage.get('terrible');
            if(latency >= 300) return channelLanguage.get('bad');
            if(latency >= 100) return channelLanguage.get('normal');
            return channelLanguage.get('good');
        }
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor(hex(interaction.client.ws.ping))
            .addField(channelLanguage.get('average'), `${interaction.client.ws.ping}ms`, true)
            .setFooter({text: foot(interaction.client.ws.ping)})
            .setTimestamp();
        const inter = await interaction.reply({
            embeds: [embed],
            fetchReply: true,
        });
        const current = inter.createdTimestamp - interaction.createdTimestamp;
        embed
            .setColor(hex(current))
            .setFooter({text: foot(current)})
            .addField(
                channelLanguage.get('current'),
                `${current}ms`,
                true
            );
        await interaction.editReply({embeds: [embed]});
    },
};