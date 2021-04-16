const {Schema, model} = require('mongoose');

const roleSchema = new Schema({
    guild: {
        type: String,
        required: true,
        ref: 'guild',
    },
    roleID: {
        type: String,
        required: true,
    },
    autoroleDelay: Number,
    ignoreActions: [String],
    commandPermissions: [new Schema({
        _id: String,
        allow: {
            type: Boolean,
            required: true,
        },
    })],
    xp: Number,
    ignoreXp: Boolean,
});

module.exports = model('role', roleSchema);