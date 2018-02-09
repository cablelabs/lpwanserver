var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * NetworkTypes API.
     ********************************************************************
    /**
     * Gets the networkTypes available
     * - Can be called by any user.
     */
    app.get('/api/networkTypes', [restServer.isLoggedIn], function(req, res, next) {
        modelAPI.networkTypes.retrieveNetworkTypes().then( function( nts ) {
            restServer.respondJson( res, null, nts );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkTypes: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the networkType record with the specified id.
     * - Can be called by any user
     */
    app.get('/api/networkTypes/:id', [restServer.isLoggedIn],
                                     function(req, res, next) {
        var id = req.params.id;
        modelAPI.networkTypes.retrieveNetworkType( parseInt( req.params.id ) ).then( function( rp ) {
            restServer.respondJson( res, null, rp );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkType " + req.params.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Creates a new networkTypes record.
     * - A user with an admin company can create a networkType.
     * - Requires a name.  The name is the name of the network type that has a
     *   unique set of data.  "NB-IoT", "LoRa1.0", "LoRa1.1" may be examples.
     * - {
     *     "name": "NB-IoT"
     *   }
     */
    app.post('/api/networkTypes', [restServer.isLoggedIn,
                                       restServer.fetchCompany,
                                       restServer.isAdminCompany],
                                      function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
            restServer.respond( res, 400, "Cannot specify the networkType's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // Do the add.
        modelAPI.networkTypes.createNetworkType( rec.name ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
            restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
            restServer.respond( res, err );
        });
    });

    /**
     * Updates the networkType record with the specified id.
     * - Can only be called by a user who is part of an admin company.
     */
    app.put('/api/networkTypes/:id', [restServer.isLoggedIn,
                                      restServer.fetchCompany,
                                      restServer.isAdminCompany],
                                     function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the old record, as a read is much less
        // expensive than a write, and then we'll be able to tell if anything
        // really changed before we even try to write.
        modelAPI.networkTypes.retrieveNetworkType( req.params.id ).then( function( rp ) {
            // Fields that may exist in the request body that can change.  Make
            // sure they actually differ, though.
            var changed = 0;
            if ( ( req.body.name ) &&
                 ( req.body.name != rp.name ) ) {
                data.name = req.body.name;
                ++changed;
            }

            // Ready.  DO we have anything to actually change?
            if ( 0 == changed ) {
                // No changes.  But returning 304 apparently causes Apache to strip
                // CORS info, causing the browser to throw a fit.  So just say,
                // "Yeah, we did that.  Really.  Trust us."
                restServer.respond( res, 204 );
            }
            else {
                // Do the update.
                modelAPI.networkTypes.updateNetworkType( data ).then( function ( rec ) {
                    restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkType " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Deletes the networkType record with the specified id.
     * - Only a user with the admin company can delete a networkType.
     */
    app.delete('/api/networkTypes/:id', [restServer.isLoggedIn,
                                         restServer.fetchCompany,
                                         restServer.isAdminCompany],
                                        function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.networkTypes.deleteNetworkType( id ).then( function( ) {
            restServer.respond( res, 204 );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting networkType " + id + ": " + err );
            restServer.respond( res, err );
        });
    });
}
