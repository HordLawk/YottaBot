const {Collection} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = new Collection(fs.readdirSync(path.join(__dirname)).filter(file => (file !== 'index.js')).map(e => require(`./${e}`)).map(e => [e.lang, e]));