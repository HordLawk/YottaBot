const {Schema, model} = require('mongoose');

const userSchema = new Schema({
    _id: String,
    blacklisted: Boolean,
});

const user = model('user', userSchema);

module.exports = user;