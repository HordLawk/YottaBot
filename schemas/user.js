const {Schema, model} = require('mongoose');

const userSchema = new Schema({
    _id: {
        type: String,
        match: /^\d{17,19}$/,
    },
    blacklisted: Boolean,
    premiumKeys: {
        type: Number,
        default: 0,
        min: 0,
    },
    boostUntil: Date,
});

module.exports = model('user', userSchema);