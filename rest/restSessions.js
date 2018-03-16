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
     * Creates a new session on behalf of the user.
     *
     * @api {post} /api/sessions Create Session
     * @apiGroup Sessions
     * @apiDescription Returns a JWT token in the response body that the
     * caller is to put into the Authorize header, prepended  with "Bearer ",
     * for any authorized access to other REST interfaces.
     * @apiParam {string} login_username The user's username
     * @apiParam {string} login_password The user's password
     * @apiExample {json} Example body:
     *      {
     *          "login_username": "admin",
     *          "login_password": "secretshhh"
     *      }
     * @apiSuccess (200) {string} token The JWT token for the user.
     * @apiVersion 0.1.0
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
     *
     * @api {delete} /api/sessions Delete Session
     * @apiGroup Sessions
     * @apiDescription Deletes the session.
     * @apiVersion 0.1.0
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
