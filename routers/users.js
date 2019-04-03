const router = require('express').Router();

const users = require('../handlers/users');
const login = require('../middleware/login');

router.get('/login',
        users.login);

router.post('/',
        users.createUser);

router.put('/:userIdent/promoteToAdmin',
        login.checkSessionToken,
        login.userIsAdmin,
        users.promoteUserToAdmin);

router.get('/me',
        login.checkSessionToken,
        users.getCurrentUser);

router.delete('/me',
        login.checkSessionToken,
        users.deleteCurrentUser);

module.exports = router;