const express = require('express');
const app = express();
const port = 5000;
const bodyparser = require('body-parser');

const users_router = require('./routers/users');
const tickets_router = require('./routers/tickets');
const attachments_router = require('./routers/attachments');
const teams_router = require('./routers/teams');

app.use(bodyparser.json());

app.locals.knex = require('knex')({
    client: 'mysql2',
    connection: process.env.DATABASE_URL
});

app.locals.acn_axios = require('axios').create({
    baseURL: 'https://ug-api.acnapiv3.io/swivel/acnapi-common-services/common',
    timeout: 3000,
    headers: {
        'Server-Token': process.env.ACN_SERVER_TOKEN,
        'Content-Type': 'application/json'  
    }
});

// Allow XHR from anywhere
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Parse-Session-Token, X-Requested-With, Content-Type');
    next();
});

function info(req, res) {
    res.json({
        name: 'esc-ticket-service',
        rev: (typeof process.env.GIT_REV === 'undefined') 
                ? 'Not deployed'
                : process.env.GIT_REV
    });
}
app.get('/', info);
app.get('/version', info);

app.use('/user', users_router);
app.use('/ticket', tickets_router);
app.use('/attachment', attachments_router);
app.use('/team', teams_router);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
