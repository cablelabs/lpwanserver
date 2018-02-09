// General libraries in use in this module.
var appLogger = require( './lib/appLogger.js' );

var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * Sessions API
     ********************************************************************/
    /**
     * Creates a new session on behalf of the user.  Expects a json body with the
     * fields "login_username" and "login_password".  Returns a JWT token in the
     * response body that the caller is to put into the Authorize header, prepended
     * with "Bearer ", for any authorized access to other REST interfaces.
     */
    app.post('/api/sessions', function ( req, res, next ) {
        modelAPI.sessions.authorize( req, res, next ).then( function( token ) {
            restServer.respond( res, null, token );
        })
        .catch( function( err ) {
            restServer.respond( res, err );
        });
    });

    /**
     * Ends the session.
     */
    app.delete('/api/sessions', [ restServer.isLoggedIn ], function( req, res, next ){
        modelAPI.sessions.delete( req, res, next ).then( function() {
            restServer.respond( res, 204 );
        })
        .catch( function( err ) {
            appLogger.log( "Error on session logout: " + err );
            restServer.respond( res, err );
        });
    });
}
