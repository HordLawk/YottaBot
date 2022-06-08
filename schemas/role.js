const {Schema, model} = require('mongoose');
const configs = require('../bot/configs.js');
const commands = require('../bot/commands');

const roleSchema = new Schema({
    guild: {
        type: String,
        required: true,
        ref: 'guild',
        index: true,
    },
    roleID: {
        type: String,
        required: true,
        index: true,
        match: /^\d{17,19}$/,
    },
    ignoreActions: [{
        type: String,
        enum: [...configs.actions.keys()],
    }],
    commandPermissions: [new Schema({
        _id: {
            type: String,
            // enum: [...commands.keys()],
        },
        allow: {
            type: Boolean,
            required: true,
        },
    })],
    xp: {
        type: Number,
        min: 1,
    },
    ignoreXp: Boolean,
    xpMultiplier: {
        type: Number,
        min: 1,
    },
});

module.exports = model('role', roleSchema);