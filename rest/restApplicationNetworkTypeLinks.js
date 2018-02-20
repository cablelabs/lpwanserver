var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * ApplicationNetworkTypeLinks API.
     ********************************************************************
    /**
     * Gets the applicationNetworkTypeLinks that are defined
     * - Can be called by any user.
     * - If the request includes a networkTypeId query parameter, the links matching
     *   the networkTypeId are returned.
     * - If the request includes a applicationId query parameter, the links
     *   matching the applicationId are returned.
     */
    app.get('/api/applicationNetworkTypeLinks', [restServer.isLoggedIn,
                                                 restServer.fetchCompany],
                                                function(req, res, next) {
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
        if ( req.query.applicationId ) {
            var applicationIdInt = parseInt( req.query.applicationId );
            if ( !isNaN( applicationIdInt ) ) {
                options.applicationId = applicationIdInt;
            }
        }
        if ( req.query.companyId ) {
            var companyIdInt = parseInt( req.query.companyId );
            if ( !isNaN( companyIdInt ) ) {
                options.companyId = companyIdInt;
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
        modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks( options ).then( function( networkTypes ) {
            restServer.respondJson( res, null, networkTypes );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkTypes: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the applicationNetworkTypeLink record with the specified id.
     * - Can be called by any user
     */
    app.get('/api/applicationNetworkTypeLinks/:id', [restServer.isLoggedIn], function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLink( id ).then( function( np ) {
            restServer.respondJson( res, null, np );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting applicationNetworkTypeLink " + id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Creates a new applicationNetworkTypeLink record.
     * - A user with an admin company can create any applicationNetworkTypeLink
     * - An admin user for the company may create an applicationNetworkTypeLink for
     *   an application for their own company.
     * - Requires a networkTypeId, applicationId, and networkSettings
     *   in the JSON body.
     * - {
     *     "applicationId": 2,
     *     "networkTypeId": 4,
     *     "networkSettings": "{ \"AppEUI\":\"0800003443fe0002\" }",
     *   }
     */
    app.post('/api/applicationNetworkTypeLinks', [restServer.isLoggedIn,
                                                  restServer.fetchCompany,
                                                  restServer.isAdmin],
                                                 function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
            restServer.respond( res, 400, "Cannot specify the applicationNetworkTypeLink's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.applicationId || !rec.networkTypeId || !rec.networkSettings ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // If the user is not a member of the admin company, send the company
        // ID of the user into the query to verify that the application belongs
        // to that company.
        var companyId;
        if ( modelAPI.companies.COMPANY_ADMIN !== req.company.type ) {
            companyId = req.company.id;
        }

        // Do the add.
        modelAPI.applicationNetworkTypeLinks.createApplicationNetworkTypeLink(
                                    rec.applicationId,
                                    rec.networkTypeId,
                                    rec.networkSettings,
                                    companyId ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
            send.remoteAccessLogs = rec.remoteAccessLogs;
            restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
            restServer.respond( res, err );
        });
    });

    /**
     * Updates the applicationNetworkTypeLink record with the specified id.
     * - Can only be called by a user who is part of an admin company or admin
     *   of the company for the application linked.
     * - Can only update networkSettings
     */
    app.put('/api/applicationNetworkTypeLinks/:id', [restServer.isLoggedIn,
                                                     restServer.fetchCompany,
                                                     restServer.isAdmin],
                                                    function(req, res, next) {
        // We're not going to allow changing the application or the network.
        // Neither operation makes much sense.
        if ( req.body.applicationId || req.body.networkTypeId ) {
            restServer.respond( res, 400, "Cannot change link targets" );
            return;
        }

        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the network, as a read is much less expensive
        // than a write, and then we'll be able to tell if anything really
        // changed before we even try to write.
        modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLink( data.id ).then( function( anl ) {
            // Fields that may exist in the request body that can change.  Make
            // sure they actually differ, though.
            var changed = 0;
            if ( req.body.networkSettings ) {
                if ( req.body.networkSettings != anl.networkSettings ) {
                    data.networkSettings = req.body.networkSettings;
                    ++changed;
                }
            }

            // Ready.  Do we have anything to actually change?
            if ( 0 == changed ) {
                // No changes.  But returning 304 apparently causes Apache to strip
                // CORS info, causing the browser to throw a fit.  So just say,
                // "Yeah, we did that.  Really.  Trust us."
                restServer.respond( res, 204 );
            }
            else {
                // If not an admin company, the applicationId better be
                // associated  with the user's company
                var companyId;
                if ( req.company.type !== modelAPI.companies.COMPANY_ADMIN ) {
                     companyId = req.user.companyId;
                }

                // Do the update.
                modelAPI.applicationNetworkTypeLinks.updateApplicationNetworkTypeLink( data, companyId ).then( function ( rec ) {
                    restServer.respond( res, 200, rec.remoteAccessLogs );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting applicationNetworkTypeLink " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Deletes the applicationNetworkTypeLinks record with the specified id.
     * - A user with the admin company or an admin user for the same company can
     *   delete a link.
     */
    app.delete('/api/applicationNetworkTypeLinks/:id', [restServer.isLoggedIn,
                                                        restServer.fetchCompany,
                                                        restServer.isAdmin],
                                                    function(req, res, next) {
        var id = parseInt( req.params.id );
        // If not an admin company, the applicationId better be associated
        // with the user's company.  We check that in the delete method.
        var companyId;
        if( req.company.type !== modelAPI.companies.COMPANY_ADMIN ) {
             companyId = req.user.companyId;
        }

        modelAPI.applicationNetworkTypeLinks.deleteApplicationNetworkTypeLink( id, companyId ).then( function( ret ) {
            restServer.respond( res, 200, ret.remoteAccessLogs );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting applicationNetworkTypeLink " + id + ": " + err );
            restServer.respond( res, err );
        });
    });
}
