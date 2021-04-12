module.exports = {
    name: 'ready',
    execute: client => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity("you mention me", {type:'WATCHING'});
    },
};