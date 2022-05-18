const {Schema, model} = require('mongoose');

const editionSchema = new Schema({
    messageID: {
        type: String,
        required: true,
        index: true,
        match: /^\d{17,19}$/,
    },
    channelID: {
       type: String,
       required: true,
       match: /^\d{17,19}$/,
    },
    guild: {
        type: String,
        required: true,
        ref: 'guild',
    },
    content: {
        type: Buffer,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
});

module.exports = model('edition', editionSchema);