exports.login = function (req, res) {
    console.log('Logging in');
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;

    let t_username = req.body.username;
    let t_password = req.body.password;

    acn_axios.get('/login', {
        params: {
            username: t_username,
            password: t_password
        }
    })
    .then((res2) => {
        let query = knex('users')
        .first('users.id', 'users.username', 'users.long_name', 'users.acn_id',
        'users.user_type')
        .where('users.acn_id', res2.data.objectId);
    
        console.log(query.toString());

        query.then((row) => {
            row.sessionToken = res2.data.sessionToken;
            delete res2.data.sessionToken;
            row.acn_extra = res2.data;
            
            res.json(row);
        })
        .catch((err) => {
            res.status(500).json({
                error: 'Db error'
            });
        });
    })
    .catch((err) => {
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
                var status_string = err.response.status + ' ' + 
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
    });

};

exports.createUser = function (req, res) {
    console.log('Create new user');
    const knex = req.app.locals.knex;
    const acn_axios = req.app.locals.acn_axios;

    let t_username = req.body.username;
    let t_password = req.body.password;

    // console.log(t_username + ':' + t_password);

    // Attempt to insert into acn api first
    acn_axios.post('/users', {
        username: t_username,
        password: t_password
    }).then((res2) => {
        // Now insert into db
        let query = knex('users').insert({
            username: req.body.username,
            long_name: req.body.long_name,
            acn_id: res2.data.objectId,
            acn_session_token: res2.data.sessionToken,
            user_type: 0 // Meaning what?
        });
    
        console.log(query.toString());
    
        query.then((id) => {
            // Success
            // Return the token
            res.json({
                user_id: (typeof id === 'object' && id.length === 1)
                        ? id[0] : id,
                username: req.body.username,
                acn_id: res2.data.objectId,
                session_token: res2.data.sessionToken
            });
        }).catch((err) => {
            console.log(err);
            res.status(500).json({
                error: 'Db insert failed'
            });
        });
    }).catch((err) => {
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
            var status_string = err.response.status + ' ' + 
                    err.response.statusText;
            console.log(status_string);
            res.status(500).json({
                error: 'Upstream error from acn user management',
                response: status_string
            });
        }
    });

};

exports.getCurrentUser = function (req, res) {
    console.log('Get current user');
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;

    console.log("User ACN object id: " + user_object_id);

    let query = knex('users')
    .first('users.id', 'users.username', 'users.long_name', 'users.acn_id',
    'users.user_type')
    .where('users.acn_id', user_object_id);

    console.log(query.toString());

    query.then((row) => {
        row.acn_extra = req.acn_session;
        res.json(row);
    })
    .catch((err) => {
        console.log(err);
        res.status(500).json({
            error: 'Db error'
        });
    });
};

exports.deleteUser = function (req, res) {

};