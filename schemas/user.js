const {Schema, model} = require('mongoose');

const userSchema = new Schema({
    _id: String,
    blacklisted: Boolean,
    premiumKeys: {
        type: Number,
        default: 0,
    },
    boostUntil: Date,
});

module.exports = model('user', userSchema);