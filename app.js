const express = require('express');
const app = express();
const port = 5000;
const bodyparser = require('body-parser');
const fs = require('fs');
const login_util = require('./login_util');

app.use(bodyparser.json());

const knex = require('knex')({
    client: 'mysql2',
    connection: process.env.DATABASE_URL
});

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/chat/:chatroomId', (req, res) => {
    knex('chat_messages').select('users.username', 'chat_messages.message', 'chat_messages.sent_time')
        .join('users', 'chat_messages.sent_user_id', '=', 'users.id')
        .where('chat_messages.chatroom_id', req.params.chatroomId)
        .orderBy('chat_messages.sent_time')
        .then((rows) => {
            res.json(rows);
        });
});

app.get('/ticket/:ticketId(\\d+)', (req, res) => {
    console.log('Getting ' + req.params.ticketId);
    var query = knex('tickets')
        .first('tickets.id', 'tickets.title', 'tickets.message',
            'tickets.attachment_path', 'tickets.open_time', 
            'tickets.close_time', 'tickets.priority', 'tickets.severity',
            'tickets.assigned_team', 'tickets.opener_user',
            'users.username', 'users.long_name', 
            'teams.team_name')
        .join('users', 'tickets.opener_user', '=', 'users.id')
        .join('teams', 'tickets.assigned_team', '=', 'teams.id')
        .where('tickets.id', req.params.ticketId);
    
    console.log(query.toString());
    
    query.then((row) => {
        res.json(row);
    });
});

app.get('/ticket/byUser', login_util.check_session_token, (req, res) => {
    // Grab the user profile
    let user_object_id = req.acn_session.user.objectId;

    console.log("User ACN object id: " + user_object_id);

    let query = knex('tickets')
    .select('tickets.id', 'tickets.title', 'tickets.message',
        'tickets.attachment_path', 'tickets.open_time', 
        'tickets.close_time', 'tickets.priority', 'tickets.severity',
        'tickets.assigned_team', 'tickets.opener_user',
        'users.username', 'users.long_name', 
        'teams.team_name')
    .join('users', 'tickets.opener_user', '=', 'users.id')
    // Left join: Want all rows in tickets that match the where condition,
    // even if a row doesn't have an assigned team
    .leftJoin('teams', 'tickets.assigned_team', '=', 'teams.id')
    .where('users.id', 
        knex('users')
        .first('users.id')
        .where('users.acn_id', user_object_id)
    );

    console.log(query.toString());

    query.then((rows) => {
        res.json(rows);
    })
    .catch((err) => {
        res.statusCode(500).json({
            error: 'Db error'
        });
    });
});

app.post('/ticket', login_util.check_session_token, (req, res) => {
    console.log('Creating new ticket');

    let user_object_id = req.acn_session.user.objectId;
    
    let query = knex('tickets').insert({
        title: req.body.title,
        message: req.body.message,
        attachment_path: '',
        open_time: knex.fn.now(),
        priority: req.body.priority,
        severity: req.body.severity,
        opener_user: knex('users')
            .first('id')
            .where('acn_id', user_object_id)
    });

    console.log(query.toString());
    
    query.then((id) => {
        res.json({
            success: 'true',
            id: (typeof id === 'object' && id.length === 1) ? id[0] : id
        });
    })
    .catch((err) => {
        res.status(500)
        .json({
            error: 'Database error while inserting ticket',
            ex: err.toString()
        });
    });

});

app.put('/ticket/:ticketId', login_util.check_session_token, (req, res) => {
    let ticket_id = req.params.ticketId;
    let user_object_id = req.acn_session.user.objectId;

    console.log('Update ticket ' + ticket_id 
            + ' from user id ' + user_object_id);

    // Check that user is authorized to do this!
    knex('tickets').update();
});

app.put('/ticket/:ticketId/attachment',
        login_util.check_session_token, (req, res) => {
    // Make sure this ticket exists
    var query = knex('tickets')
        .first('id', 'attachment_path')
        .where('id', req.params.ticketId);
    
    console.log(query.toString());

    query.then((row) => {
        if (typeof row === 'undefined') {
            res.status(404).json({
                error: 'Ticket id does not exist'
            });
            return;
        }
        
        if (row.attachment_path === '') {
            // Create a directory for this ticket
            var dirpath = 'attachments/' + row.id;
            if (!fs.existsSync(dirpath)) {
                fs.mkdirSync(dirpath);
            }

            
        } 

        res.end();
    })
    .catch((err) => {
        console.log(err);
        res.status(500).json({
            error: 'Database query error'
        });
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
