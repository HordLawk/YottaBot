const {Collection} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = fs.readdirSync(path.join(__dirname)).filter(file => (file !== 'index.js')).map(e => require(`./${e}`)).reduce((acc, e) => acc.set(e.lang, e), new Collection());