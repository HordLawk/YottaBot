const {Schema, model} = require('mongoose');

const logSchema = new Schema({
    id: {
        type: Number,
        required: true,
    },
    guild: {
        type: String,
        required: true,
        ref: 'guild',
    },
    type: {
        type: String,
        required: true,
    },
    target: {
        type: String,
        required: true,
    },
    executor: String,
    duration: Date,
    timeStamp: {
        type: Date,
        required: true,
    },
    actionMessage: {
        type: String,
        required: true,
    },
    reason: String,
    logMessage: String,
    ongoing: Boolean,
    image: String,
});

module.exports = model('log', logSchema);