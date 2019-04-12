const router = require('express').Router();

const users = require('../handlers/users');
const login = require('../middleware/login');

router.post('/login',
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

router.get('/:userIdent/isAdmin',
        users.checkIsAdmin);

module.exports = router;