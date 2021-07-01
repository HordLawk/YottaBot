const {MessageEmbed} = require('discord.js');
const user = require('../../schemas/user.js');
const guild = require('../../schemas/guild.js');

module.exports = {
    active: true,
    name: 'premium',
    description: lang => lang.get('premiumDescription'),
    cooldown: 5,
    categoryID: 1,
    execute: async message => {
        const channelLanguage = (message.channel.type != 'dm') ? message.client.guildData.get(message.guild.id).language : 'en';
        if(message.guild && (message.client.guildData.get(message.guild.id).premiumUntil || message.client.guildData.get(message.guild.id).partner)) return message.channel.send(message.client.langs[channelLanguage].get('alreadyPremium'));
        const userDoc = await user.findById(message.author.id);
        if(!userDoc?.premiumKeys){
            if(message.guild && !message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) return message.channel.send(message.client.langs[channelLanguage].get('botEmbed'));
            const embed = new MessageEmbed()
                .setColor(message.guild?.me.displayColor || 0x8000ff)
                .setDescription(message.client.langs[channelLanguage].get('premiumEmbedDesc', [message.client.configs.support]));
            message.channel.send(embed);
        }
        else{
            if(!message.guild) return message.channel.send(`You have **${userDoc.premiumKeys}** premium keys remaining`);
            if(!message.guild.me.permissionsIn(message.channel).has('ADD_REACTIONS')) return message.channel.send(message.client.langs[channelLanguage].get('botReactions'));
            let msg = await message.channel.send(message.client.langs[channelLanguage].get('activatePremium', [userDoc.premiumKeys]));
            await msg.react('✅');
            await msg.react('❌');
            let collector = msg.createReactionCollector((r, u) => (['✅', '❌'].includes(r.emoji.name) && (u.id === message.author.id)), {
                time: 10000,
                max: 1,
            });
            collector.on('end', async c => {
                await msg.reactions.removeAll();
                if(!c.size) return msg.edit(message.client.langs[channelLanguage].get('timedOut'));
                if(c.first().emoji.name === '❌') return msg.edit(message.client.langs[channelLanguage].get('cancelled'));
                userDoc.premiumKeys--;
                await userDoc.save();
                let premiumUntil = new Date(Date.now() + 2592000000);
                await guild.findByIdAndUpdate(message.guild.id, {$set: {premiumUntil: premiumUntil}});
                message.client.guildData.get(message.guild.id).premiumUntil = premiumUntil;
                await msg.edit(message.client.langs[channelLanguage].get('activatePremiumSuccess'));
            });
        }
    },
};