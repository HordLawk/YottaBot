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
    messageID: {
        type: String,
        required: true,
    },
    exclusive: Boolean,
    roles: [new Schema({
        _id: String,
        emojiID: {
            type: String,
            required: true,
        },
    })],
});

module.exports = model('menu', menuSchema);