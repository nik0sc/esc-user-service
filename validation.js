/**
 * Validate a user identifier as either of:
 * - an id number,
 * - a username, 
 * - an ACN API user objectId, or
 * - invalid
 * This function expects a string parameter. An integer parameter will fail 
 * to validate. This is by design
 * 
 * In:
 * - userIdent: <String>
 * 
 * Out:
 * {false | "id" | "username" | "acn_id"}
 */
exports.validateUserIdent = function (userIdent) {
    if (typeof userIdent !== 'string' || userIdent === '') {
        return false;
    }

    // Test for this first...
    if (userIdent.match(/^\d+$/)) {
        return 'id';
    }

    // if (userIdent.match(/^[a-zA-Z0-9_]+$/)) {
    //     return 'username';
    // }

    let alnum_match = userIdent.match(/^(?<acn>acn:)?[a-zA-Z0-9_]+$/);
    if (alnum_match) {
        if (alnum_match.groups.acn) {
            return 'acn_id';
        } else {
            return 'username';
        }
    }

    return false;
};

/**
 * Validate a team identifier as either of:
 * - an id number,
 * - a team name, or
 * - invalid
 * 
 * In:
 * - teamIdent: <String>
 * 
 * Out:
 * {false | "id" | "team_name"}
 */
exports.validateTeamIdent = function (teamIdent) {
    if (typeof teamIdent !== 'string' || teamIdent === '') {
        return false;
    }

    if (teamIdent.match(/^\d+$/)) {
        return 'id';
    }

    return 'team_name';
};