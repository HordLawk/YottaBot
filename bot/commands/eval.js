module.exports = {
    active: true,
    name: 'eval',
    dev: true,
    args: true,
    execute: message => eval(message.content.replace(/^\S+\s+/, '')),
};