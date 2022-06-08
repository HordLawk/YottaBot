const {Schema, model} = require('mongoose');
const configs = require('../bot/configs.js');
const commands = require('../bot/commands');

const channelSchema = new Schema({
    _id: {
        type: String,
        match: /^\d{17,19}$/,
    },
    guild: {
        type: String,
        required: true,
        ref: 'guild',
    },
    ignoreActions: [{
        type: String,
        enum: [...configs.actions.keys()],
    }],
    ignoreCommands: [{
        type: String,
        // enum: [...commands.keys()]
    }],
    ignoreXp: Boolean,
    autoPublish: Boolean,
});

module.exports = model('channel', channelSchema);