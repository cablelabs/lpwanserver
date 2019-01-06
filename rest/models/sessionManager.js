// Configuration access.
var nconf = require('nconf');

// Json web token handling.
var jwt = require('jsonwebtoken');

// Errors.
var httpError = require( 'http-errors' );

// Sessions.
var Session = require( './session.js' );

// The sessionsMap keeps track of sessions we know about so we can cache
// credentials on behalf of those sessions in the object.  At worst, in a
// restart, we re-establish those connections.
var sessionsMap = {};

// Make sure we have a global pointer to the session manager so we can use it
// when we run a Promise.
var thissessionmanager;
//******************************************************************************
// The Session Manager interface.
//
// The session manager interface uses the User interface to verify a user's
// username and password.  It then passes off the session to the caller to keep
// track of.  Note that session objects also keep track of connections to
// remote networks.
//
// users - The user interface to use to log in users.
//******************************************************************************
function SessionManager( users ) {
    this.users = users;
    this.jwtoptions = {
        algorithm: nconf.get( 'jwt_algo' ),
        expiresIn: nconf.get( 'jwt_ttl' ),
        issuer: nconf.get( 'jwt_issuer' )
    };
    this.secret = nconf.get( 'jwt_secret' );
    thissessionmanager = this;
}

/**
 * Authorize the user.  (a.k.a., login)
 *
 * Expects to get a request with a json body with 2 fields:
 * login_username - the user's name
 * login_password - the user's password.
 *
 * Due to the open nature of the login process, we expect the pathway to the
 * server to be ssl protected.
 *
 * returns - a Promise that executes the functionality.  resolved if the
 *           username and password are valid, rejected otherwise with an
 *           appropriate error.
 */
SessionManager.prototype.authorize = function( req, res, next ) {
    return new Promise( function( resolve, reject ) {
        // Verify that we have the login fields required.
        if ( !req.body.login_username || !req.body.login_password ) {
            reject( new httpError.BadRequest );
            return;
        }

        // Got 'em.  Verify the username/password combo using the user
        // implementation set up in the constructor.
        thissessionmanager.users.authorizeUser( req.body.login_username,
                                         req.body.login_password )
        .then( function( user ) {
            // Not an error, per se, but user can be null, indicating
            // failed to log in.  We don't want to say why.
            if ( null === user ) {
                reject( new httpError.Unauthorized );
            }
            else {
                // Make JWT token.  We'll just put in the username and look
                // everything else up when called.
                var token = jwt.sign( { user: user.username },
                                      thissessionmanager.secret,
                                      thissessionmanager.jwtoptions );

                // Create a session for the token and any remote network logins
                var session = new Session( token );

                // Save the session in the sessionsMap.
                sessionsMap[ user.id ] = session;

                // Pass back the token.
                resolve( session.jwtToken );
            }
        })
        .catch( function( err ) {
            // Either a database lookup error (not "not found"), or something
            // else.
            reject( new httpError.InternalServerError );
        });
    });
};

/**
 * Log out the current user.
 *
 * JWT doesn't really have a concept of "logging out".  Just token expiration.
 * But we'll keep this method here in case we decide to have a cache of known
 * sessions, or if we someday decide to change the implementation to support
 * a more traditional login/logout model.
 *
 * Returns a promise that does nothing.
 */
SessionManager.prototype.delete = function( req, res, next ) {
    return new Promise( function( resolve, reject ) {
        // There's really nothing we can do to kill a JWT token itself.  And we
        // don't really want to, in case we get restarted in the middle of active
        // sessions.  But let's end remote connections to the networks we are
        // connected to and remove the session data from the sessionsMap.
        var s = sessionsMap[ req.user.id ];
        if ( s ) {
            s.dropConnections().then( function( ) {
                delete sessionsMap[ req.user.id ];
                resolve();
            } )
            .catch( function( err ) {
                reject( err );
            });
        }
        else {
            resolve( );
        }
    });
};

/**
 * Verifies that the current request has a valid login.  This method
 * (1) verifies that the Authorization header in the request object is of the
 * format "Bearer <token>", where the token is a JWT token returned by
 * authorize(), and
 * (2) verifies that the token is valid, and
 * (3) adds the user record based on the username in the token to the request
 *     object as a user object.
 *
 * This is an unusual method for the API in that it does not return a Promise.
 * It executes and either passes on to the next step in the processing chain
 * via next, or end the request with a 401 error.
 */
SessionManager.prototype.verifyAuthorization = function( req, res, next ) {
    var verified;
    try {
        var token = req.headers.authorization.replace( "Bearer ", "" );
        var verified = jwt.verify( token, thissessionmanager.secret );
        // Assuming the verified data due to encryption is enough.
        // Get the user record into the request structure for use in the
        // methods.
        thissessionmanager.users.retrieveUserByUsername( verified.user ).then( function( user ) {
            // Drop internal use fields for upper layers.
            delete user.passwordHash;
            delete user.lastVerifiedEmail;
            req.user = user;

            // Make sure we have a session for this user.
            if ( ! sessionsMap[ user.id ] ) {
                sessionsMap[ user.id ] = new Session( token );
            }
            next();
        })
        .catch( function( err ) {
            res.status( 401 );
            res.send();
        });
    }
    catch( err ) {
        res.status( 401 );
        res.send();
    }

};

module.exports = SessionManager;
