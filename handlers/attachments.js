const fs = require('fs');

exports.get = function (req, res) {

};

exports.upload = function (req, res) {

};

exports.linkToTicket = function (req, res) {

};

exports.delete = function (req, res) {

};

exports.uploadToTicket = function (req, res) {
    // Make sure this ticket exists
    var query = req.app.locals.knex('tickets')
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
};