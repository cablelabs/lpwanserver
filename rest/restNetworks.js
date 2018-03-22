var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * Networks API.
     ********************************************************************
    /**
     * Gets the networks available
     * - Can be called by any user.
     * - If the request includes a limit query parameter, only that number of
     *   entries are returned.
     * - If the request includes an offset query parameter, the first offset records
     *   are skipped in the returned data.
     * - If the request includes a search query parameter, the networks
     *   will be limited to records that match the passed string in the name
     *   field.  In the string, use "%" to match 0 or more characters and "_" to
     *   match exactly one.  So to match names starting with "D", use the string
     *   "D%".
     * - If request includes a networkProviderId query parameter, the returned
     *   networks will only be ones that use that networkProvider.
     * - If request includes a networkTypeId query parameter, the returned
     *   networks will only be ones that use that networkType.
     * - If request includes a networkProtocolId query parameter, the returned
     *   networks will only be ones that use that networkProtocol.
     */
    app.get('/api/networks', [restServer.isLoggedIn], function(req, res, next) {
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
        if ( req.query.networkProviderId ) {
            options.networkProviderId = req.query.networkProviderId;
        }
        if ( req.query.networkTypeId ) {
            options.networkTypeId = req.query.networkTypeId;
        }
        if ( req.query.networkProtocolId ) {
            options.networkProtocolId = req.query.networkProtocolId;
        }
        modelAPI.networks.retrieveNetworks( options ).then( function( networks ) {
            restServer.respondJson( res, null, networks );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networks: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the network record with the specified id.
     * - Can be called by any user
     */
    app.get('/api/networks/:id', [restServer.isLoggedIn], function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.networks.retrieveNetwork( id ).then( function( np ) {
            restServer.respondJson( res, null, np );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting network " + id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Creates a new networks record.
     * - A user with an admin company can create a network.
     * - Requires a name, networkProtocolId (how to talk to the network),
     *   baseUrl (to the network's API protocol interface), and optional
     *   securityData (used by the protocol to gain access to the server).
     *   in the JSON body.  DJS:  Added Service Profile to contain the Region
     * - {
     *     "name": "CableLabs Open Source LoRa",
     *     "networkProviderId": 3,
     *     "networkTypeId": 2,
     *     "networkProtocolId": 4,
     *     "baseUrl": "https://sensornet.cablelabs.com:5089",
     *     "securityData": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiamNhbXBhbmVsbCIsImlhdCI6MTUwNDcyMTI0NywiZXhwIjoxNTA0NzY0NDQ3LCJpc3MiOiJscHdhbCJ9.LFUZRsx26bsYEn3S2cCmknWP8UhQ019dz9Ypv5EIDo8"
     *   }
     */
    app.post('/api/networks', [restServer.isLoggedIn,
                               restServer.fetchCompany,
                               restServer.isAdminCompany],
                              function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
            restServer.respond( res, 400, "Cannot specify the network's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name ||
             !rec.networkProviderId ||
             !rec.networkTypeId ||
             !rec.networkProtocolId ||
             !rec.baseUrl ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // Do the add.
        modelAPI.networks.createNetwork(
                                    rec.name,
                                    rec.networkProviderId,
                                    rec.networkTypeId,
                                    rec.networkProtocolId,
                                    rec.baseUrl,
                                    rec.securityData ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
            restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
            appLogger.log( "Error creating network" + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Updates the network record with the specified id.
     * - Can only be called by a user who is part of an admin company.
     */
    app.put('/api/networks/:id', [restServer.isLoggedIn,
                                  restServer.fetchCompany,
                                  restServer.isAdminCompany],
                                 function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the network, as a read is much less expensive than
        // a write, and then we'll be able to tell if anything really changed before
        // we even try to write.
        modelAPI.networks.retrieveNetwork( data.id ).then( function( ntwk ) {
            // Fields that may exist in the request body that can change.  Make
            // sure they actually differ, though.
            var changed = 0;
            if ( ( req.body.name ) &&
                 ( req.body.name != ntwk.name ) ) {
                data.name = req.body.name;
                ++changed;
            }
            if ( req.body.networkProviderId ) {
                if ( req.body.networkProviderId != ntwk.networkProviderId ) {
                    data.networkProviderId = req.body.networkProviderId;
                    ++changed;
                }
            }
            if ( req.body.networkTypeId ) {
                if ( req.body.networkTypeId != ntwk.networkTypeId ) {
                    data.networkTypeId = req.body.networkTypeId;
                    ++changed;
                }
            }
            if ( req.body.networkProtocolId ) {
                if ( req.body.networkProtocolId != ntwk.networkProtocolId ) {
                    data.networkProtocolId = req.body.networkProtocolId;
                    ++changed;
                }
            }
            if ( req.body.baseUrl ) {
                if ( req.body.baseUrl != ntwk.baseUrl ) {
                    data.baseUrl = req.body.baseUrl;
                    ++changed;
                }
            }
            if ( req.body.securityData ) {
                if ( req.body.securityData !== ntwk.securityData ) {
                    data.securityData = req.body.securityData;
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
                modelAPI.networks.updateNetwork( data ).then( function ( rec ) {
                    restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting network " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Deletes the network record with the specified id.
     * - Only a user with the admin company can delete a network.
     */
    app.delete('/api/networks/:id', [restServer.isLoggedIn,
                                     restServer.fetchCompany,
                                     restServer.isAdminCompany],
                                    function(req, res, next) {
        var id = parseInt( req.params.id );
        // If the caller is a global admin, we can just delete.
        modelAPI.networks.deleteNetwork( id ).then( function( ) {
            restServer.respond( res, 204 );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting network " + id + ": " + err );
            restServer.respond( res, err );
        });
    });

}
