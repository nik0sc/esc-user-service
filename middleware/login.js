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
        if (typeof next === 'function') {
            next();
        }
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
};