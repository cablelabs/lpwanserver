var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
     * Password Policy
     ********************************************************************/
     /**
      * Gets the password policy record for the company.
      */
     app.get('/api/passwordPolicies/company/:companyId',
             [restServer.isLoggedIn,
              restServer.fetchCompany],
             function(req, res, next) {
         var companyId = parseInt( req.params.companyId );

         // Must be admin user or part of the company.
         if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
              ( req.company.id != companyId ) ) {
              restServer.respond( res, 403 );
             return;
         }

         modelAPI.passwordPolicies.retrievePasswordPolicies( companyId ).then( function( rules ) {
             for ( var i = 0; i < rules.length; ++i ) {
                 if ( rules[ i ].companyId ) {
                     delete rules[ i ].companyId;
                 }
                 else {
                     // Usually is in the record as "null".
                     delete rules[ i ].companyId;
                     rules[ i ].global = true;
                 }
             }
               restServer.respondJson( res, null, rules );
          })
          .catch( function( err ) {
              appLogger.log( "Error getting passwordPolicies: " + err );
               restServer.respond( res, err );
          });
     });

     /**
      * Gets the passwordPolicy record with the specified id.
      * - A company user can see their own passwordPolicy or global
      * - If the caller is with the admin company, they can get any company's
      *   passwordPolicy
      */
    app.get('/api/passwordPolicies/:id', [restServer.isLoggedIn,
                                          restServer.fetchCompany],
                                         function(req, res, next) {
        var id = parseInt( req.params.id );

        modelAPI.passwordPolicies.retrievePasswordPolicy( id ).then( function( pp ) {
            // Must be an admin user or
            // it's global passwordPolicy rule or
            // the caller is part of the company that the passwordPolicy rule is
            // assigned to
            if ( ( req.company.type == modelAPI.companies.COMPANY_ADMIN ) ||
                  ( !pp.companyId ) ||
                  ( pp.companyId == req.company.id ) ) {
                 restServer.respondJson( res, null, pp );
            }
            else {
                // Not a passwordPolicy this user should see.
                 restServer.respond( res, 403 );
            }
        })
        .catch( function( err ) {
            appLogger.log( "Error getting passwordPolicy " + id + ": " + err );
             restServer.respond( res, err );
        });
    });

    /**
     * Creates a new passwordPolicy record.
     * - A user with an admin company can create a passwordPolicy for any
     *   company.
     * - A company Admin can create a rule for their own company.
     * - Requires a ruleText, a ruleRegExp, and an optional companyId in the
     *   JSON body. { "ruleText": "At least one number", "ruleRegExp": "[0-9]" }
     * - If no companyId is in the rule,
     *   - an admin company user creates a global rule for all companies
     *   - a company admin creates a rule for their own company
     * - Returns the generated id on success.
     */
    app.post('/api/passwordPolicies', [restServer.isLoggedIn,
                                       restServer.fetchCompany,
                                       restServer.isAdmin],
                                      function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
             restServer.respond( res, 400, "Cannot specify the passwordPolicy's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.ruleText || !rec.ruleRegExp ) {
             restServer.respond( res, 400, "Missing required data" );
            return;
        }

        // If the user is not part of the admin group...
        if ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) {
            // Did they specify the companyId?
            if ( rec.companyId ) {
                // It better match the company they are part of.
                if ( rec.companyId != req.company.id ) {
                     restServer.respond( res, 400, "Cannot specify a passordPolicy for a different company" );
                    return;
                }
            }
            else {
                // No company specified implies "my company".
                rec.companyId = req.company.id;
            }
        }

        // Do the add.
        modelAPI.passwordPolicies.createPasswordPolicy( rec.ruleText, rec.ruleRegExp, rec.companyId ).then( function ( rec ) {
            var send = {};
            send.id = rec.id;
             restServer.respondJson( res, 200, send );
        })
        .catch( function( err ) {
             restServer.respond( res, err );
        });
    });

    /**
     * Updates the passwordPolicy record with the specified id.
     * - The company Admin can only update records with their own company's id.
     * - If the caller is with the admin company, they can update the companyId.
     */
    app.put('/api/passwordPolicies/:id', [restServer.isLoggedIn,
                                          restServer.fetchCompany,
                                          restServer.isAdmin],
                                          function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start by getting the passwordPolicy, as a read is much less
        // expensive than a write, and then we'll be able to tell if anything
        // really changed before we even try to write.
        modelAPI.passwordPolicies.retrievePasswordPolicies( data.id ).then( function( pp ) {
            // If a company admin, cannot change companyId.
            if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
                 ( req.body.companyId ) &&
                 ( ( pp.companyId != req.companyId ) ||
                   ( req.body.companyId != pp.companyId ) ) ) {
                 restServer.respond( res, 403, "Company cannot be changed by non-system admin account" );
                 return;
            }
            else if ( req.body.companyId ) {
                if ( req.body.companyId != pp.companyId ) {
                    data.companyId = req.body.companyId;
                    ++changed;
                }
            }

            // If a company admin, must be a passwordPolicy for that company.
            if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
                 ( !pp.companyId || pp.companyId != req.company.Id ) )
            {
                restServer.respond( res, 403, "Cannot change the passwordPolicy of another company or global passwordPolicies" );
                return;
            }

            // Fields that may exist in the request body that anyone (with
            // permissions) can change.  Make sure they actually differ, though.
            var changed = 0;
            if ( ( req.body.ruleText ) &&
                 ( req.body.ruleText != pp.ruleText ) ) {
                data.ruleText = req.body.ruleText;
                ++changed;
            }

            if ( req.body.ruleRegExp ) {
                if ( req.body.ruleRegExp != pp.ruleRegExp ) {
                    data.ruleRegExp = req.body.ruleRegExp;
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
                modelAPI.passwordPolicies.updatePasswordPolicy( data ).then( function ( rec ) {
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
      * - Only a user with the admin company or the company's admin can delete
      *   a passwordPolicy.
      */
     app.delete('/api/passwordPolicies/:id', [restServer.isLoggedIn,
                                              restServer.fetchCompany,
                                              restServer.isAdmin],
                                             function(req, res, next) {
         var id = parseInt( req.params.id );
          // If the caller is a global admin, we can just delete.
         if ( req.company.type === modelAPI.companies.COMPANY_ADMIN ) {
             modelAPI.passwordPolicies.deletePasswordPolicy( id ).then( function( ) {
                  restServer.respond( res, 204 );
              })
              .catch( function( err ) {
                  appLogger.log( "Error deleting passwordPolicy " + id + ": " + err );
                   restServer.respond( res, err );
              });
         }
         else {
             // We'll need to read first to make sure the record is for the
             // company the company admin is part of.
             modelAPI.passwordPolicies.retrievePasswordPolicy( id ).then( function( pp ) {
                 if ( req.company.id != pp.companyId ) {
                      restServer.respond( res, 400, "Unauthorized to delete record" );
                 }
                 else {
                     // OK to do the  delete.
                     modelAPI.passwordPolicies.deletePasswordPolicy( id ).then( function( ) {
                          restServer.respond( res, 204 );
                      })
                      .catch( function( err ) {
                          appLogger.log( "Error deleting passwordPolicy " + id + ": " + err );
                           restServer.respond( res, err );
                      });
                 }
             })
             .catch( function( err ) {
                  restServer.respond( res, err );
             });
         }
     });
}
