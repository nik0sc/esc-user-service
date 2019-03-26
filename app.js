const express = require('express');
const app = express();
const port = 5000;
const bodyparser = require('body-parser');

const tickets = require('./routes/tickets');
const attachments = require('./routes/attachments');
const login = require('./login');

app.use(bodyparser.json());

app.locals.knex = require('knex')({
    client: 'mysql2',
    connection: process.env.DATABASE_URL
});

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/version', (req, res) => {
    res.json({
        name: 'esc-ticket-service',
        rev: process.env.GIT_REV
    });
})

app.get('/ticket/:ticketId(\\d+)', tickets.getById);

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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
