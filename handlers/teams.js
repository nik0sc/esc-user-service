const validation = require('../validation');

/**
 * Create a new, empty team
 * 
 * In: JSON
 * {
 *  "team_name": <String>
 * }
 * 
 * Out:
 *  Success: JSON
 * {
 *  "id": <Integer>
 * }
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - Team name provided is not empty and not in use already
 * - Team name cannot be all digits (because that would look like an id)
 * 
 * Postconditions:
 * - Created team is completely empty. No admins, no tickets
 */
exports.createTeam = async function (req, res) {
    console.log('Create new team');
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;
    const ticket_axios = req.app.locals.ticket_axios;
    
    const t_team_name = req.body.team_name;
    const team_validation = validation.validateTeamIdent(t_team_name);
    if (team_validation === false) {
        res.status(400).json({
            error: 'No team name provided'
        });
        return;
    } else if (team_validation === 'id') {
        res.status(400).json({
            error: 'Team name cannot be all digits'
        });
        return;
    }

    // TODO Find any tickets using this team name already

    let query = knex('teams').insert({
        team_name: t_team_name
    });
    console.log(query.toString());

    let id;
    try {
        id = await query;
    } catch (err) {
        console.error(err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                error: 'This team already exists in the database'
            });
        } else {
            res.status(500).json({
                error: 'Db insert failed'
            });
        }
        return;
    }

    res.json({
        id: id
    });
};

/**
 * Add an admin to a team
 * 
 * In: JSON
 * {
 *  "team_ident": <String>,
 *  "user_ident": <String>
 * }
 * 
 * Out:
 *  Success: status == 200
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - Team ident is valid
 * - Team exists
 * - User ident is valid
 * - User exists
 * - Calling user is an admin (yes, he can add himself)
 * - Target user is an admin
 * 
 * Postconditions:
 * - Admin is added to team
 * - Idempotent
 */
exports.addAdminToTeam = async function (req, res) {
    const knex = req.app.locals.knex;

    const t_team_ident = req.body.team_ident;
    const team_ident_validation = validation.validateTeamIdent(t_team_ident);

    if (team_ident_validation === false) {
        res.status(400).json({
            error: 'Team identifier not provided or invalid'
        });
        return;
    }

    const t_user_ident = req.body.user_ident;
    const user_ident_validation = validation.validateUserIdent(t_user_ident);

    if (user_ident_validation === false) {
        res.status(400).json({
            error: 'User identifier not provided or invalid'
        });
        return;
    }

    let query = knex('admin_team_relation')
    .insert({
        team_id: knex('teams').first('id')
            .where(team_ident_validation, t_team_ident),
        admin_id: knex('admin').first('id')
            .where(user_ident_validation, t_user_ident)
            .andWhere('user_type', 2)
    });
    console.log(query.toString());

    let id;
    try {
        id = await query;
        res.end();
    } catch (err) {
        switch (err.code) {
            case 'ER_NO_REFERENCED_ROW':
            case 'ER_BAD_NULL_ERROR':
                // TODO make more specific
                res.status(400).json({
                    error: 'No such team or user or specified user is not admin'
                });
                break;
        
            case 'ER_DUP_ENTRY':
                // This is fine
                res.json({
                    warning: 'This user is already in this team'
                });
                break;

            default:
                console.error(err);
                res.status(500).json({
                    error: 'Db error'
                });
                break;
        }
    }
};

/**
 * Remove an admin from a team
 * 
 * In: JSON
 * {
 *  "team_ident": <String>,
 *  "user_ident": <String>
 * }
 * 
 * Out:
 *  Success: status == 200
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - Team ident is valid
 * - Team exists
 * - User ident is valid
 * - User exists
 * - Calling user is an admin (yes, he can remove himself)
 * - Target user is an admin
 * 
 * Postconditions:
 * - Admin is added to team
 * - Idempotent
 */
exports.removeAdminFromTeam = async function (req, res) {
    const knex = req.app.locals.knex;

    const t_team_ident = req.body.team_ident;
    const team_ident_validation = validation.validateTeamIdent(t_team_ident);

    if (team_ident_validation === false) {
        res.status(400).json({
            error: 'Team identifier not provided or invalid'
        });
        return;
    }

    const t_user_ident = req.body.user_ident;
    const user_ident_validation = validation.validateUserIdent(t_user_ident);

    if (user_ident_validation === false) {
        res.status(400).json({
            error: 'User identifier not provided or invalid'
        });
        return;
    }

    let query = knex('admin_team_relation')
    .delete()
    .where({
        team_id: knex('teams').first('id')
            .where(team_ident_validation, t_team_ident),
        admin_id: knex('admin').first('id')
            .where(user_ident_validation, t_user_ident)
    })
    .limit(1);
    console.log(query.toString());

    let affected_rows;
    try {
        affected_rows = await query;
        if (affected_rows === 1) {
            res.end();
        } else if (affected_rows === 0) {
            res.json({
                warning: 'This user was not in this team or there is no ' + 'such user or team'
            });
        } else {
            res.status(500).json({
                error: 'Unexpected number of affected rows',
                affected_rows: affected_rows
            });
        }
    } catch (err) {
        // Is this even needed?
        switch (err.code) {
            case 'ER_NO_REFERENCED_ROW':
            case 'ER_BAD_NULL_ERROR':
                // TODO make more specific
                res.status(400).json({
                    error: 'No such team or user or specified user is not admin'
                });
                break;
        
            case 'ER_DUP_ENTRY':
                // This is fine
                res.json({
                    warning: 'This user is already in this team'
                });
                break;

            default:
                console.error(err);
                res.status(500).json({
                    error: 'Db error'
                });
                break;
        }
    }

};

/**
 * Delete a team
 * 
 * In: JSON
 * {
 *  "team_ident": <String>
 * }
 * 
 * Out:
 *  Success: status == 200
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - Team ident is valid
 * - Team exists
 * - Team has no tickets
 * - Calling user is an admin
 * 
 * Postconditions:
 * - Team is removed from db entirely
 * - Team members are no longer associated with this team
 * - Idempotent
 */
exports.deleteTeam = async function (req, res) {

};

exports.getCurrentAdminTeams = async function (req, res) {

};

exports.getTeam = async function (req, res) {

};