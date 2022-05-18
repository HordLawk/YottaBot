const {Schema, model} = require('mongoose');

const logSchema = new Schema({
    id: {
        type: Number,
        required: true,
        index: true,
        min: 0,
    },
    guild: {
        type: String,
        required: true,
        ref: 'guild',
        index: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['warn', 'mute', 'kick', 'ban'],
    },
    target: {
        type: String,
        required: true,
        match: /^\d{17,19}$/,
    },
    executor: {
        type: String,
        match: /^\d{17,19}$/,
    },
    duration: Date,
    timeStamp: {
        type: Date,
        required: true,
    },
    actionMessage: String,
    reason: {
        type: String,
        trim: true,
        maxLength: 500,
    },
    logMessage: {
        type: String,
        match: /^\d{17,19}$/,
    },
    ongoing: Boolean,
    image: String,
    removal: Boolean,
});

module.exports = model('log', logSchema);