const {Schema, model} = require('mongoose');

const editionSchema = new Schema({
    messageID: {
        type: String,
        required: true,
    },
    channelID: {
       type: String,
       required: true,
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