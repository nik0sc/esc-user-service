const express = require('express');
const app = express();
const port = 5000;
const bodyparser = require('body-parser');

const tickets = require('./handlers/tickets');
const attachments = require('./handlers/attachments');
const users = require('./handlers/users');
const login = require('./middleware/login');

app.use(bodyparser.json());

app.locals.knex = require('knex')({
    client: 'mysql2',
    connection: process.env.DATABASE_URL
});

const axios = require('axios');

app.locals.acn_axios = axios.create({
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
    let git_rev = (typeof process.env.GIT_REV === 'undefined') 
            ? 'Not deployed'
            : process.env.GIT_REV;

    res.json({
        name: 'esc-ticket-service',
        rev: git_rev
    });
}
app.get('/', info);
app.get('/version', info);

app.get('/ticket/:ticketId(\\d+)',
        tickets.getById);

app.get('/ticket/byUser', 
        login.checkSessionToken, 
        tickets.getAllByUser);

app.post('/ticket', 
        login.checkSessionToken, 
        tickets.createNew);

app.put('/ticket/:ticketId(\\d+)', 
        login.checkSessionToken,
        tickets.update);

app.put('/ticket/:ticketId/attachment',
        login.checkSessionToken, 
        attachments.uploadToTicket);

app.get('/attachment/:attachmentId',
        login.checkSessionToken,
        attachments.get);

app.post('/attachment',
        login.checkSessionToken,
        attachments.upload);

app.put('/attachment/:attachmentId(\\d+)/linkToTicket/:ticketId(\\d+)',
        login.checkSessionToken,
        attachments.linkToTicket);

app.delete('/attachment/:attachmentId(\\d+)',
        login.checkSessionToken,
        attachments.delete);

app.delete('/attachment',
        login.checkSessionToken,
        attachments.delete);

app.get('/user/login',
        users.login);

app.post('/user',
        users.createUser);

app.get('/user/me',
        login.checkSessionToken,
        users.getCurrentUser);

app.delete('/user/me',
        login.checkSessionToken,
        users.deleteUser);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
