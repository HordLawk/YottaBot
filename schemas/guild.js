const {Schema, model} = require("mongoose");
const {defaultPrefix} = require('../bot/configs.js');

const guildSchema = new Schema({
    _id: String,
    actionlogs: [new Schema({
        _id: String,
        hookID: String,
        hookToken: String,
    })],
    defaultLogsHookID: String,
    defaultLogsHookToken: String,
    modlogs: {
        type: new Schema({
            warn: String,
            mute: String,
            kick: String,
            ban: String,
        }),
        default: () => ({}),
    },
    // muteRoleID: String,
    prefix: {
        type: String,
        default: defaultPrefix,
    },
    // autoSetupMute: {
    //     type: Boolean,
    //     default: true,
    // },
    globalBan: Boolean,
    pruneBan: {
        type: Number,
        default: 0,
    },
    gainExp: Boolean,
    language: {
        type: String,
        required: true,
    },
    beta: Boolean,
    counterLogs: {
        type: Number,
        default: 0,
    },
    counterMenus: {
        type: Number,
        default: 0,
    },
    dontStack: Boolean,
    xpChannel: {
        type: String,
        default: 'default',
    },
    alpha: Boolean,
    premiumUntil: Date,
    partner: Boolean,
    logAttachments: Boolean,
    voiceXpCooldown: Number,
    antiMassBan: Number,
    patron: String,
    renewPremium: Boolean,
});

module.exports = model("guild", guildSchema);