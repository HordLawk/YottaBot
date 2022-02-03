const {Schema, model} = require('mongoose');

const memberSchema = new Schema({
    guild: {
        type: String,
        required: true,
        ref: 'guild',
    },
    userID: {
        type: String,
        required: true,
    },
    relevantBan: Boolean,
    xp: {
        type: Number,
        default: 0,
    },
});

module.exports = model('member', memberSchema);