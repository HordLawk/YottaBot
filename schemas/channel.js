const {Schema, model} = require('mongoose');
const configs = require('../bot/configs.js');

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
    ignoreCommands: [String],
    ignoreXp: Boolean,
    autoPublish: Boolean,
});

module.exports = model('channel', channelSchema);