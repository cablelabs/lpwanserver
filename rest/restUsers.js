var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
    * Users API
    ********************************************************************/
    /**
     * Gets the users available for access by the calling admin account.
     * - If the caller is not an Admin, they get an forbidden error.
     * - If the caller is with the admin company, the get all users for all
     *   companies, though they gave the option of including a query parameter
     *   (e.g., "/api/users?companyId=3") to specify limiting to a specific
     *   company.
     * - If the user is a company Admin, they get their own company's user list.
     * - If the request includes a limit query parameter, only that number of
     *   entries are returned.
     * - If the request includes an offset query parameter, the first offset
     *   records are skipped in the returned data.
     * - If the request includes a search query parameter, the users will be
     *   limited to matches of the passed string.  In the string, use "%" to
     *   match 0 or more characters and "_" to match exactly one.  So to match
     *   usernames starting with "d", use the string "d%".
     */
    app.get('/api/users', [restServer.isLoggedIn,
                           restServer.fetchCompany,
                           restServer.isAdmin],
                          function(req, res, next) {
        var options = {};
        if ( req.company.type == modelAPI.companies.COMPANY_ADMIN ) {
            // Check for a company limit.
            if ( req.query.companyId ) {
                options.companyId = req.query.companyId;
            }
        }
        else if ( req.user.role == modelAPI.users.ROLE_ADMIN ) {
            options.companyId = req.company.id;
        }
        else {
            restServer.respond( res, 403, "Cannot get users" );
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
        modelAPI.users.retrieveUsers( options ).then( function( users ) {
             for (var i = 0; i < users.records.length; i++) {
                 users.records[i]['role'] = modelAPI.users.reverseRoles[users.records[i]['role']];
                 delete users.records[ i ].passwordHash;
             }
             restServer.respondJson( res, null, users );
         })
         .catch( function( err ) {
             appLogger.log( "Error getting users for company " + req.company.name + ": " + err );
             restServer.respond( res, err );
         });
    });

    /**
     * Gets the user record for the logged in user.  Note, this needs to be
     * declared
     */
    app.get('/api/users/me', [restServer.isLoggedIn], function(req, res, next) {
        // We could clone the object so we don't change the original in the
        // request object, but it just gets thrown away at the end of this
        // call anyway.
        var me = req.user;
        me['role'] = modelAPI.users.reverseRoles[me['role']];
        delete me.passwordHash;

        restServer.respondJson( res, null, req.user );
    });

    /**
     * Gets the user record with the specified id.
     * - The user can get themselves
     * - The company Admin can get users for the company.
     * - If the caller is with the admin company, they can get any user
     */
    app.get('/api/users/:id', [restServer.isLoggedIn, restServer.fetchCompany], function(req, res, next) {
        modelAPI.users.retrieveUser( parseInt( req.params.id ) ).then( function( user ) {
            if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
                 ( ( req.user.role != modelAPI.users.ROLE_ADMIN ) ||
                   ( req.user.companyId != user.companyId ) ) &&
                 ( req.user.id != user.id ) ) {
                restServer.respond( res, 403 );
            }
            else {
                user['role'] = modelAPI.users.reverseRoles[user['role']];
                delete user.passwordHash;
                restServer.respondJson( res, null, user );
            }
         })
         .catch( function( err ) {
             appLogger.log( "Error getting users for company " + req.company.name + ": " + err );
             restServer.respond( res, err );
         });
    });

    /**
     * Creates a new user record.
     * - The company Admin can create users for the company.
     * - If the caller is with the admin company, they can create a user for any
     *   company.
     * - Only the username, password, email, role, or companyId can be updated
     *   - companyId can only be updated by a member of an admin company.
     *   - role can only be updated by company admin.
     */
    app.post('/api/users', [restServer.isLoggedIn,
                            restServer.fetchCompany,
                            restServer.isAdmin],
                           function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
            restServer.respond( res, 400, "Cannot specify the user's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.username ||
             !rec.password ||
             !rec.role ||
             !rec.companyId ) {
            restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // Company must match the user who is an admin role, or the user must be
        // part of the admin group.
        if ( ( ( modelAPI.users.ROLE_ADMIN != req.user.role ) ||
               ( rec.companyId != req.user.companyId ) ) &&
             ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) ) {
            restServer.respond( res, 403 );
            return;
        }

        // Convert the role from string to number.
        var newrole = modelAPI.users.roles[ req.body.role ];
        if ( newrole ) {
            rec.role = newrole;
        }
        else {
            // Bad role, bad request.
            restServer.respond( res, 400, "Invalid role" );
            return;
        }

        // If the new role is admin, we MUST have an email address.
        if ( ( rec.role === modelAPI.users.ROLE_ADMIN ) &&
             ( !rec.email ) ) {
            restServer.respond( res, 400, "Admin user MUST have an email address" );
            return;
        }

        // Do the add.
        modelAPI.users.createUser( rec.username,
                                     rec.password,
                                     rec.email,
                                     rec.companyId,
                                     rec.role ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
            restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
            restServer.respond( res, err );
        });
    });

    /**
     * Updates the user record with the specified id.
     * - The user can update themselves
     * - The company Admin can update users for the company.
     * - If the caller is with the admin company, they can update any user.
     * - Only the username, password, email, role, or companyId can be updated
     *   - companyId can only be updated by a member of an admin company.
     *   - role can only be updated by company admin.
     */
    app.put('/api/users/:id', [restServer.isLoggedIn,
                               restServer.fetchCompany],
                              function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the user, as a read is much less expensive
        // than a write, and then we'll be able to tell if anything really
        // changed before we even try to write.
        modelAPI.users.retrieveUser( req.params.id ).then( function( user ) {
            // Fields that may exist in the request body that anyone (with permissions)
            // can change.  Make sure they actually differ, though.
            var changed = 0;
            if ( ( req.body.username ) &&
                 ( req.body.username != user.username ) ) {
                data.username = req.body.username;
                ++changed;
            }

            // Note: can't check for a change in the password without hashing
            // the one passed in.  If we get one, just pass it through.
            if ( req.body.password ) {
                data.password = req.body.password;
                ++changed;
            }
            if ( ( req.body.email ) &&
                 ( req.body.email != user.email ) ) {
                data.email = req.body.email;
                ++changed;
            }

            // In order to update a user record, the logged in user must either be
            // a system admin, a company admin for the user's company, or the user
            // themselves.
            if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
                 ( ( req.user.role != modelAPI.users.ROLE_ADMIN ) ||
                   ( req.user.companyId != user.companyId ) ) &&
                 ( req.user.id != user.id ) ) {
                // Nope.  Not allowed.
                restServer.respond( res, 403 );
                return;
            }
            else if ( req.user.id != user.id ) {
                // Admin of some type.  They can change a couple of other
                // things.

                // Convert any role change from string to number.
                if ( req.body.role ) {
                    var newrole = modelAPI.users.roles[ req.body.role ];
                    if ( newrole ) {
                        if ( newrole != user.role ) {
                            data.role =  newrole;
                            ++changed;
                        }
                    }
                    else {
                        // Bad role, bad request.
                        restServer.respond( res, 400, "invalid role" );
                        return;
                    }

                    // If the new role is admin, we MUST have an email address.
                    if ( ( data.role === modelAPI.users.ROLE_ADMIN ) &&
                         ( !data.email ) &&
                         ( !user.email ) ) {
                        restServer.respond( res, 400, "Admin user MUST have an email address" );
                        return;
                    }
                }

                // System admin can change companyId
                if ( ( req.body.companyId ) &&
                     ( req.body.companyId != user.companyId ) ) {
                    if ( req.company.type == modelAPI.companies.COMPANY_ADMIN ) {
                        // We COULD verify the company id here, but referential
                        // integrity should tell us if we have an issue, anyway.
                        data.companyId = req.body.companyId;
                        ++changed;
                    }
                    else {
                        // Not system admin.  Forbidden.
                        restServer.respond( res, 403, "Only system admin can change company of a user" );
                        return;
                    }
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
                modelAPI.users.updateUser( data ).then( function ( rec ) {
                    restServer.respond( res, 204 );
                })
                .catch( function( err ) {
                    restServer.respond( res, err );
                });
            }
         })
         .catch( function( err ) {
             appLogger.log( "Error getting user " + req.params.id + " for company " + req.company.name + ": " + err );
             restServer.respond( res, err );
         });
    });

    /**
     * Deletes the user record with the specified id.
     * - The user cannot delete themselves
     * - The company Admin can delete users for the company.
     * - If the caller is with the admin company, they can delete any user.
     */
    app.delete('/api/users/:id', [restServer.isLoggedIn,
                                  restServer.fetchCompany,
                                  restServer.isAdmin],
                                 function(req, res, next) {
        // Verify that the user is not trying to delete themselves.
        var id = parseInt( req.params.id );
        if ( req.user.id === id ) {
            // Forbidden.
            restServer.respond( res, 403, "Cannot delete your own account" );
            return;
        }

        // If the caller is a global admin, we can just delete.
        if ( req.company.type === modelAPI.companies.COMPANY_ADMIN ) {
            modelAPI.users.deleteUser( id ).then( function( ) {
                restServer.respond( res, 204 );
             })
             .catch( function( err ) {
                 appLogger.log( "Error deleting user " + id + ": " + err );
                 restServer.respond( res, err );
             });
        }
        else if ( req.user.role === modelAPI.users.ROLE_ADMIN ) {
            // Admin for a company.  Get the user and verify the same company.
            modelAPI.users.retrieveUser( id ).then( function( user ) {
                if ( user.companyId !== req.user.companyId ) {
                    restServer.respond( res, 403, "Cannot delete a user from another company" );
                }
                else {
                    // OK to delete.
                    modelAPI.users.deleteUser( id ).then( function( ) {
                        restServer.respond( res, 204 );
                     })
                     .catch( function( err ) {
                         appLogger.log( "Error deleting user " + id + ": " + err );
                         restServer.respond( res, err );
                     });
                }
            })
            .catch( function( err ) {
                appLogger.log( "Error retrieving user record for companyId comparison for delete" );
                restServer.respond( res, err );
            });
        }
        else {
            // Regular user cannot delete accounts.
            restServer.respond( res, 403, "Cannot delete users" );
        }
    });

    /**
     * Updates the user's email associated with an accept/reject email
     * - No login required
     * - UUID is passed to the user via an email link
     * - "accept" or "reject" function MUST be specified
     * - Returns 204 (success) or 404 (UUID not known) or 400 (bad request)
     */
    app.put("/api/users/verifyEmail/:uuid", function(req, res, next) {
        var uuid = req.params.uuid;
        var func = req.query.function;
        var source = req.query.source;

        // Must have a valid function.
        if ( ( !func ) ||
             ( ( "accept" != func ) &&
               ( "reject" != func ) ) ) {
            restServer.respond( res, 400, "missing function query parameter" );
            return;
        }

        // Do it.
        modelAPI.users.handleEmailVerifyResponse( uuid, func, source ).then( function( ) {
            restServer.respond( res, 204 );
         })
         .catch( function( err ) {
             appLogger.log( "Error verifying email with uuid " + req.params.uuid + ": " + err );
             restServer.respond( res, err );
         });
    });
}
