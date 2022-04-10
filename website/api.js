const express = require('express');
const router = express.Router();

router.get('/brew-coffee', (req, res) => res.sendStatus(418));

router.get('/*', (req, res) => res.sendStatus(404));

module.exports = router;