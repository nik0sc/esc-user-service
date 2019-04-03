const router = require('express').Router();

const attachments = require('../handlers/attachments');
const login = require('../middleware/login');

router.get('/:attachmentId',
        login.checkSessionToken,
        attachments.get);

router.post('/',
        login.checkSessionToken,
        attachments.upload);

router.put('/:attachmentId(\\d+)/linkToTicket/:ticketId(\\d+)',
        login.checkSessionToken,
        attachments.linkToTicket);

router.delete('/:attachmentId(\\d+)',
        login.checkSessionToken,
        attachments.delete);

router.delete('/',
        login.checkSessionToken,
        attachments.delete);

module.exports = router;