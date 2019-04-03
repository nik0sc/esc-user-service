const router = require('express').Router();

const teams = require('../handlers/teams');
const login = require('../middleware/login');

router.post('/',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.createTeam);

router.put('/:teamId(\\d+)/admin/:adminIdent',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.addAdminToTeam);

router.delete('/:teamId(\\d+)/admin/:adminIdent',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.removeAdminFromTeam);

router.get('/me',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.getCurrentAdminTeams);

router.get('/:teamId(\\d+)',
        login.checkSessionToken,
        teams.getTeam);

router.delete('/:teamId(\\d+)',
        login.checkSessionToken,
        login.userIsAdmin,
        teams.deleteTeam);

module.exports = router;