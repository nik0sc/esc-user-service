const allowed_origins = [
    /^http:\/\/localhost(:\d+)*$/,
    /^https:\/\/(frontend.)?ticket.lepak.sg$/
];

exports.xhrAllowWhitelistOrigins = function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'Origin, X-Parse-Session-Token, X-Requested-With, Content-Type');
    res.header('Vary', 'Origin');

    const origin = req.header('Origin');
    
    if (typeof origin !== 'undefined') {
        if (allowed_origins.some((regexp) => origin.match(regexp))) {
            res.header('Access-Control-Allow-Origin', origin);
            console.log(`Origin: ${origin} is allowed`);
        } else {
            console.log(`Disallowed origin: ${origin}`);
        }
    } else {
        console.log('No origin');
    }

    next();
};