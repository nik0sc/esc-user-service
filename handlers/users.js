const axios = require('axios');

exports.createUser = function (req, res) {
    console.log('Create new user');
    const knex = req.app.locals.knex;

    let t_username = req.body.username;
    let t_password = req.body.password;

    // console.log(t_username + ':' + t_password);

    // Attempt to insert into acn api first
    axios.post('https://ug-api.acnapiv3.io/swivel/acnapi-common-services/common/users', {
        headers: {
            'Server-Token': process.env.ACN_SERVER_TOKEN,
            'Content-Type': 'application/json'    
        },
        data: {
            username: t_username,
            password: t_password
        },
        timeout: 3000
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
                user_id: id,
                username: req.body.username,
                acn_id: res.data.objectId,
                session_token: res2.data.sessionToken
            });
        }).catch((err) => {
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

exports.deleteUser = function (req, res) {

}