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
    blacklisted: Boolean,
    xp: Number,
    ghostRole: Boolean,
});

module.exports = model('member', memberSchema);