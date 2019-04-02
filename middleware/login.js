// Middleware function to check tokens against acnapi
// If the token checks out, the session object is injected into request object
// Use it to check if this user is authorized to access the object
exports.checkSessionToken = async function (req, res, next) {
    let session_token = req.header('X-Parse-Session-Token');

    if (typeof session_token === 'undefined') {
        res.status(401).json({
            error: 'No session token'
        });
        return;
    }

    const acn_axios = req.app.locals.acn_axios;

    try {
        let res2 = await acn_axios.get('/sessions/me', {
            headers: {
                'X-Parse-Session-Token': session_token
            }
        });

        req.acn_session = res2.data;
    } catch (err) {
        if (err.response) {
            // Invalid session token
            if (err.response.status === 400 && err.response.data.code === 209) {
                res.status(401).json({
                    error: 'Invalid session token'
                });
            } else if (err.response.status === 504) {
                console.log('acn timeout');
                res.status(504).json({
                    error: 'Upstream timeout in acn session management'
                });
            } else {
                console.log('error in session verification');
                let status_string = err.response.status + ' ' + 
                        err.response.statusText;
                console.log(status_string);
                res.status(500).json({
                    error: 'Upstream error from acn session management',
                    response: status_string
                });
            }
        } else if (err.code === 'ECONNABORTED') {
            console.log('acn timeout');
            res.status(504).json({
                error: 'Upstream timeout in acn session management'
            });
        } else {
            console.log('error in session verification - no response');
            console.log(err);
            res.status(500).json({
                error: 'Check server log',
                error_code: err.code 
            });
        }
        return;
    }
    
    if (typeof next === 'function') {
        next();
    }
};

exports.userIsAdmin = async function (req, res, next) {
    if (typeof req.acn_session === 'undefined') {
        throw new Error('No acn user management object found in req');
    }

    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;
    
    let query = knex('users')
    .first('users.id', 'users.username', 'users.acn_id', 'users.user_type')
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
    
    console.log(`${row.id}:${row.username}:${row.user_type}`);

    if (row.user_type !== 2) {
        res.status(403).json({
            error: 'Only an admin can perform this action'
        });
        return;
    } 

    if (typeof next === 'function') {
        next();
    }
}