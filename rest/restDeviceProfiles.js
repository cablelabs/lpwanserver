var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
    * DeviceProfiles API
    ********************************************************************/
    /**
     * Gets the deviceProfiles available for access by the calling account.
     * - If the caller is with the admin company, they can get all
     *   deviceProfiles from all companies.  Otherwise they get their own
     *   company's deviceProfiles only.
     * - If the request includes a limit query parameter, only that number of
     *   entries are returned.
     * - If the request includes an offset query parameter, the first offset
     *   records are skipped in the returned data.
     * - If the request includes a search query parameter, the deviceProfiles
     *   will be limited to matches of the passed string to the name.  In the
     *   string, use "%" to match 0 or more characters and "_" to match
     *   exactly one.  So to match names starting with "D", use the string
     *   "D%".
     * - If the request has a companyId parameter, only deviceProfiles from
     *   that company will be returned.  This MUST be the user's company if
     *   the user is not part of an ADMIN company.
     * - If the request has a networkTypeId parameter, only deviceProfiles for
     *   that networkType will be returned.
     * - Any combination of search terms are AND'd together.
     */
    app.get('/api/deviceProfiles', [ restServer.isLoggedIn,
                                     restServer.fetchCompany ],
                                   function(req, res, next) {
        var options = {};
        // Make sure the caller is admin or part of the company.
        if ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) {
            if ( req.query.companyId ) {
                var coidInt = parseInt( req.query.companyId );
                if ( !isNaN( coidInt ) ) {
                    if ( coidInt !== req.user.companyId ) {
                        restServer.respond( res, 403, "Cannot request deviceProfiles for another company" );
                        return;
                    }
                    else {
                        // Pass the restriction along
                        options.companyId = coidInt;
                    }
                }
                else {
                    restServer.respond( res, 403, "Bad companyId in query" );
                    return;
                }
            }
            else {
                // Force the search to be limited to the user's company anyway.
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
        if ( req.query.networkTypeId ) {
            options.networkTypeId = req.query.networkTypeId;
        }

        modelAPI.deviceProfiles.retrieveDeviceProfiles( options ).then( function( dps ) {
            restServer.respondJson( res, null, dps );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting deviceProfiles: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the deviceProfile record with the specified id.
     * - A company user can get their own company's deviceProfiles only
     * - If the caller is with the admin company, they can get any
     * - deviceProfile
     */
    app.get('/api/deviceProfiles/:id', [ restServer.isLoggedIn,
                                         restServer.fetchCompany ],
                                       function(req, res, next) {
        // Need the device record to see if it's OK to return for non-admin
        // user.  (Admin user can get all, so we need to do this anyway.)
        var id = parseInt( req.params.id );
        modelAPI.deviceProfiles.retrieveDeviceProfile( id ).then( function( dp ) {
            if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
                 ( dp.companyId != req.user.companyId ) ) {
                restServer.respond( res, 403 );
            }
            else {
                restServer.respondJson( res, null, dp );
            }
        })
        .catch( function( err ) {
                restServer.respondJson( res, err );
        });
    });

    /**
     * Creates a new deviceProfile record.
     * - A user with an admin company can create a deviceProfile for any
     *   company.
     * - A company admin can create a deviceProfile for their own company.
     * - Requires in the json body:
     *   - name
     *   - companyId
     *   - networkTypeId
     *   - networkSettings - a json string for the custom settings that are
     *                       needed/useful for the networkType.
     */
    app.post('/api/deviceProfiles', [ restServer.isLoggedIn,
                                      restServer.fetchCompany,
                                      restServer.isAdmin ],
                                    function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
             restServer.respond( res, 400, "Cannot specify the deviceProfiles's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name ||
             !rec.networkTypeId ||
             !rec.companyId ||
             !rec.networkSettings ) {
             restServer.respond( res, 400, "Missing required data" );
             return;
        }

        // The user must be part of the admin group or the deviceProfile's
        // company.
        if ( ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) &&
             ( rec.companyId != req.user.companyId ) ) {
            restServer.respond( res, 403, "Can't create a deviceProfile for another company's application" );
        }
        else {
            // OK, add it.
            modelAPI.deviceProfiles.createDeviceProfile(
                                            rec.networkTypeId,
                                            rec.companyId,
                                            rec.name,
                                            rec.networkSettings ).then( function ( rec ) {
                var send = {};
                send.id = rec.id;
                send.remoteAccessLogs = rec.remoteAccessLogs;
                restServer.respondJson( res, 200, send );
            })
            .catch( function( err ) {
                appLogger.log( "Failed to create deviceProfile " + JSON.stringify( rec ) + ": " + err );
                restServer.respondJson( res, err );
            });
        }
    });

    /**
     * Updates the deviceProfile record with the specified id.
     * - The company Admin can update the deviceProfile.
     * - If the caller is with the admin company, they can update any company.
     * - Only the name,
     */
    app.put('/api/deviceProfiles/:id', [restServer.isLoggedIn,
                                        restServer.fetchCompany,
                                        restServer.isAdmin],
                                       function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // Start by getting the original deviceProfile to check for changes.
        modelAPI.deviceProfiles.retrieveDeviceProfile( data.id ).then( function( dp ) {
            // Verify that the user can make the change.
            if ( ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) &&
                 ( req.user.companyId != dp.companyId ) ) {
                respond( res, 403 );
                return;
            }

            var changed = 0;
            if ( ( req.body.name ) &&
                 ( req.body.name != dp.name ) ) {
                data.name = req.body.name;
                ++changed;
            }

            if ( ( req.body.networkTypeId ) &&
                 ( req.body.networkTypeId != dp.networkTypeId ) ) {
                data.networkTypeId = req.body.networkTypeId;
                ++changed;
            }

            if ( ( req.body.companyId ) &&
                 ( req.body.companyId != dp.companyId ) ) {
                data.companyId = req.body.companyId;
                ++changed;
            }

            if ( ( req.body.networkSettings ) &&
                 ( req.body.networkSettings != dp.networkSettings ) ) {
                data.networkSettings = req.body.networkSettings;
                ++changed;
            }


            // Do we have a change?
            if ( 0 == changed ) {
                // No changes.  But returning 304 apparently causes Apache to
                // strip CORS info, causing the browser to throw a fit.  So
                // just say, "Yeah, we did that.  Really.  Trust us."
                restServer.respond( res, 204 );
            }
            else {
                // Do the update.
                modelAPI.deviceProfiles.updateDeviceProfile( data ).then( function ( rec ) {
                     restServer.respondJson( res, 204,  { remoteAccessLogs: rec.remoteAccessLogs } );
                })
                .catch( function( err ) {
                    appLogger.log( "Failed to update deviceProfile " + data.id + " with " + JSON.stringify( data ) + ": " + err );
                     restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Failed to retrieve deviceProfile " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Deletes the deviceProfile record with the specified id.
     * - Only a user with the admin company or the admin of the deviceProfile's
     *   company can delete an deviceProfile.
     */
    app.delete('/api/deviceProfiles/:id', [ restServer.isLoggedIn,
                                            restServer.fetchCompany,
                                            restServer.isAdmin ],
                                        function(req, res, next) {
        var id = parseInt( req.params.id );
        // If not an admin company, the deviceProfile better be associated
        // with the user's company.  We check that in the delete method.
        var companyId = null;
        if( req.company.type !== modelAPI.companies.COMPANY_ADMIN ) {
             companyId = req.user.companyId;
        }

        modelAPI.deviceProfiles.deleteDeviceProfile( id, companyId ).then( function( ret ) {
            restServer.respondJson( res, 200,  { remoteAccessLogs: ret.remoteAccessLogs } );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting deviceProfile " + id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Pushes the device profile record with the specified id.
     * - Only a user with the admin company or the admin of the device's
     *   company can delete an device. TODO: Is this true?
     */
    app.post('/api/deviceProfiles/:id/push', [restServer.isLoggedIn,
            restServer.fetchCompany,
            restServer.isAdmin],
        function(req, res, next) {
            var id = parseInt( req.params.id );
            // If not an admin company, the deviceProfile better be associated
            // with the user's company.  We check that in the push method.
            var companyId = null;
            if( req.company.type !== modelAPI.companies.COMPANY_ADMIN ) {
                companyId = req.user.companyId;
            }

            modelAPI.deviceProfiles.pushDeviceProfile( id, companyId ).then( function( ret ) {
                restServer.respond( res, 204 );
            })
                .catch( function( err ) {
                    appLogger.log( "Error pushing deviceProfile " + id + ": " + err );
                    restServer.respond( res, err );
                });
        });
}
