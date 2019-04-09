/**
 * Login user with username and password, getting a session_token back
 * 
 * In: JSON
 * {
 *  "username": <String>,
 *  "password": <String>
 * }
 * 
 * Out:
 *  Success: JSON 
 * {
 *  "id": <Number>,
 *  "username": <String>,
 *  "long_name": <String>,
 *  "acn_id": <String>,
 *  "user_type": <Number>,
 *  "email": <String>,
 *  "phone": <String>,
 *  "session_token": <String>,
 *  "acn_extra": <Object>
 * }
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - Username and password are provided and not empty
 * 
 * Postconditions:
 * - Existing tokens for this user are still valid
 * - Idempotent
 */
exports.login = async function (req, res) {
    console.log('Logging in');
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;

    let t_username = req.body.username;
    let t_password = req.body.password;

    if (typeof t_username === 'undefined'
            || t_username === '' 
            || typeof t_password === 'undefined'
            || t_password === '') {
        res.status(400).json({
            error: 'No username or password'
        });
        return;
    }

    let res2;
    try {
        res2 = await acn_axios.get('/login', {
            params: {
                username: t_username,
                password: t_password
            }
        });
    } catch (err) {
        if (err.response) {
            if (err.response.status === 404 && err.response.data.code === 101) {
                res.status(401).json({
                    error: 'Invalid username or password'
                });
            } else if (err.response.status === 504) {
                console.log('acn timeout');
                res.status(504).json({
                    error: 'Upstream timeout in acn login'
                });
            } else {
                console.log('error in login');
                let status_string = err.response.status + ' ' + 
                        err.response.statusText;
                console.log(status_string);
                res.status(500).json({
                    error: 'Upstream error from acn login',
                    response: status_string
                });
            }
        } else if (err.code === 'ECONNABORTED') {
            console.log('acn timeout');
            res.status(504).json({
                error: 'Upstream timeout in acn login'
            });
        } else {
            console.log('error in login - no response');
            console.log(err);
            res.status(500).json({
                error: 'Check server log',
                error_code: err.code 
            });
        }
        return;
    }

    let query = knex('users')
    .first('users.id', 'users.username', 'users.long_name', 'users.acn_id',
    'users.user_type', 'users.email', 'users.phone')
    .where('users.acn_id', res2.data.objectId);

    console.log(query.toString());

    let row;
    try {
        row = await query;
    } catch (err) {
        res.status(500).json({
            error: 'Db error'
        });
        return;
    }

    row.session_token = res2.data.sessionToken;
    delete res2.data.sessionToken;
    row.acn_extra = res2.data;
    
    res.json(row);
};

/**
 * Create a new user
 * 
 * In: JSON
 * {
 *  "username": <String>,
 *  "password": <String>,
 *  "long_name": <String>,
 *  "email": <String> [Optional],
 *  "phone": <String> [Optional]
 * }
 * 
 * Out:
 *  Success: JSON
 * {
 *  "user_id": <Integer>,
 *  "username": <String>,
 *  "acn_id": <String>,
 *  "session_token": <String>
 * }
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - Username and password are provided and not empty
 * - User with this username does not already exist in either mysql or acn
 * - Username contains only alnum and underscore characters
 * - Username does not contain only digits
 * - Email must match email pattern
 * - Phone must match phone pattern
 * 
 * Postconditions:
 * - User row in mysql is linked to user object in acn by acn_id
 * - Either user is added to both databases or not at all
 * - User is created with normal privileges
 * - User id, username, and acn_id are unique (independently, not jointly)
 */
exports.createUser = async function (req, res) {
    console.log('Create new user');
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;

    let t_username = req.body.username;
    if (typeof t_username === 'undefined') {
        res.status(400).json({
            error: 'No username provided'
        });
        return;
    }

    // Validate username: Must comprise alnum or _, but not entirely digits 
    if (t_username.match(/^\d+$/)) {
        res.status(400).json({
            error: 'Username cannot be made up of all digits'
        });
        return;
    }

    if (t_username.match(/^[^a-zA-Z0-9_]$/)) {
        res.status(400).json({
            error: 'Username contains non-alnum or non-underscore characters'
        });
        return;
    }

    let t_password = req.body.password;
    if (typeof t_password === 'undefined' || t_password === '') {
        res.status(400).json({
            error: 'No password provided'
        });
        return;
    }

    let t_long_name = (typeof req.body.long_name !== 'undefined') 
            ? req.body.long_name : '';
    
    let t_email = (typeof req.body.email !== 'undefined')
            ? req.body.email : '';
    // Don't try to verify the email. Frontend should have made sure through the
    // verification service

    let t_phone = (typeof req.body.phone !== 'undefined')
            ? req.body.phone : '';
    // This is not a very good pattern, but it'll work for most
    if (!t_phone.match(/^\+?[0-9- ]+$/)) {
        res.status(400).json({
            error: 'Malformed phone number'
        });
        return;
    }

    // Get in, get out
    let test_query = knex('users')
    .count('username as user_count')
    .where('username', t_username);

    console.log(test_query.toString());

    let existing_rows;
    try {
        existing_rows = (await test_query)[0].user_count;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Db error'
        });
        return;
    }

    if (existing_rows !== 0) {
        res.status(400).json({
            error: 'User with this username already exists'
        });
        return;
    }

    let res2;
    // Attempt to insert into acn api first
    try {
        res2 = await acn_axios.post('/users', {
            username: t_username,
            password: t_password
        });
    } catch (err) {
        if (err.response.status === 504) {
            console.log('acn timeout');
            res.status(504).json({
                error: 'Upstream timeout in acn user management'
            });
        } else if (err.response.status === 400 &&
                err.response.data.code === 202) {
            console.error(`Username ${t_username} exists in acn but` + 
                    ` not in mysql`);
            res.status(400).json({
                error: 'User with this username already exists'
            });
        } else {
            console.log('error in user creation');
            console.log(err.response.data);
            let status_string = err.response.status + ' ' + 
                    err.response.statusText;
            console.log(status_string);
            res.status(500).json({
                error: 'Upstream error from acn user management',
                response: status_string
            });
        }
        return;
    }

    let t_acn_id = res2.data.objectId;
    let t_session_token = res2.data.sessionToken;

    // Now insert into db
    let query = knex('users').insert({
        username: t_username,
        long_name: t_long_name,
        acn_id: t_acn_id,
        acn_session_token: t_session_token,
        user_type: 1, // Normal user by default
        email: t_email,
        phone: t_phone
    });
    console.log(query.toString());

    let id;
    try {
        id = await query; 
    } catch (err) {
        console.error(err);
        // Roll back acn user database!
        try {
            await acn_axios.delete(`/users/${t_acn_id}`, {
                headers: {
                    'X-Parse-Session-Token': t_session_token
                }
            });
        } catch (rollback_err) {
            console.error(`Acn database rollback failed! Inconsistent with ` +
                    `id=${t_acn_id} token=${t_session_token}`);
            console.error(rollback_err);
            res.status(500).json({
                error: 'Db insert failed and acn rollback failed'
            });
            return;
        }

        if (err.code === 'ER_DUP_ENTRY') {
            console.error(`User "${t_username}" already exists ` + 
                    `in mysql but not acn user database???`);
            res.status(400).json({
                error: 'This user already exists in the database'
            });
        } else {
            res.status(500).json({
                error: 'Db insert failed'
            });
        }
        return;
    }
    
    // Success
    // Return the token
    res.json({
        user_id: (typeof id === 'object' && id.length === 1)
                ? id[0] : id,
        username: t_username,
        acn_id: t_acn_id,
        session_token: t_session_token
    });
};

