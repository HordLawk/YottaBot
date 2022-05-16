const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'unban',
    description: lang => lang.get('unbanDescription'),
    usage: lang => [lang.get('unbanUsage')],
    example: ['@LordHawk apologised'],
    cooldown: 5,
    categoryID: 3,
    args: true,
    guildOnly: true,
    perm: Permissions.FLAGS.BAN_MEMBERS,
    execute: async (message, args) => {
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        if(!message.member) message.member = await message.guild.members.fetch(message.author).catch(() => null);
        if(!message.member) return;
        const id = args[0].match(/^(?:<@)?!?(\d{17,19})>?$/)?.[1];
        if(!id) return message.reply(channelLanguage.get('invUser'));
        const ban = await message.guild.bans.fetch(id).catch(() => null);
        if(!ban) return message.reply(channelLanguage.get('invBanned'));
        const reason = message.content.replace(/^\S+\s+\S+\s*/, '').slice(0, 500);
        if(!message.guild.me.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) return message.reply(channelLanguage.get('cantUnban'));
        const guildDoc = await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterLogs: 1}});
        message.client.guildData.get(message.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: message.guild.id,
            type: 'ban',
            target: ban.user.id,
            executor: message.author.id,
            timeStamp: Date.now(),
            actionMessage: message.url,
            reason: reason || null,
            image: message.attachments.first()?.height && message.attachments.first().url,
            removal: true,
        });
        await current.save();
        await message.guild.members.unban(ban.user.id, channelLanguage.get('unbanAuditReason', [message.author.tag, reason]));
        const reply = await message.reply(channelLanguage.get('unbanSuccess', [current.id]));
        const discordChannel = message.guild.channels.cache.get(message.client.guildData.get(message.guild.id).modlogs.ban);
        let msg;
        let embed;
        if(discordChannel && discordChannel.viewable && discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) && discordChannel.permissionsFor(message.guild.me).has(Permissions.FLAGS.EMBED_LINKS)){
            embed = new MessageEmbed()
                .setColor(0x00ff00)
                .setAuthor({
                    name: channelLanguage.get('unbanEmbedAuthor', [message.author.tag, ban.user.tag]),
                    iconURL: ban.user.displayAvatarURL({dynamic: true}),
                })
                .setDescription(channelLanguage.get('unbanEmbedDescription', [message.url]))
                .addField(channelLanguage.get('unbanEmbedTargetTitle'), channelLanguage.get('unbanEmbedTargetValue', [ban.user]), true)
                .addField(channelLanguage.get('unbanEmbedExecutorTitle'), message.author.toString(), true)
                .setTimestamp()
                .setFooter({
                    text: channelLanguage.get('unbanEmbedFooter', [current.id]),
                    iconURL: message.guild.iconURL({dynamic: true}),
                });
            if(reason) embed.addField(channelLanguage.get('unbanEmbedReasonTitle'), reason);
            if(current.image) embed.setImage(current.image);
            msg = await discordChannel.send({embeds: [embed]});
            current.logMessage = msg.id;
            await current.save();
        }
        const buttonEdit = {
            type: 'BUTTON',
            label: channelLanguage.get('editReason'),
            customId: 'edit',
            style: 'PRIMARY',
            emoji: '✏️',
        };
        const components = [{
            type: 'ACTION_ROW',
            components: [buttonEdit],
        }];
        await reply.edit({components});
        const collectorEdit = reply.createMessageComponentCollector({
            filter: componentInteraction => ((componentInteraction.user.id === message.author.id) && (componentInteraction.customId === 'edit')),
            time: 60_000,
            componentType: 'BUTTON',
        });
        collectorEdit.on('collect', i => (async () => {
            i.awaitModalSubmit({
                filter: int => (int.user.id === message.author.id) && (int.customId === 'modalEdit'),
                time: 600_000,
            }).then(async int => {
                current.reason = int.fields.getTextInputValue('reason');
                await current.save();
                await int.reply({
                    content: channelLanguage.get('modalEditSuccess'),
                    ephemeral: true,
                });
                if(!msg?.editable) return;
                const reasonIndex = embed.fields.findIndex(e => (e.name === channelLanguage.get('unbanEmbedReasonTitle')));
                const reasonField = {
                    name: channelLanguage.get('unbanEmbedReasonTitle'),
                    value: current.reason
                };
                if(reasonIndex === -1){
                    embed.addFields(reasonField);
                }
                else{
                    embed.spliceFields(reasonIndex, 1, reasonField);
                }
                await msg.edit({embeds: [embed]});
            }).catch(async () => await i.followUp({
                content: channelLanguage.get('modalTimeOut'),
                ephemeral: true,
            }));
            await i.showModal({
                customId: 'modalEdit',
                title: channelLanguage.get('editReasonModalTitle'),
                components: [{
                    type: 'ACTION_ROW',
                    components: [{
                        type: 'TEXT_INPUT',
                        customId: 'reason',
                        label: channelLanguage.get('editReasonModalReasonLabel'),
                        required: true,
                        style: 'PARAGRAPH',
                        value: current.reason,
                    }],
                }],
            });
        })().catch(err => message.client.handlers.button(err, i)));
        collectorEdit.on('end', async () => {
            buttonEdit.disabled = true;
            await reply.edit({components});
        });
    },
};