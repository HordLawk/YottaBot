module.exports = {
    active: true,
    name: 'eval',
    dev: true,
    args: true,
    usage: () => '(code)',
    execute: message => eval(message.content.replace(/^\S+\s+/, '')),
};