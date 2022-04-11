const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const apiRouter = require('./api.js');
const {permissions} = require('../bot/configs');
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/api', apiRouter);

app.get('/docs', (req, res) => res.redirect('https://github.com/HordLawk/YottaBot#get-started'));

app.get('/topgg', (req, res) => res.redirect('https://top.gg/bot/371902120561082368'));

app.get('/privacy', (req, res) => res.redirect('https://github.com/HordLawk/YottaBot/wiki/Privacy-Policy'));

app.get('*', (req, res) => res.redirect(`https://discord.com/api/oauth2/authorize?client_id=371902120561082368&permissions=${permissions}&scope=bot+applications.commands`));

app.listen(process.env.PORT || port, () => console.log(`Server listening at port ${process.env.PORT || port}`));