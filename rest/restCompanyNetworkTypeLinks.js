var appLogger = require( "./lib/appLogger.js" );

var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * CompanyNetworkTypeLinks API.
     ********************************************************************
    /**
     * Gets the companyNetworkTypeLinks that are defined
     * - Can be called by any user.
     * - If the request includes a networkTypeId query parameter, the links matching
     *   the networkTypeId are returned.
     * - If the request includes a companyId query parameter, the links matching
     *   the companyId are returned.
     */
    app.get('/api/companyNetworkTypeLinks', [ restServer.isLoggedIn,
                                              restServer.fetchCompany ],
                                            function(req, res, next) {
        var options = {};
        // Limit by company, too, if not a system admin.
        if ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) {
            options.companyId = req.company.id;
        }
        else if ( req.query.companyId ) {
            // Global admin can request from any company.
            var companyIdInt = parseInt( req.query.companyId );
            if ( !isNaN( companyIdInt ) ) {
                options.companyId = companyIdInt;
            }
        }
        if ( req.query.networkTypeId ) {
            var networkTypeIdInt = parseInt( req.query.networkTypeId );
            if ( !isNaN( networkTypeIdInt ) ) {
                options.networkTypeId = networkTypeIdInt;
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
        modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLinks( options ).then( function( networkTypes ) {
            restServer.respondJson( res, null, networkTypes );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkTypes: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the companyNetworkTypeLink record with the specified id.
     * - Can be called by any user
     */
    app.get('/api/companyNetworkTypeLinks/:id', [restServer.isLoggedIn],
                                            function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLink( id ).then( function( np ) {
            restServer.respondJson( res, null, np );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting companyNetworkTypeLink " + id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Creates a new companyNetworkTypeLink record.
     * - A user with an admin company can create a companyNetworkTypeLink, but must
     *   specify the companyId in the body.
     * - An admin user for the company may create a companyNetworkTypeLink for their
     *   own company.  No companyId is required, but if supplied, it must be the
     *   id of their own company.
     * - Requires a networkTypeId, and networkSettings
     *   in the JSON body.
     * - {
     *     "companyId": 2,
     *     "networkTypeId": 4,
     *     "networkSettings": "{ \"user\":\"fred\", \"password\":\"farkle\" }",
     *   }
     */
    app.post('/api/companyNetworkTypeLinks', [restServer.isLoggedIn,
                                          restServer.fetchCompany,
                                          restServer.isAdmin],
                                         function(req, res, next) {
        var rec = req.body;

        // If the user is part of the admin group and does not have a companyId
        // specified.
        if ( ( modelAPI.companies.COMPANY_ADMIN === req.company.type ) &&
             ( !rec.companyId ) ) {
            restServer.respond( res, 400, "Must have companyId when part of admin company" );
            return;
        }

        // If the user is a not company admin, and is specifying another
        // company.
        if ( ( modelAPI.companies.COMPANY_ADMIN !== req.company.type ) &&
             rec.companyId &&
             ( rec.companyId != req.user.companyId ) ) {
            restServer.respond( res, 403, "Cannot specify another company's networks" );
            return;
        }

        if ( !rec.companyId ) {
            rec.companyId = req.user.companyId;
        }

        // You can't specify an id.
        if ( rec.id ) {
            restServer.respond( res, 400, "Cannot specify the companyNetworkTypeLink's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.companyId || !rec.networkTypeId ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // Do the add.
        modelAPI.companyNetworkTypeLinks.createCompanyNetworkTypeLink(
                                    rec.companyId,
                                    rec.networkTypeId,
                                    rec.networkSettings ).then( function ( rec ) {
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
     * Updates the companyNetworkTypeLink record with the specified id.
     * - Can only be called by a user who is part of an admin company or admin
     *   of the company linked.
     */
    app.put('/api/companyNetworkTypeLinks/:id', [restServer.isLoggedIn,
                                                 restServer.fetchCompany,
                                                 restServer.isAdmin],
                                                function(req, res, next) {
        // We're not going to allow changing the company or the network.
        // Neither operation makes much sense.
        if ( req.body.companyId || req.body.networkTypeId ) {
            restServer.respond( res, 400, "Cannot change link targets" );
            return;
        }

        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the network, as a read is much less expensive
        // than a write, and then we'll be able to tell if anything really
        // changed before we even try to write.
        modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLink( data.id ).then( function( cnl ) {
            // If not an admin company, the companyId better match the user's
            // companyId.
            if ( ( req.company.type !== modelAPI.companies.COMPANY_ADMIN ) &&
                 ( cnl.companyId !== req.user.companyId ) ) {
                restServer.respond( res, 403, "Cannot change another company's record." );
                return;
            }

            // Fields that may exist in the request body that can change.  Make
            // sure they actually differ, though.
            var changed = 0;
            if ( req.body.networkSettings ) {
                if ( req.body.networkSettings != cnl.networkSettings ) {
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
                // Do the update.
                modelAPI.companyNetworkTypeLinks.updateCompanyNetworkTypeLink( data ).then( function ( rec ) {
                    restServer.respond( res, 200, rec.remoteAccessLogs );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting companyNetworkTypeLink " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Deletes the companyNetworkTypeLinks record with the specified id.
     * - A user with the admin company or an admin user for the same company can
     *   delete a link.
     */
    app.delete('/api/companyNetworkTypeLinks/:id', [restServer.isLoggedIn,
                                                restServer.fetchCompany,
                                                restServer.isAdmin],
                                               function(req, res, next) {
        var id = parseInt( req.params.id );
        // If the caller is a global admin, we can just delete.
        if ( req.company.type === modelAPI.companies.COMPANY_ADMIN ) {
            modelAPI.companyNetworkTypeLinks.deleteCompanyNetworkTypeLink( id ).then( function( ret ) {
                restServer.respond( res, 200, ret.remoteAccessLogs );
             })
             .catch( function( err ) {
                appLogger.log( "Error deleting companyNetworkTypeLink " + id + ": " + err );
                restServer.respond( res, err );
             });
        }
        else {
            // We'll need to read first to make sure the record is for the
            // company the company admin is part of.
            modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLink( id ).then( function( cnl ) {
                if ( req.company.id != cnl.companyId ) {
                     restServer.respond( res, 400, "Unauthorized to delete record" );
                }
                else {
                    // OK to do the  delete.
                    modelAPI.companyNetworkTypeLinks.deleteCompanyNetworkTypeLink( id ).then( function( ret ) {
                        restServer.respond( res, 200, ret.remoteAccessLogs );
                     })
                     .catch( function( err ) {
                        appLogger.log( "Error deleting companyNetworkTypeLink " + id + ": " + err );
                        restServer.respond( res, err );
                     });
                }
            })
            .catch( function( err ) {
                 restServer.respond( res, err );
            });
        }
    });

    /**
     * Pushes the companyNetworkTypeLinks record with the specified id.
     * - Only a user with the admin company or the admin of the device's
     *   company can delete an device. TODO: Is this true?
     */
    app.post('/api/companyNetworkTypeLinks/:id/push', [restServer.isLoggedIn,
            restServer.fetchCompany,
            restServer.isAdmin],
        function(req, res, next) {
            var id = parseInt( req.params.id );
            // If the caller is a global admin, or the device is part of the company
            // admin's company, we can push.
            modelAPI.companyNetworkTypeLinks.pushCompanyNetworkTypeLink( id, req.company.id ).then( function( ) {
                restServer.respond( res, 204 );
            }).catch( function( err ) {
                appLogger.log( "Error pushing companyNetworkTypeLinks " + id + ": " + err );
                restServer.respond( res, err );
            });
        });

}
