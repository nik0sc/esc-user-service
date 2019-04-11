const express = require('express');
const app = express();
const bodyparser = require('body-parser');

const users_router = require('./routers/users');
const teams_router = require('./routers/teams');
const common = require('./middleware/common');

app.use(bodyparser.json());

const port = (typeof process.env.PORT !== 'undefined')
        ? parseInt(process.env.PORT) : 8000;

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

if (typeof process.env.TICKET_SERVICE_BASE_URL === 'undefined') {
    console.error('TICKET_SERVICE_BASE_URL is not in environment');
} 

app.locals.ticket_axios = require('axios').create({
    baseURL: process.env.TICKET_SERVICE_BASE_URL,
    timeout: 3000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Allow XHR from some places only
app.use(common.xhrAllowWhitelistOrigins);

function info(req, res) {
    res.json({
        name: 'esc-user-service',
        rev: (typeof process.env.GIT_REV === 'undefined') 
                ? 'Not deployed'
                : process.env.GIT_REV
    });
}
app.get('/', info);
app.get('/version', info);

app.use('/user', users_router);
app.use('/team', teams_router);

app.listen(port, () => {
    console.log(`Users service listening on port ${port}!`);
});
