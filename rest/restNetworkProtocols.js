var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * NetworkProtocols API.
     ********************************************************************
    /**
     * Gets the networkProtocols available
     * - Can be called by any user.
     * - If the request includes a limit query parameter, only that number of
     *   entries are returned.
     * - If the request includes an offset query parameter, the first offset
     *   records are skipped in the returned data.
     * - If the request includes a search query parameter, the networkProtocols
     *   will be limited to records that match the passed string in either the
     *   name or protocolType fields.  In the string, use "%" to match 0 or more
     *   characters and "_" to match exactly one.  So to match names starting
     *   with "D", use the string "D%".
     */
    app.get('/api/networkProtocols', [restServer.isLoggedIn],
                                     function(req, res, next) {
        var options = {};
        if ( req.query.limit ) {
            var limitInt = parseInt( req.query.limit );
            if ( !isNaN( limitInt ) ) {
                options.limit = limitInt;
            }
        }
        if ( req.query.offset ) {
            var offsetInt = parseInt( req.query.offset );
            if ( !isNaN( offsetInt ) ) {
                options.offset = offsetInt;
            }
        }
        if ( req.query.search ) {
            options.search = req.query.search;
        }
        modelAPI.networkProtocols.retrieveNetworkProtocols( options ).then( function( nps ) {
            restServer.respondJson( res, null, nps );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkProtocols: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the networkProtocol record with the specified id.
     * - Can be called by any user
     */
    app.get('/api/networkProtocols/:id', [restServer.isLoggedIn],
                                         function(req, res, next) {
        var id = req.params.id;
        modelAPI.networkProtocols.retrieveNetworkProtocol( parseInt( req.params.id ) ).then( function( np ) {
            restServer.respondJson( res, null, np );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkProtocol " + req.params.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Creates a new networkProtocols record.
     * - A user with an admin company can create a networkProtocol.
     * - Requires a name, protocolType, and a protocolHandler.  The name is the
     *   name of the server type, such as "LoRa Open Source", "MachineQ", the
     *   protocolType is the type of LPWAN, such as "LoRa", "NB-IoT", etc..  The
     *   protocolHandler is the name of the file in the handlers directory that
     *   supports the handler interface.
     *   in the JSON body.
     * - {
     *     "name": "OpenSource LoRa",
     *     "protocolHandler": "loraOpenSourceProtocolHandler.js"
     *   }
     */
    app.post('/api/networkProtocols', [restServer.isLoggedIn,
                                       restServer.fetchCompany,
                                       restServer.isAdminCompany],
                                      function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
            restServer.respond( res, 400, "Cannot specify the networkProtocol's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name || !rec.networkTypeId || !rec.protocolHandler ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // Do the add.
        modelAPI.networkProtocols.createNetworkProtocol(
                                    rec.name,
                                    rec.networkTypeId,
                                    rec.protocolHandler  ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
            restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
            restServer.respond( res, err );
        });
    });

    /**
     * Updates the networkProtocol record with the specified id.
     * - Can only be called by a user who is part of an admin company.
     */
    app.put('/api/networkProtocols/:id', [restServer.isLoggedIn,
                                          restServer.fetchCompany,
                                          restServer.isAdminCompany],
                                         function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the company, as a read is much less expensive
        // than a write, and then we'll be able to tell if anything really
        // changed before we even try to write.
        modelAPI.networkProtocols.retrieveNetworkProtocol( req.params.id ).then( function( np ) {
            // Fields that may exist in the request body that can change.  Make
            // sure they actually differ, though.
            var changed = 0;
            if ( ( req.body.name ) &&
                 ( req.body.name != np.name ) ) {
                data.name = req.body.name;
                ++changed;
            }
            if ( req.body.protocolHandler ) {
                if ( req.body.protocolHandler != np.protocolHandler ) {
                    data.protocolHandler = req.body.protocolHandler;
                    ++changed;
                }
            }
            if ( req.body.networkTypeId ) {
                if ( req.body.networkTypeId != np.networkTypeId ) {
                    data.networkTypeId = req.body.networkTypeId;
                    ++changed;
                }
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
                modelAPI.networkProtocols.updateNetworkProtocol( data ).then( function ( rec ) {
                    restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkProtocol " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Deletes the networkProtocol record with the specified id.
     * - Only a user with the admin company can delete a networkProtocol.
     */
    app.delete('/api/networkProtocols/:id', [restServer.isLoggedIn,
                                             restServer.fetchCompany,
                                             restServer.isAdminCompany],
                                            function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.networkProtocols.deleteNetworkProtocol( id ).then( function( ) {
            restServer.respond( res, 204 );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting network protocol " + id + ": " + err );
            restServer.respond( res, err );
        });
    });
}
