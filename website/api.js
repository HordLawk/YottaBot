const express = require('express');
const router = express.Router();

router.post('/pledges', async (req, res) => {
    console.log(JSON.stringify(req, null, 4));
});

module.exports = router;