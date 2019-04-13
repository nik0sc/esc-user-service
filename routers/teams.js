const router = require('express').Router();

const teams = require('../handlers/teams');
const login = require('../middleware/login');

router.post('/',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.createTeam);

router.put('/:teamIdent/admin/:adminIdent',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.addAdminToTeam);

router.delete('/:teamIdent/admin/:adminIdent',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.removeAdminFromTeam);

router.get('/me',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.getCurrentAdminTeams);

router.get('/:teamIdent',
        login.checkSessionToken,
        teams.getTeam);

router.delete('/:teamIdent',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.deleteTeam);

module.exports = router;