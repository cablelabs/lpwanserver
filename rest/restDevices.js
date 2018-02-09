var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
    * Devices API
    ********************************************************************/
    /**
     * Gets the devices available for access by the calling account.
     * - If the caller is with the admin company, they can get all
     *   devices from all companies.  Otherwise they get their own
     *   company's devices only.
     * - If the request includes a limit query parameter, only that number of
     *   entries are returned.
     * - If the request includes an offset query parameter, the first offset
     *   records are skipped in the returned data.
     * - If the request includes a search query parameter, the devices
     *   will be limited to matches of the passed string to the name.  In the
     *   string, use "%" to match 0 or more characters and "_" to match
     *   exactly one.  So to match names starting with "D", use the string
     *   "D%".
     * - If the request has a companyId parameter, only applications from that
     *   company will be returned.  This MUST be the user's company if the user
     *   is not part of an ADMIN company.
     * - If the request has a applicationId parameter, only devices for that
     *   application will be returned.
     * - Any combination of search terms are AND'd together.
     */
    app.get('/api/devices', [restServer.isLoggedIn, restServer.fetchCompany],
                            function(req, res, next) {
        var options = {};
        if ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) {
            // If they gave a applicationId, make sure it belongs to their
            // company.
            if ( req.query.companyId ) {
                if ( req.query.companyId != req.user.companyId ) {
                    respond( res, 403, "Cannot request devices for another company" );
                    return;
                }
            }
            else {
                // Force the search to be limited to the user's company
                options.companyId = req.user.companyId;
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
        if ( req.query.search ) {
            options.search = req.query.search;
        }
        // This may be redundant, but we've already verified that if the
        // user is not part of the admin company, then this is their companyId.
        if ( req.query.companyId ) {
            options.companyId = req.query.companyId;
        }
        if ( req.query.applicationId ) {
            options.applicationId = req.query.applicationId;
        }
        modelAPI.devices.retrieveDevices( options ).then( function( cos ) {
            restServer.respondJson( res, null, cos );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting devices: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the device record with the specified id.
     * - A company user can get their own company's devices only
     * - If the caller is with the admin company, they can get any device
     * - Returned data will include an array of networks that is a list of
     *   networkIds for networks this device is associated with.
     */
    app.get('/api/devices/:id', [restServer.isLoggedIn,
                                 restServer.fetchCompany,
                                 modelAPI.devices.fetchDeviceApplication],
                                     function(req, res, next) {
        // Should have device and application in req due to
        // fetchDeviceApplication
        if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
             ( req.application.companyId != req.user.companyId ) ) {
                restServer.respond( res, 403 );
        }
        else {
            restServer.respondJson( res, null, req.device );
        }
    });

    /**
     * Creates a new device record.
     * - A user with an admin company can create a device for any company.
     * - A company admin can create a device for their own company.
     * - Requires in the json body:
     *   - name
     *   - applicationId
    */
    app.post('/api/devices', [restServer.isLoggedIn,
                              restServer.fetchCompany,
                              restServer.isAdmin,
                              modelAPI.devices.fetchApplicationForNewDevice],
                             function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
             restServer.respond( res, 400, "Cannot specify the devices's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name || !rec.applicationId || !rec.deviceModel ) {
             restServer.respond( res, 400, "Missing required data" );
        }

        // The user must be part of the admin group or the device's
        // application's company.
        if ( ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) &&
             ( req.application.companyId != req.user.companyId ) ) {
            restServer.respond( res, 403, "Can't create a device for another company's application" );
        }
        else {
            // OK, add it.
            modelAPI.devices.createDevice( rec.name,
                                           rec.applicationId,
                                           rec.deviceModel ).then( function ( rec ) {
                var send = {};
                send.id = rec.id;
                restServer.respondJson( res, 200, send );
            })
            .catch( function( err ) {
                appLogger.log( "Failed to create device " + JSON.stringify( rec ) + ": " + err );
                restServer.respondJson( res, err );
            });
        }
    });

    /**
     * Updates the device record with the specified id.
     * - The company Admin can update the device.
     * - If the caller is with the admin company, they can update any company.
     * - Only the name,
     */
    app.put('/api/devices/:id', [restServer.isLoggedIn,
                                 restServer.fetchCompany,
                                 restServer.isAdmin,
                                 modelAPI.devices.fetchDeviceApplication],
                                     function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start with the device retrieved by fetchDeviceApplication as
        // a basis for comparison.
        // Verify that the user can make the change.
        if ( ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) &&
             ( req.user.companyId != req.application.companyId ) ) {
            respond( res, 403 );
            return;
        }

        var changed = 0;
        if ( ( req.body.name ) &&
             ( req.body.name != req.device.name ) ) {
            data.name = req.body.name;
            ++changed;
        }

        // NOTE: ALL OTHER FIELD CHECKS MUST OCCUR BEFORE THIS CODE.
        // Can only change the applicationId if an admin user, and the
        // new applicationId is part of the same company.
        if ( ( req.body.applicationId ) &&
             ( req.body.applicationId != req.device.applicationId ) ) {
            data.applicationId = req.body.applicationId;
            ++changed;

            // If this is not a user with an admin company, we have to make sure
            // that the company doesn't change with the application.
            if ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) {
                // The new application must also be part of the same company.
                modelAPI.applications.retrieveApplication( req.body.applicationId )
                .then( function( newApp ) {
                    if ( newApp.companyId != req.application.id ) {
                        respond( res, 400, "Cannot change device's application to another company's application" );
                    }
                    else {
                        // Do the update.
                        modelAPI.devices.updateDevice( data ).then( function ( rec ) {
                             restServer.respond( res, 204 );
                        })
                        .catch( function( err ) {
                             restServer.respond( res, err );
                        });
                    }
                    return;
                })
                .catch( function( err ) {
                     restServer.respond( res, err );
                     return;
                });
            }
        }

        // Do we have a change?
        if ( 0 == changed ) {
            // No changes.  But returning 304 apparently causes Apache to strip
            // CORS info, causing the browser to throw a fit.  So just say,
            // "Yeah, we did that.  Really.  Trust us."
            restServer.respond( res, 204 );
        }
        else {
            // Do the update.
            modelAPI.devices.updateDevice( data ).then( function ( rec ) {
                 restServer.respond( res, 204 );
            })
            .catch( function( err ) {
                 restServer.respond( res, err );
            });
        }
    });

    /**
     * Deletes the device record with the specified id.
     * - Only a user with the admin company or the admin of the device's
     *   company can delete an device.
     */
    app.delete('/api/devices/:id', [restServer.isLoggedIn,
                                    restServer.fetchCompany,
                                    restServer.isAdmin,
                                    modelAPI.devices.fetchDeviceApplication],
                                        function(req, res, next) {
        var id = parseInt( req.params.id );
        // If the caller is a global admin, or the device is part of the company
        // admin's company, we can delete.
        if ( ( req.company.type === modelAPI.companies.COMPANY_ADMIN ) ||
             ( req.application.companyId === req.user.companyId ) ) {
            modelAPI.devices.deleteDevice( id ).then( function( ) {
                restServer.respond( res, 204 );
             })
             .catch( function( err ) {
                 appLogger.log( "Error deleting device " + id + ": " + err );
                 restServer.respond( res, err );
             });
        }
        // Device is owned by another company.
        else {
            appLogger.log( "Someone else's device" );
            restServer.respond( res, 403, "Cannot delete another company's device.");
        }
    });
}
