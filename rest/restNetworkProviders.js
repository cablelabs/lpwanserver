var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * NetworkProviders API.
     ********************************************************************
    /**
     * Gets the networkProviders available
     *
     * @api {get} /api/networkProviders Get Network Providers
     * @apiGroup Network Providers
     * @apiDescription Returns an array of the Network Providers that
     *      match the options.
     * @apiPermission All logged-in users.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Query Parameters) {Number} [limit] The maximum number of
     *      records to return.  Use with offset to manage paging.  0 is the
     *      same as unspecified, returning all users that match other query
     *      parameters.
     * @apiParam (Query Parameters) {Number} [offset] The offset into the
     *      returned database query set.  Use with limit to manage paging.  0 is
     *      the same as unspecified, returning the list from the beginning.
     * @apiParam (Query Parameters) {String} [search] Search the Network
     *      Providers based on name matches to the passed string.  In the
     *      string, use "%" to match 0 or more characters and "_" to match
     *      exactly one.  For example, to match names starting with "D", use
     *      the string "D%".
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Network Providers
     *      records.
     * @apiSuccess {Number} object.records.id The Network Provider's Id
     * @apiSuccess {String} object.records.name The name of the Network Provider
     * @apiVersion 0.1.0
     */
    app.get('/api/networkProviders', [restServer.isLoggedIn], function(req, res, next) {
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
        modelAPI.networkProviders.retrieveNetworkProviders( options ).then( function( nps ) {
            restServer.respondJson( res, null, nps );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkProviders: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * @apiDescription Gets the Network Provider record with the specified id.
     *
     * @api {get} /api/networkProviders/:id Get Network Provider
     * @apiGroup Network Providers
     * @apiPermission Any logged-in user.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Network Provider's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.id The Network Provider's Id
     * @apiSuccess {String} object.name The name of the Network Provider
     * @apiVersion 0.1.0
     */
    app.get('/api/networkProviders/:id', [restServer.isLoggedIn],
                                     function(req, res, next) {
        var id = req.params.id;
        modelAPI.networkProviders.retrieveNetworkProvider( parseInt( req.params.id ) ).then( function( rp ) {
            restServer.respondJson( res, null, rp );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkProvider " + req.params.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * @apiDescription Creates a new networkProviders record.
     *
     * @api {post} /api/networkProviders Create Network Provider
     * @apiGroup Network Providers
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {String} name The Network Provider's name
     * @apiExample {json} Example body:
     *      {
     *          "name": "Kyrio"
     *      }
     * @apiSuccess {Number} id The new Network Provider's id.
     */
    app.post('/api/networkProviders', [restServer.isLoggedIn,
                                       restServer.fetchCompany,
                                       restServer.isAdminCompany],
                                      function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
            restServer.respond( res, 400, "Cannot specify the networkProvider's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // Do the add.
        modelAPI.networkProviders.createNetworkProvider( rec.name ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
            restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
            restServer.respond( res, err );
        });
    });

    /**
     * @apiDescription Updates the Network Provider record with the specified
     *      id.
     *
     * @api {put} /api/networkProviders/:id Update Network Provider
     * @apiGroup Network Providers
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Network Provider's id
     * @apiParam (Request Body) {String} name The Network Provider's name
     * @apiExample {json} Example body:
     *      {
     *          "name": "CableLabs"
     *      }
     * @apiVersion 0.1.0
     */
    app.put('/api/networkProviders/:id', [restServer.isLoggedIn,
                                          restServer.fetchCompany,
                                          restServer.isAdminCompany],
                                         function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the old record, as a read is much less
        // expensive than a write, and then we'll be able to tell if anything
        // really changed before we even try to write.
        modelAPI.networkProviders.retrieveNetworkProvider( req.params.id ).then( function( rp ) {
            // Fields that may exist in the request body that can change.  Make
            // sure they actually differ, though.
            var changed = 0;
            if ( ( req.body.name ) &&
                 ( req.body.name !== rp.name ) ) {
                data.name = req.body.name;
                ++changed;
            }

            // Ready.  DO we have anything to actually change?
            if ( 0 === changed ) {
                // No changes.  But returning 304 apparently causes Apache to strip
                // CORS info, causing the browser to throw a fit.  So just say,
                // "Yeah, we did that.  Really.  Trust us."
                restServer.respond( res, 204 );
            }
            else {
                // Do the update.
                modelAPI.networkProviders.updateNetworkProvider( data ).then( function ( rec ) {
                    restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting networkProvider " + data.id + ": " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * @apiDescription Deletes the Network Provider record with the specified
     *      id.
     *
     * @api {delete} /api/networkProviders/:id Delete Network Provider
     * @apiGroup Network Providers
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Network Provider's id
     * @apiVersion 0.1.0
     */
    app.delete('/api/networkProviders/:id', [restServer.isLoggedIn,
                                             restServer.fetchCompany,
                                             restServer.isAdminCompany],
                                            function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.networkProviders.deleteNetworkProvider( id ).then( function( ) {
            restServer.respond( res, 204 );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting networkProvider " + id + ": " + err );
            restServer.respond( res, err );
        });
    });
}
