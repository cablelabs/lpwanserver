var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
    * Applications API
    ********************************************************************/
    /**
     * Gets the applications available for access by the calling account.
     * - If the caller is with the admin company, they can get all
     *   applications from all companies.  Otherwise they get their own
     *   company's applications only.
     * - If the request includes a limit query parameter, only that number of
     *   entries are returned.
     * - If the request includes an offset query parameter, the first offset
     *   records are skipped in the returned data.
     * - If the request includes a search query parameter, the applications
     *   will be limited to matches of the passed string to the name.  In the
     *   string, use "%" to match 0 or more characters and "_" to match
     *   exactly one.  So to match names starting with "D", use the string
     *   "D%".
     * - If the request has a companyId parameter, only applications from that
     *   company will be returned.  This MUST be the user's company if the user
     *   is not part of an ADMIN company.
     * - If the request has a reportingProtocolId, then the applications using
     *   the specified protocol will be returned.
     * - Any combination of search terms are AND'd together.
     */
    app.get('/api/applications', [restServer.isLoggedIn,
                                  restServer.fetchCompany],
                                 function(req, res, next) {
        var options = {};
        if ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) {
            // If they gave a companyId, make sure it's their own.
            if ( req.query.companyId ) {
                if ( req.query.companyId != req.user.companyId ) {
                    respond( res, 403, "Cannot request applications for another company" );
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
        if ( req.query.reportingProtocolId ) {
            options.reportingProtocolId = req.query.reportingProtocolId;
        }
        modelAPI.applications.retrieveApplications( options ).then( function( cos ) {
            restServer.respondJson( res, null, cos );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting applications: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the application record with the specified id.
     * - A company user can get their own company's applications only
     * - If the caller is with the admin company, they can get any application
     * - Returned data will include an array of networks that is a list of
     *   networkIds for networks this application is associated with.
     */
    app.get('/api/applications/:id', [restServer.isLoggedIn,
                                      restServer.fetchCompany],
                                     function(req, res, next) {
        var id = req.params.id;
        modelAPI.applications.retrieveApplication( parseInt( req.params.id ) ).then( function( app ) {
            if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
                 ( app.companyId != req.user.companyId ) ) {
                restServer.respond( res, 403 );
            }
            else {
                restServer.respondJson( res, null, app );
            }
         })
         .catch( function( err ) {
             appLogger.log( "Error getting application " + req.params.id + ": " + err );
              restServer.respond( res, err );
         });
    });

    /**
     * Creates a new application record.
     * - A user with an admin company can create an application for any company.
     * - A company admin can create an application for their own company.
     * - Requires in the json body:
     *   - name
     *   - companyId
     *   - reportProtocolId
     *   - baseUrl (for the reporting Protocol)
     */
    app.post('/api/applications', [restServer.isLoggedIn,
                                   restServer.fetchCompany,
                                   restServer.isAdmin],
                                  function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
             restServer.respond( res, 400, "Cannot specify the applocation's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name || !rec.companyId || !rec.reportingProtocolId || !rec.baseUrl ) {
             restServer.respond( res, 400, "Missing required data" );
             return;
        }

        // The user must be part of the admin group or the target company.
        if ( ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) &&
            ( req.user.companyId != rec.companyId ) ) {
             restServer.respond( res, 403 );
             return;
        }

        // Do the add.
        modelAPI.applications.createApplication( rec.name,
                                                   rec.companyId,
                                                   rec.reportingProtocolId,
                                                   rec.baseUrl ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
            restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
            restServer.respond( res, err );
        });
    });

    /**
     * Updates the application record with the specified id.
     * - The company Admin can update the application.
     * - If the caller is with the admin company, they can update any company.
     * - Only the name,
     */
    app.put('/api/applications/:id', [restServer.isLoggedIn,
                                      restServer.fetchCompany,
                                      restServer.isAdmin],
                                     function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the application, as a read is much less
        // expensive than a write, and then we'll be able to tell if anything
        // really changed before we even try to write.
        modelAPI.applications.retrieveApplication( req.params.id ).then( function( app ) {
            // Verify that the user can make the change.
            if ( ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) &&
                 ( req.user.companyId != app.companyId ) ) {
                restServer.respond( res, 403 );
                return;
            }

            var changed = 0;
            if ( ( req.body.name ) &&
                 ( req.body.name != app.name ) ) {
                data.name = req.body.name;
                ++changed;
            }

            // Can only change the companyId if an admin user.
            if ( ( req.body.companyId ) &&
                 ( req.body.companyId != app.companyId ) &&
                 ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) ) {
                restServer.respond( res, 400, "Cannot change application's company" );
                return;
            }

            if ( ( req.body.companyId ) &&
                 ( req.body.companyId != app.companyId ) ) {
                data.companyId = req.body.companyId;
                ++changed;
            }
            if ( ( req.body.reportingrotocolId ) &&
                 ( req.body.reportingrotocolId != app.reportingrotocolId ) ) {
                data.reportingrotocolId = req.body.reportingrotocolId;
                ++changed;
            }
            if ( ( req.body.baseUrl ) &&
                 ( req.body.baseUrl != app.baseUrl ) ) {
                data.baseUrl = req.body.baseUrl;
                ++changed;
            }
            if ( 0 == changed ) {
                // No changes.  But returning 304 apparently causes Apache to strip
                // CORS info, causing the browser to throw a fit.  So just say,
                // "Yeah, we did that.  Really.  Trust us."
                restServer.respond( res, 204 );
            }
            else {
                // Do the update.
                modelAPI.applications.updateApplication( data ).then( function ( rec ) {
                     restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                     restServer.respond( res, err );
                });
            }

         })
         .catch( function( err ) {
             appLogger.log( "Error getting application " + req.body.name + ": " + err );
              restServer.respond( res, err );
         });
    });

    /**
     * Deletes the application record with the specified id.
     * - Only a user with the admin company or the admin of the application's
     *   company can delete an application.
     */
    app.delete('/api/applications/:id', [restServer.isLoggedIn,
                                         restServer.fetchCompany,
                                         restServer.isAdmin],
                                        function(req, res, next) {
        var id = parseInt( req.params.id );
        // If the caller is a global admin, we can just delete.
        if ( req.company.type === modelAPI.companies.COMPANY_ADMIN ) {
            modelAPI.applications.deleteApplication( id ).then( function( ) {
                 restServer.respond( res, 204 );
             })
             .catch( function( err ) {
                 appLogger.log( "Error deleting application " + id + ": " + err );
                  restServer.respond( res, err );
             });
        }
        // Company admin
        else {
            modelAPI.applications.retrieveApplication( req.params.id ).then( function( app ) {
                // Verify that the user can delete.
                if ( req.user.companyId != app.companyId ) {
                    restServer.respond( res, 403 );
                    return;
                }
                modelAPI.applications.deleteApplication( id ).then( function( ) {
                     restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                    appLogger.log( "Error deleting application " + id + ": " + err );
                    restServer.respond( res, err );
                });
            })
            .catch( function( err ) {
                appLogger.log( "Error finding application " + id + " to delete: " + err );
                restServer.respond( res, err );
            });
        }
    });

    /**
     * Starts serving the data from the networks to the application server
     * listed in the reportingProtocol record for the application.
     * - Only a user with the admin company or the admin of the application's
     *   company can start an application.
     * Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
     */
    app.post('/api/applications/:id/start', [restServer.isLoggedIn,
                                             restServer.fetchCompany,
                                             restServer.isAdmin],
                                            function(req, res, next) {
        var id = parseInt( req.params.id );
        // If the caller is a global admin, we can just start.
        if ( req.company.type === modelAPI.companies.COMPANY_ADMIN ) {
            modelAPI.applications.startApplication( id ).then( function( logs ) {
                 restServer.respond( res, 200, logs.remoteAccessLogs );
             })
             .catch( function( err ) {
                 appLogger.log( "Error starting application " + id + ": " + err );
                  restServer.respond( res, err );
             });
        }
        // Company admin
        else {
            modelAPI.applications.retrieveApplication( req.params.id ).then( function( app ) {
                // Verify that the user can start.
                if ( req.user.companyId != app.companyId ) {
                    respond( res, 403 );
                    return;
                }
                modelAPI.applications.startApplication( id ).then( function( logs ) {
                     restServer.respond( res, 200, logs.remoteAccessLogs );
                })
                .catch( function( err ) {
                    appLogger.log( "Error starting application " + id + ": " + err );
                    restServer.respond( res, err );
                });
            })
            .catch( function( err ) {
                appLogger.log( "Error finding application " + id + " to start: " + err );
                restServer.respond( res, err );
            });
        }
    });


    /**
     * Stops serving the data from the networks to the application server
     * listed in the reportingProtocol record for the application.
     * - Only a user with the admin company or the admin of the application's
     *   company can stop an application.
     * Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
     */
    app.post('/api/applications/:id/stop', [restServer.isLoggedIn,
                                            restServer.fetchCompany,
                                            restServer.isAdmin],
                                           function(req, res, next) {
        var id = parseInt( req.params.id );
        // If the caller is a global admin, we can just stop.
        if ( req.company.type === modelAPI.companies.COMPANY_ADMIN ) {
            modelAPI.applications.stopApplication( id ).then( function( logs ) {
                 restServer.respond( res, 200, logs.remoteAccessLogs );
             })
             .catch( function( err ) {
                 appLogger.log( "Error stopping application " + id + ": " + err );
                 restServer.respond( res, err );
             });
        }
        // Company admin
        else {
            modelAPI.applications.retrieveApplication( req.params.id ).then( function( app ) {
                // Verify that the user can stop this app.
                if ( req.user.companyId != app.companyId ) {
                    respond( res, 403 );
                    return;
                }

                modelAPI.applications.stopApplication( id ).then( function( logs ) {
                     restServer.respond( res, 200, logs.remoteAccessLogs );
                })
                .catch( function( err ) {
                    appLogger.log( "Error stopping application " + id + ": " + err );
                    restServer.respond( res, err );
                });
            })
            .catch( function( err ) {
                appLogger.log( "Error finding application " + id + " to start: " + err );
                restServer.respond( res, err );
            });
        }
    });

    /**
     * Tests serving the data as if it came from a network.
     * Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
     */
    app.post('/api/applications/:id/test', function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.applications.testApplication( id, req.body ).then( function( logs ) {
            restServer.respond( res, 200 );
        })
        .catch( function( err ) {
            appLogger.log( "Error testing application " + id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Accepts the data from the remote networks to pass to the reporting
     * protocol on behalf of the application.
     * - Any caller can pass data to this method.  We don't require them to be
     *   logged in.  We will reject messages for unknown applicationIds and/or
     *   networkIds with a generic 404.
     */
    app.post('/api/ingest/:applicationId/:networkId', function(req, res, next) {
        var applicationId = parseInt( req.params.applicationId );
        var networkId = parseInt( req.params.networkId );
        var data = req.body;
        modelAPI.applications.passDataToApplication( applicationId, networkId, data ).then( function( ) {
                 restServer.respond( res, 200 );
        })
        .catch( function( err ) {
            appLogger.log( "Error passing data from network " + networkId +
                           " to application " + applicationId + ": " + err );
            restServer.respond( res, err );
        });
    });

    // Now that the API is initialized, start the known apps.
    modelAPI.applications.startApplications()
    .then( () => appLogger.log( "Applications Started." ) )
    .catch( ( err ) => appLogger.log( "Applications Startup Failed: " + err ) );
}
