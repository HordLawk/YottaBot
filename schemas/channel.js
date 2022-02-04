const {Schema, model} = require('mongoose');

const channelSchema = new Schema({
    _id: String,
    guild: {
        type: String,
        required: true,
        ref: 'guild',
    },
    ignoreActions: [String],
    ignoreCommands: [String],
    ignoreXp: Boolean,
    autoPublish: Boolean,
});

module.exports = model('channel', channelSchema);