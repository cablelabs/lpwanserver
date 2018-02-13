var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * DeviceNetworkTypeLinks API.
     ********************************************************************
    /**
     * Gets the deviceNetworkTypeLinks that are defined
     * - Can be called by any user.
     * - If the request includes a networkTypeId query parameter, the links matching
     *   the networkTypeId are returned.
     * - If the request includes a deviceId query parameter, the links
     *   matching the deviceId are returned.
     * - If the request includes a applicationId query parameter, the links
     *   matching the applicationId are returned.
     */
    app.get('/api/deviceNetworkTypeLinks', [restServer.isLoggedIn,
                                        restServer.fetchCompany], function(req, res, next) {
        var options = {};
        // Limit by company, too, if not a system admin.
        if ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) {
            options.companyId = req.company.id;
        }
        if ( req.query.networkTypeId ) {
            var networkTypeIdInt = parseInt( req.query.networkTypeId );
            if ( !isNaN( networkTypeIdInt ) ) {
                options.networkTypeId = networkTypeIdInt;
            }
        }
        if ( req.query.deviceId ) {
            var deviceIdInt = parseInt( req.query.deviceId );
            if ( !isNaN( deviceIdInt ) ) {
                options.deviceId = deviceIdInt;
            }
        }
        if ( req.query.applicationId ) {
            var applicationIdInt = parseInt( req.query.applicationId );
            if ( !isNaN( applicationIdInt ) ) {
                options.applicationId = applicationIdInt;
            }
        }
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
        modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks( options ).then( function( networks ) {
            restServer.respondJson( res, null, networks );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networks: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the deviceNetworkTypeLink record with the specified id.
     * - Can be called by any user
     */
    app.get('/api/deviceNetworkTypeLinks/:id', [restServer.isLoggedIn], function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLink( id ).then( function( np ) {
            restServer.respondJson( res, null, np );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting deviceNetworkTypeLink " + id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Creates a new deviceNetworkTypeLink record.
     * - A user with an admin company can create any deviceNetworkTypeLink
     * - An admin user for the company may create an deviceNetworkTypeLink for
     *   an device for their own company.
     * - Requires a networkTypeId, deviceId, and networkSettings
     *   in the JSON body.
     * - {
     *     "deviceId": 2,
     *     "networkTypeId": 4,
     *     "networkSettings": "{ \"DevEUI\":\"0800003443fe0002\" }",
     *   }
     */
    app.post('/api/deviceNetworkTypeLinks', [restServer.isLoggedIn,
                                         restServer.fetchCompany,
                                         restServer.isAdmin],
                                        function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
            restServer.respond( res, 400, "Cannot specify the deviceNetworkTypeLink's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.deviceId ||
             !rec.deviceProfileId ||
             !rec.networkTypeId ||
             !rec.networkSettings ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // If the user is not a member of the admin company, send the company
        // ID of the user into the query to verify that the device belongs
        // to that company.
        var companyId;
        if ( modelAPI.companies.COMPANY_ADMIN !== req.company.type ) {
            companyId = req.company.id;
        }

        // Do the add.
        modelAPI.deviceNetworkTypeLinks.createDeviceNetworkTypeLink(
                                    rec.deviceId,
                                    rec.networkTypeId,
                                    rec.deviceProfileId,
                                    rec.networkSettings,
                                    companyId ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
            restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
            restServer.respond( res, err );
        });
    });

    /**
     * Updates the deviceNetworkTypeLink record with the specified id.
     * - Can only be called by a user who is part of an admin company or admin
     *   of the company for the device linked.
     * - Can only update networkSettings
     */
    app.put('/api/deviceNetworkTypeLinks/:id', [restServer.isLoggedIn,
                                            restServer.fetchCompany,
                                            restServer.isAdmin],
                                           function(req, res, next) {
        // We're not going to allow changing the device or the network.
        // Neither operation makes much sense.
        if ( req.body.deviceId || req.body.networkTypeId ) {
            restServer.respond( res, 400, "Cannot change link targets" );
            return;
        }

        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the network, as a read is much less expensive
        // than a write, and then we'll be able to tell if anything really
        // changed before we even try to write.
        modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLink( data.id ).then( function( dnl ) {
            // Fields that may exist in the request body that can change.  Make
            // sure they actually differ, though.
            var changed = 0;
            if ( req.body.networkSettings ) {
                if ( req.body.networkSettings != dnl.networkSettings ) {
                    data.networkSettings = req.body.networkSettings;
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
                // If not an admin company, the deviceId better be
                // associated  with the user's company
                var companyId;
                if ( req.company.type !== modelAPI.companies.COMPANY_ADMIN ) {
                     companyId = req.user.companyId;
                }

                // Do the update.
                modelAPI.deviceNetworkTypeLinks.updateDeviceNetworkTypeLink( data, companyId ).then( function ( rec ) {
                    restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting deviceNetworkTypeLink " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Deletes the deviceNetworkTypeLinks record with the specified id.
     * - A user with the admin company or an admin user for the same company can
     *   delete a link.
     */
    app.delete('/api/deviceNetworkTypeLinks/:id', [restServer.isLoggedIn,
                                               restServer.fetchCompany,
                                               restServer.isAdmin],
                                              function(req, res, next) {
        var id = parseInt( req.params.id );
        // If not an admin company, the deviceId better be associated
        // with the user's company
        var companyId;
        if ( req.company.type !== modelAPI.companies.COMPANY_ADMIN ) {
             companyId = req.user.companyId;
        }

        modelAPI.deviceNetworkTypeLinks.deleteDeviceNetworkTypeLink( id, companyId ).then( function( ) {
            restServer.respond( res, 204 );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting deviceNetworkTypeLink " + id + ": " + err );
            restServer.respond( res, err );
        });
    });
}
