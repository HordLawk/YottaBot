const fs = require('fs');
const path = require('path');
const {Collection} = require('discord.js');

module.exports = fs.readdirSync(path.join(__dirname)).filter(file => (file !== 'index.js')).map(e => require(`./${e}`)).reduce((acc, e) => e.active ? acc.set(e.name, e) : acc, new Collection());