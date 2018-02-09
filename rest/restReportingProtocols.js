var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * ReportingProtocols API.
     ********************************************************************
    /**
     * Gets the reportingProtocols available
     * - Can be called by any user.
     */
    app.get('/api/reportingProtocols', [restServer.isLoggedIn], function(req, res, next) {
        modelAPI.reportingProtocols.retrieveReportingProtocols().then( function( rps ) {
            restServer.respondJson( res, null, rps );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting reportingProtocols: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Gets the reportingProtocol record with the specified id.
     * - Can be called by any user
     */
    app.get('/api/reportingProtocols/:id', [restServer.isLoggedIn], function(req, res, next) {
        var id = req.params.id;
        modelAPI.reportingProtocols.retrieveReportingProtocol( parseInt( req.params.id ) ).then( function( rp ) {
            restServer.respondJson( res, null, rp );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting reportingProtocol " + req.params.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Creates a new reportingProtocols record.
     * - A user with an admin company can create a reportingProtocol.
     * - Requires a name, and a protocolHandler.  The name is the name
     *   of the protocol type, such as "POST".  The protocolHandler is the name
     *   of the file in the reportingHandlers directory that supports the
     *   handler interface.
     *   in the JSON body.
     * - {
     *     "name": "POST",
     *     "protocolHandler": "httpPostHandler.js"
     *   }
     */
    app.post('/api/reportingProtocols', [restServer.isLoggedIn,
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
        if ( !rec.name || !rec.protocolHandler ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // Do the add.
        modelAPI.reportingProtocols.createReportingProtocol(
                                    rec.name,
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
     * Updates the reportingProtocol record with the specified id.
     * - Can only be called by a user who is part of an admin company.
     */
    app.put('/api/reportingProtocols/:id', [restServer.isLoggedIn,
                                            restServer.fetchCompany,
                                            restServer.isAdminCompany],
                                           function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the company, as a read is much less expensive than
        // a write, and then we'll be able to tell if anything really changed before
        // we even try to write.
        modelAPI.reportingProtocols.retrieveReportingProtocol( req.params.id ).then( function( rp ) {
            // Fields that may exist in the request body that can change.  Make
            // sure they actually differ, though.
            var changed = 0;
            if ( ( req.body.name ) &&
                 ( req.body.name != rp.name ) ) {
                data.name = req.body.name;
                ++changed;
            }
            if ( req.body.protocolHandler ) {
                if ( req.body.protocolHandler != rp.protocolHandler ) {
                    data.protocolHandler = req.body.protocolHandler;
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
                modelAPI.reportingProtocols.updateReportingProtocol( data ).then( function ( rec ) {
                    restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting reportingProtocol " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * Deletes the reportingProtocol record with the specified id.
     * - Only a user with the admin company can delete a reportingProtocol.
     */
    app.delete('/api/reportingProtocols/:id', [restServer.isLoggedIn,
                                               restServer.fetchCompany,
                                               restServer.isAdminCompany],
                                              function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.reportingProtocols.deleteReportingProtocol( id ).then( function( ) {
            restServer.respond( res, 204 );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting reportingProtocol " + id + ": " + err );
            restServer.respond( res, err );
        });
    });
}
