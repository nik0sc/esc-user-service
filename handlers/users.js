exports.login = async function (req, res) {
    console.log('Logging in');
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;

    let t_username = req.body.username;
    let t_password = req.body.password;

    if (typeof t_username === 'undefined' 
            || typeof t_password === 'undefined') {
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
    'users.user_type')
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

    row.sessionToken = res2.data.sessionToken;
    delete res2.data.sessionToken;
    row.acn_extra = res2.data;
    
    res.json(row);
};

exports.createUser = async function (req, res) {
    console.log('Create new user');
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;

    let t_username = req.body.username;
    let t_password = req.body.password;

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
            res.status(400).json({
                error: 'User already exists'
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
        username: req.body.username,
        long_name: req.body.long_name,
        acn_id: t_acn_id,
        acn_session_token: t_session_token,
        user_type: 0 // Meaning what?
    });
    console.log(query.toString());

    let id;
    try {
        id = await query; 
    } catch (err) {
        console.error(err);
        // Roll back acn user database!
        try {
            await acn_axios.delete('/users/' + t_acn_id, {
                headers: {
                    'X-Parse-Session-Token': t_session_token
                }
            });
        } catch (rollback_err) {
            console.error('Acn database rollback failed! Inconsistent with id='
                    + t_acn_id + ' token=' + t_session_token);
            console.error(rollback_err);
            res.status(500).json({
                error: 'Db insert failed and acn rollback failed'
            });
            return;
        }

        if (err.code === 'ER_DUP_ENTRY') {
            console.error(`User "${req.body.username}" already exists ` + 
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
        username: req.body.username,
        acn_id: t_acn_id,
        session_token: t_session_token
    });
};

exports.getCurrentUser = async function (req, res) {
    console.log('Get current user');
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;

    console.log("User ACN object id: " + user_object_id);

    let query = knex('users')
    .first('users.id', 'users.username', 'users.long_name', 'users.acn_id',
    'users.user_type')
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

exports.deleteUser = async function (req, res) {
    // Attempt db delete (may or may not fail due to constraints)
    console.log('Deleting current user');
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;

    // Roll back if acn delete fails
    knex.transaction()    
}