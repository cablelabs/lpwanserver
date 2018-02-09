// Logging
var appLogger = require( "./lib/appLogger.js" );

var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
    * Companies API
    ********************************************************************/
    /**
     * Gets the companies available for access by the calling admin account.
     * - If the caller is not an Admin, they get a forbidden error.
     * - If the caller is with the admin company, the get all companies.
     * - If the user is a company Admin, they get their own company only.
     * - If the request includes a limit query parameter, only that number of
     *   entries are returned.
     * - If the request includes an offset query parameter, the first offset records
     *   are skipped in the returned data.
     * - If the request includes a search query parameter, the companies will be
     *   limited to matches of the passed string.  In the string, use "%" to match
     *   0 or more characters and "_" to match exactly one.  So to match names
     *   starting with "D", use the string "D%".
     */
    app.get('/api/companies', [restServer.isLoggedIn,
                               restServer.fetchCompany,
                               restServer.isAdmin],
                              function(req, res, next) {
        var options = {};

        if ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) {
            // Must be company admin.  Can only get their own company, so just
            // give that.
            modelAPI.companies.retrieveCompany( req.company.id ).then( function( co ) {
                if ( co ) {
                    co['type'] = modelAPI.companies.reverseTypes[co['type']];
                    // Return the company as a single element array to keep in line
                    // with the multiple company return from this method.
                     restServer.respondJson( res, null, { totalCount: 1, records: [ co ] } );
                }
                else {
                     restServer.respond( res, httpError.NotFound );
                }
            })
            .catch( function( err ) {
                 restServer.respond( res, err );
            });
            return;
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
        modelAPI.companies.retrieveCompanies( options ).then( function( cos ) {
             for (var i = 0; i < cos.records.length; i++) {
                 cos.records[i].type = modelAPI.companies.reverseTypes[cos.records[i].type];
             }
              restServer.respondJson( res, null, cos );
         })
         .catch( function( err ) {
             appLogger.log( "Error getting companies: " + err );
              restServer.respond( res, err );
         });
    });

    /**
     * Gets the company record with the specified id.
     * - A company user can get their own company
     * - If the caller is with the admin company, they can get any company
     * - Returned data will include an array of networks that is a list of
     *   networkIds for networks this company is associated with (via
     *   companyNetworkTypeLinks table)
     */
    app.get('/api/companies/:id', [restServer.isLoggedIn,
                                   restServer.fetchCompany],
                                  function(req, res, next) {
        var id = req.params.id;
        if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
             ( req.company.id != id ) ) {
             restServer.respond( res, 403 );
             return;
        }
        modelAPI.companies.retrieveCompany( parseInt( req.params.id ) ).then( function( co ) {
            co['type'] = modelAPI.companies.reverseTypes[co['type']];
            restServer.respondJson( res, null, co );
         })
         .catch( function( err ) {
             appLogger.log( "Error getting company " + req.params.id + ": " + err );
             restServer.respond( res, err );
         });
    });

    /**
     * Creates a new company record.
     * - A user with an admin company can create a company.
     * - Requires a name and type (one of "admin","vendor", "operator",
     *   "devicemfg")
     *   in the JSON body. { "name": "Joe's Devices", "type": "devicemfg" }
     */
    app.post('/api/companies', [restServer.isLoggedIn,
                                restServer.fetchCompany,
                                restServer.isAdminCompany],
                               function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
             restServer.respond( res, 400, "Cannot specify the company's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name || !rec.type ) {
             restServer.respond( res, 400, "Missing required data" );
        }

        // Convert the type from string to number.
        var newtype = modelAPI.companies.types[ req.body.type ];
        if ( newtype ) {
            rec.type = newtype;
        }
        else {
            // Bad type, bad request.
             restServer.respond( res, 400, "Invalid type: " + req.body.type );
            return;
        }

        // Do the add.
        modelAPI.companies.createCompany( rec.name,
                                            rec.type ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
             restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
             restServer.respond( res, err );
        });
    });

    /**
     * Updates the company record with the specified id.
     * - The company Admin can update the company.
     * - If the caller is with the admin company, they can update any company.
     * - Only the name and/or type can be updated
     */
    app.put('/api/companies/:id', [restServer.isLoggedIn,
                                   restServer.fetchCompany,
                                   restServer.isAdmin],
                                  function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the company, as a read is much less expensive
        // than a write, and then we'll be able to tell if anything really
        // changed before we even try to write.
        modelAPI.companies.retrieveCompany( req.params.id ).then( function( company ) {
            // Fields that may exist in the request body that anyone (with permissions)
            // can change.  Make sure they actually differ, though.
            var changed = 0;
            if ( ( req.body.name ) &&
                 ( req.body.name != company.name ) ) {
                data.name = req.body.name;
                ++changed;
            }
            ;
            if ( req.body.type ) {
                var type = modelAPI.companies.types[ req.body.type ];
                if ( type != company.type ) {
                    data.type = type;
                    ++changed;
                }
            }

            // In order to update a company record, the logged in user must
            // either be part of the admin company, or a company admin for the
            // company.
            if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
                 ( req.user.companyId != data.id ) ) {
                // Nope.  Not allowed.
                 restServer.respond( res, 403 );
                return;
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
                modelAPI.companies.updateCompany( data ).then( function ( rec ) {
                     restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                     restServer.respond( res, err );
                });
            }

         })
         .catch( function( err ) {
             appLogger.log( "Error getting company " + req.body.name + ": " + err );
              restServer.respond( res, err );
         });
    });

    /**
     * Deletes the company record with the specified id.
     * - Only a user with the admin company can delete a company.
     */
    app.delete('/api/companies/:id', [restServer.isLoggedIn,
                                      restServer.fetchCompany,
                                      restServer.isAdminCompany],
                                     function(req, res, next) {
        var id = parseInt( req.params.id );
        modelAPI.companies.deleteCompany( id ).then( function( ) {
            restServer.respond( res, 204 );
        })
        .catch( function( err ) {
            appLogger.log( "Error deleting company " + id + ": " + err );
            restServer.respond( res, err );
        });
    });
}
