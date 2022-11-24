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

const channel = require('../../schemas/channel.js');
const role = require('../../schemas/role.js');
const edition = require('../../schemas/edition.js');
const {EmbedBuilder, escapeCodeBlock, cleanContent} = require('discord.js');
const {sha256} = require('js-sha256');
const aesjs = require('aes-js');
const locale = require('../../locale');
const Diff = require('diff');

module.exports = {
    name: 'messageUpdate',
    execute: async (oldMessage, newMessage) => {
        if(oldMessage.partial || !oldMessage.guild || !oldMessage.guild.available || oldMessage.system || !oldMessage.client.guildData.has(oldMessage.guild.id) || oldMessage.author.bot) return;
        if(oldMessage.client.guildData.get(oldMessage.guild.id).storeEditions && oldMessage.content){
            const aesCtr = new aesjs.ModeOfOperation.ctr(sha256.array(process.env.CRYPT_PASSWD));
            const editionDoc = new edition({
                messageID: oldMessage.id,
                channelID: oldMessage.channel.id,
                guild: oldMessage.guild.id,
                content: Buffer.from(aesCtr.encrypt(aesjs.utils.utf8.toBytes(oldMessage.content))),
                timestamp: oldMessage.editedAt ?? oldMessage.createdAt,
            });
            await editionDoc.save();
            if(!oldMessage.client.guildData.get(oldMessage.guild.id).premiumUntil && !oldMessage.client.guildData.get(oldMessage.guild.id).partner){
                const editAmount = await edition.countDocuments({guild: oldMessage.guild.id});
                if(editAmount > 100) await edition.findOneAndDelete({guild: oldMessage.guild.id}, {sort: {timestamp: 1}});
            }
        }
        if(newMessage.partial) await newMessage.fetch();
        if(!newMessage.client.guildData.get(newMessage.guild.id).actionlogs.id('editmsg') || (!newMessage.client.guildData.get(newMessage.guild.id).actionlogs.id('editmsg').hookID && !newMessage.client.guildData.get(newMessage.guild.id).defaultLogsHookID) || (oldMessage.content === newMessage.content)) return;
        const channelLanguage = locale.get(newMessage.client.guildData.get(newMessage.guild.id).language);
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
        const diff = Diff.diffChars(cleanContent(oldMessage.content, newMessage.channel).replaceAll('```', '``ˋ'), cleanContent(newMessage.content, newMessage.channel).replaceAll('```', '``ˋ'));
        let oldContentDiff = diff.map(part => {
            if(part.added) return '';
            if(part.removed) return `\u001b[41m${part.value}`;
            return `\u001b[0m${part.value}`;
        }).join('');
        let newContentDiff = diff.map(part => {
            if(part.added) return `\u001b[45m${part.value}`;
            if(part.removed) return '';
            return `\u001b[0m${part.value}`;
        }).join('');
        if((oldContentDiff.length > 2000) && (newContentDiff.length > 2000)){
            if(oldContentDiff.slice(0, 2000) === newContentDiff.slice(0, 2000)){
                oldContentDiff = `[...]\`\`\`ansi\n${oldContentDiff.slice(-2000)}\`\`\``;
                newContentDiff = `[...]\`\`\`ansi\n${newContentDiff.slice(-2000)}\`\`\``;
            }
            else{
                oldContentDiff = `\`\`\`ansi\n${oldContentDiff.slice(0, 2000)}\`\`\`[...]\n`;
                newContentDiff = `\`\`\`ansi\n${newContentDiff.slice(0, 2000)}\`\`\`[...]\n`;
            }
        }
        else{
            if(oldContentDiff.length > 2000){
                oldContentDiff = `\`\`\`ansi\n${oldContentDiff.slice(0, 2000)}\`\`\`[...]\n`;
            }
            else{
                oldContentDiff = oldContentDiff && `\`\`\`ansi\n${oldContentDiff}\`\`\``;
            }
            if(newContentDiff.length > 2000){
                newContentDiff = `\`\`\`ansi\n${newContentDiff.slice(0, 2000)}\`\`\`[...]\n`;
            }
            else{
                newContentDiff = newContentDiff && `\`\`\`ansi\n${newContentDiff}\`\`\``;
            }
        }
        const embed = new EmbedBuilder()
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
            .setDescription(channelLanguage.get('editmsgEmbedDescription', [oldContentDiff, newContentDiff]))
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