module.exports = {
    active: true,
    name: 'eval',
    dev: true,
    args: true,
    usage: () => '(code)',
    execute: async message => eval(message.content.replace(/^\S+\s+/, '')),
};