const {Schema, model} = require('mongoose');

const namebanSchema = new Schema({
    guild: {
        type: String,
        ref: 'guild',
        required: true,
        index: true,
    },
    text: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 32,
        index: true,
    },
    partial: Boolean,
    caseSensitive: Boolean,
}, {timestamps: true});

module.exports = model('nameban', namebanSchema);