const {Schema, model} = require('mongoose');

const menuSchema = new Schema({
    id: {
        type: Number,
        required: true,
    },
    guild: {
        type: String,
        required: true,
        ref: 'guild',
    },
    channelID: {
        type: String,
        required: true,
    },
    messageID: String,
    toggle: Boolean,
    emojis: [new Schema({
        _id: String,
        roleID: {
            type: String,
            required: true,
        },
    })],
});

module.exports = model('menu', menuSchema);