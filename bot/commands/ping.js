module.exports = {
	active: true,
	name: 'ping',
    description: (lang) => lang.get('pingDescription'),
    cooldown: 5,
	categoryID: 0,
	execute: async (message) => {
		const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if((message.channel.type != 'dm') && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
		const hex = (latency) => {
			if(latency <= 100) return '00ff00';
			if(latency >= 1000) return 'ff0000';
			const a = Math.round((510 * latency) / 900);
			if(a <= 255) return `${(`0${a.toString(16)}`).substr(-2)}ff00`;
			return `ff${(`0${(255 - (a - 255)).toString(16)}`).substr(-2)}00`;
		};
		const foot = (latency) => {
			if(latency >= 1000) return message.client.langs[channelLanguage].get('terrible');
			if(latency >= 300) return message.client.langs[channelLanguage].get('bad');
			if(latency >= 100) return message.client.langs[channelLanguage].get('normal');
			return message.client.langs[channelLanguage].get('good');
		}
		const {MessageEmbed} = require('discord.js');
		const embed = new MessageEmbed()
			.setAuthor('Pong!', 'https://cdn.discordapp.com/emojis/468893394052186132.png')
			.setColor(hex(message.client.ws.ping))
			.addField(message.client.langs[channelLanguage].get('average'), `${message.client.ws.ping}ms`, true)
			.setFooter(foot(message.client.ws.ping))
			.setTimestamp();
		const msg = await message.channel.send(embed);
		const current = msg.createdTimestamp - message.createdTimestamp;
		embed.setColor(hex(current)).setFooter(foot(current)).addField(message.client.langs[channelLanguage].get('current'), `${current}ms`, true);
		msg.edit(embed);
	},
};