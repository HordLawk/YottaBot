const {MessageEmbed} = require('discord.js');

module.exports = {
	active: true,
	name: 'help',
	description: lang => lang.get('helpDescription'),
	aliases: ['cmds', 'commands'],
	usage: lang => [lang.get('helpUsage')],
	example: ['ping'],
	cooldown: 5,
	categoryID: 0,
	execute: (message, args) => {
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if((message.channel.type != 'dm') && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
		const prefix = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).prefix : message.client.configs.defaultPrefix;
		let embed;
		if(!args.length){
			embed = new MessageEmbed()
				.setColor((message.channel.type != 'dm') ? (message.guild.me.displayColor || 'RANDOM') : 'RANDOM')
				.setAuthor(message.client.langs[channelLanguage].get('helpEmbedTitle'), message.client.user.avatarURL({format: 'png', size: 4096}))
				.setDescription(message.client.langs[channelLanguage].get('helpEmbedDescription', [prefix]))
				.addField(message.client.langs[channelLanguage].get('category0'), message.client.commands.filter(command => (!command.dev && (command.categoryID == 0))).map(command => `\`${command.name}\``).join(' '))
				.setFooter(message.client.langs[channelLanguage].get('helpEmbedFooter', [message.client.commands.filter(command => !command.dev).size]))
				.setTimestamp();
			return message.channel.send(embed);
		}
		const name = args[0];
		const command = message.client.commands.get(name) || message.client.commands.find(c => (c.aliases && c.aliases.includes(name)));
		if(!command || command.dev) return message.channel.send(message.client.langs[channelLanguage].get('invalidCommand'));
		embed = new MessageEmbed()
			.setColor((message.channel.type != 'dm') ? (message.guild.me.displayColor || 'RANDOM') : 'RANDOM')
			.setAuthor(message.client.langs[channelLanguage].get('helpCommandEmbedTitle', [command.name]), message.client.user.avatarURL({format: 'png', size: 4096}))
			.setDescription(command.description(message.client.langs[channelLanguage]))
			.setFooter(message.client.langs[channelLanguage].get('helpCommandEmbedFooter'))
			.setTimestamp();
		if(command.usage) embed.addField(message.client.langs[channelLanguage].get('syntax'), `${command.usage(message.client.langs[channelLanguage]).map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`);
		if(command.example) embed.addField(message.client.langs[channelLanguage].get('example'), `${command.example.map(e => `\`${prefix}${command.name} ${e}\``).join('\n')}`);
		if(command.aliases) embed.addField(message.client.langs[channelLanguage].get('aliases'), command.aliases.map(a => `\`${a}\``).join(' '));
		if(command.perm) embed.addField(message.client.langs[channelLanguage].get('permissionLevel'), message.client.langs[channelLanguage].get(command.perm), true);
		embed.addField('Cooldown', message.client.langs[channelLanguage].get('helpCommandCooldown', [command.cooldown]), true);
		message.channel.send(embed);
	}
}