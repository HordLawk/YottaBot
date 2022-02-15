const express = require('express');
const router = express.Router();

router.post('/pledges', async (req, res) => {
    switch(req.header('X-Patreon-Event')){
        case 'members:pledge:create': {
            console.log('created pledge');
        }
        break;
        case 'members:pledge:delete': {
            console.log('deleted pledge')
        }
        break;
    }
    console.log(req.body);
    res.sendStatus(200);
});

module.exports = router;