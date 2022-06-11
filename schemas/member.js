const {Schema, model} = require('mongoose');
const commands = require('../bot/commands');

const memberSchema = new Schema({
    guild: {
        type: String,
        required: true,
        ref: 'guild',
        index: true,
    },
    userID: {
        type: String,
        required: true,
        index: true,
        match: /^\d{17,19}$/,
    },
    relevantBan: Boolean,
    xp: {
        type: Number,
        default: 0,
        min: 0,
    },
    autoBanned: Boolean,
    commandUses: [new Schema({
        _id: {
            type: String,
            enum: [...commands.keys()],
        },
        count: {
            type: Number,
            default: 0,
            min: 0,
        },
    })],
});

module.exports = model('member', memberSchema);