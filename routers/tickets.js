const router = require('express').Router();

const tickets = require('../handlers/tickets');
const login = require('../middleware/login');

router.get('/:ticketId(\\d+)',
        tickets.getById);

router.get('/byUser', 
        login.checkSessionToken, 
        tickets.getAllByUser);

router.post('/', 
        login.checkSessionToken, 
        tickets.createNew);

router.put('/:ticketId(\\d+)', 
        login.checkSessionToken,
        tickets.update);

module.exports = router;