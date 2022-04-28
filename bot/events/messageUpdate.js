const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const {MessageEmbed, Util} = require('discord.js');

module.exports = {
    name: 'messageUpdate',
    execute: async (oldMessage, newMessage) => {
        if(oldMessage.partial) return;
        if(newMessage.partial) await newMessage.fetch();
        if(!newMessage.guild || !newMessage.guild.available || newMessage.system || !newMessage.client.guildData.has(newMessage.guild.id) || !newMessage.client.guildData.get(newMessage.guild.id).actionlogs.id('editmsg') || (!newMessage.client.guildData.get(newMessage.guild.id).actionlogs.id('editmsg').hookID && !newMessage.client.guildData.get(newMessage.guild.id).defaultLogsHookID) || newMessage.author.bot || (oldMessage.content === newMessage.content)) return;
        const channelLanguage = newMessage.client.langs[newMessage.client.guildData.get(newMessage.guild.id).language];
        const channelDoc = await channel.findById(newMessage.channel.id);
        if(channelDoc && channelDoc.ignoreActions.includes('editmsg')) return;
        const memb = newMessage.member || await newMessage.guild.members.fetch(newMessage.author.id).catch(() => null);
        if(memb){
            const roleDoc = await role.findOne({
                guild: newMessage.guild.id,
                roleID: {$in: memb.roles.cache.map(e => e.id)},
                ignoreActions: 'editmsg',
            });
            if(roleDoc) return;
        }
        const hook = await newMessage.client.fetchWebhook(newMessage.client.guildData.get(newMessage.guild.id).actionlogs.id('editmsg').hookID || newMessage.client.guildData.get(newMessage.guild.id).defaultLogsHookID, newMessage.client.guildData.get(newMessage.guild.id).actionlogs.id('editmsg').hookToken || newMessage.client.guildData.get(newMessage.guild.id).defaultLogsHookToken).catch(() => null);
        if(!hook) return;
        let [oldContent, newContent] = [Util.escapeCodeBlock(Util.cleanContent(oldMessage.content, newMessage.channel)), Util.escapeCodeBlock(Util.cleanContent(newMessage.content, newMessage.channel))];
        if((oldContent.length > 2000) && (newContent.length > 2000)){
            if(oldContent.slice(0, 2000) === newContent.slice(0, 2000)){
                oldContent = `[...]\`\`\`${oldContent.slice(-2000)}\`\`\``;
                newContent = `[...]\`\`\`${newContent.slice(-2000)}\`\`\``;
            }
            else{
                oldContent = `\`\`\`${oldContent.slice(0, 2000)}\`\`\`[...]\n`;
                newContent = `\`\`\`${newContent.slice(0, 2000)}\`\`\`[...]\n`;
            }
        }
        else{
            if(oldContent.length > 2000){
                oldContent = `\`\`\`${oldContent.slice(0, 2000)}\`\`\`[...]\n`;
            }
            else{
                oldContent = oldContent && `\`\`\`${oldContent}\`\`\``;
            }
            if(newContent.length > 2000){
                newContent = `\`\`\`${newContent.slice(0, 2000)}\`\`\`[...]\n`;
            }
            else{
                newContent = newContent && `\`\`\`${newContent}\`\`\``;
            }
        }
        const embed = new MessageEmbed()
            .setColor(0x0000ff)
            .setFooter({text: newMessage.author.id})
            .setTimestamp()
            .setAuthor({
                name: channelLanguage.get('editmsgEmbedAuthor'),
                iconURL: newMessage.author.displayAvatarURL({
                    size: 4096,
                    dynamic: true,
                }),
                url: newMessage.url,
            })
            .setDescription(channelLanguage.get('editmsgEmbedDescription', [oldContent, newContent]))
            .addField(channelLanguage.get('delmsgEmbedAuthorTitle'), newMessage.author.toString(), true)
            .addField(channelLanguage.get('delmsgEmbedChannelTitle'), newMessage.channel.toString(), true)
            .addField(channelLanguage.get('delmsgEmbedSentTitle'), channelLanguage.get('delmsgEmbedSentValue', [Math.floor(newMessage.createdTimestamp / 1000)]), true);
        await hook.send({
            embeds: [embed],
            username: newMessage.client.user.username,
            avatarURL: newMessage.client.user.avatarURL({size: 4096}),
        });
    },
};