/**
 * Promote a user to admin status
 * 
 * In: URL params
 * - userIdent: <String>
 * In: Headers
 * - X-Parse-Session-Token: <String>
 * 
 * Out:
 *  Success: JSON
 * {
 *  "userIdent": <String>,
 *  "match": <String {"id" | "username"}>
 * }
 *  Failure: JSON, status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - Target user identifier is either an alnum/_ string (ident interpreted as 
 *   username) or an all-digit string (ident interpreted as user id)
 * - Target user exists
 * - Calling user is authenticated with session token
 * - Calling user is admin
 * 
 * Postconditions:
 * - Target user is promoted to admin if not already admin
 * - No change to calling user
 * - No change to target user if already admin
 * - Either 0 or 1 users affected
 * - Target user's session token remains valid
 * - Idempotent
 */
exports.promoteUserToAdmin = async function (req, res) {
    console.log('Promote to admin');

    let t_user_ident = req.params.userIdent;
    const knex = req.app.locals.knex;
    let ret_object = {userIdent: t_user_ident};

    let query = knex('users')
    .update('user_type', 2)
    .limit(1);

    if (t_user_ident.match(/^\d+$/)) {
        // User id
        query = query.where('id', t_user_ident);
        ret_object.match = 'id';
    } else if (t_user_ident.match(/^[a-zA-Z0-9_]+$/)) {
        // Username
        query = query.where('username', t_user_ident);
        ret_object.match = 'username';
    } else {
        res.status(400).json({
            error: 'Malformed user identifier'
        });
        return;
    }

    console.log(query.toString());

    let rows_updated;
    try {
        rows_updated = await query;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Database error while updating user',
            ex: err.toString()
        });
        return;
    }
    
    if (rows_updated === 0) {
        res.status(404).json({
            error: 'User not found'
        });
    } else if (rows_updated === 1) {
        res.json(ret_object);
    } else {
        res.status(500).json({
            error: 'Unexpected rows_updated value',
            rows_updated: rows_updated,
            typeof: typeof rows_updated
        });
    }
};

/**
 * Get the current user profile
 * 
 * In: Headers
 * - X-Parse-Session-Token: <String>
 * 
 * Out: 
 *  Success: JSON
 * {
 *  "id": <Number>,
 *  "username": <String>,
 *  "long_name": <String>,
 *  "acn_id": <String>,
 *  "user_type": <Number>,
 *  "email": <String>,
 *  "phone": <String>,
 *  "acn_extra": <Object>
 * }
 *  Failure: JSON, status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - User is authenticated with session token
 * 
 * Postconditions:
 * - Only the current user's information is returned
 * - No change to database
 * - Idempotent
 */
exports.getCurrentUser = async function (req, res) {
    console.log('Get current user');
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;

    console.log("User ACN object id: " + user_object_id);

    let query = knex('users')
    .first('users.id', 'users.username', 'users.long_name', 'users.acn_id',
    'users.user_type', 'users.email', 'users.phone')
    .where('users.acn_id', user_object_id);

    console.log(query.toString());

    let row;
    try {
        row = await query;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Db error'
        });
        return;
    }
    
    row.acn_extra = req.acn_session;
    res.json(row);
};

/**
 * Delete the current user, subject to integrity constraints
 * 
 * In: Headers
 * - X-Parse-Session-Token: <String>
 * 
 * Out:
 *  Success: 200 OK
 *  Failure: JSON, status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Precondition:
 * - User is authenticated with session token
 * 
 * Postconditions:
 * - Only the current calling user is affected
 * - Database integrity constraints are preserved
 * - Either user is removed from both databases or not at all
 */
exports.deleteCurrentUser = async function (req, res) {
    // Attempt db delete (may or may not fail due to constraints)
    console.log('Deleting current user');
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;

    // Roll back if acn delete fails
    knex.transaction()
}