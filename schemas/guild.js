const {Schema, model} = require("mongoose");
const {defaultPrefix} = require('../bot/configs.js');
const locale = require('../locale');
const configs = require('../bot/configs.js');

const guildSchema = new Schema({
    _id: {
        type: String,
        match: /^\d{17,19}$/,
    },
    actionlogs: [new Schema({
        _id: {
            type: String,
            enum: [...configs.actions.keys()],
        },
        hookID: {
            type: String,
            match: /^\d{17,19}$/,
        },
        hookToken: String,
    })],
    defaultLogsHookID: {
        type: String,
        match: /^\d{17,19}$/,
    },
    defaultLogsHookToken: String,
    modlogs: {
        type: new Schema({
            warn: {
                type: String,
                match: /^\d{17,19}$/,
            },
            mute: {
                type: String,
                match: /^\d{17,19}$/,
            },
            kick: {
                type: String,
                match: /^\d{17,19}$/,
            },
            ban: {
                type: String,
                match: /^\d{17,19}$/,
            },
        }),
        default: () => ({}),
    },
    prefix: {
        type: String,
        default: defaultPrefix,
        trim: true,
        minLength: 1,
        maxLength: 10,
    },
    globalBan: Boolean,
    pruneBan: {
        type: Number,
        default: 0,
        min: 0,
        max: 7,
    },
    gainExp: Boolean,
    language: {
        type: String,
        required: true,
        enum: [...locale.keys()],
    },
    beta: Boolean,
    counterLogs: {
        type: Number,
        default: 0,
        min: 0,
    },
    counterMenus: {
        type: Number,
        default: 0,
        min: 0,
    },
    dontStack: Boolean,
    xpChannel: {
        type: String,
        default: 'default',
        match: /^(?:\d{17,19}|default|dm)$/,
    },
    alpha: Boolean,
    premiumUntil: Date,
    partner: Boolean,
    logAttachments: Boolean,
    voiceXpCooldown: {
        type: Number,
        min: 1,
        max: 59,
    },
    antiMassBan: {
        type: Number,
        min: 1,
    },
    patron: {
        type: String,
        match: /^\d{17,19}$/,
    },
    renewPremium: Boolean,
    storeEditions: Boolean,
    welcomeHook: new Schema({
        _id: {
            type: String,
            match: /^\d{17,19}$/,
        },
        token: {
            type: String,
            required: true,
        },
    }),
    trackInvites: Boolean,
});

module.exports = model("guild", guildSchema);