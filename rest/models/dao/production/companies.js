// Database implementation.
var db = require( "../../../lib/dbsqlite.js" );

var pwVal = require( "./passwordPolicies.js" );

// Error reporting
var httpError = require( 'http-errors' );

exports.COMPANY_VENDOR = 2;
exports.COMPANY_ADMIN = 1;
//******************************************************************************
// Companies database table.
//******************************************************************************

//******************************************************************************
// CRUD support.
//******************************************************************************

// Create the company record.
//
// name  - the name of the company
// type  - the company type. COMPANY_ADMIN can manage companies, etc.,
//         COMPANY_VENDOR is the typical vendor who just manages their own apps
//         and devices.
//
// Returns the promise that will execute the create.
exports.createCompany = function( name, type ) {
    return new Promise( function( resolve, reject ) {
        // Create the user record.
        var company = {};
        company.name = name;
        company.type = type;

        // OK, save it!
        db.insertRecord("companies", company, function( err, record ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( record );
            }
        });
    });
}

// Retrieve a company record by id.  This method retrieves not just the company
// fields, but also returns an array of the networkTypeIds the company has
// companyNetworkTypeLinks to.
//
// id - the record id of the company.
//
// Returns a promise that executes the retrieval.
exports.retrieveCompany = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("companies", "id", id, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }else if ( !rec ) {
                reject( new httpError.NotFound );
            }
            else {
                // Get the networks for this company.
                var networksQuery = "select networkTypeId from companyNetworkTypeLinks where companyId = " + db.sqlValue( id );
                db.select( networksQuery, function( err, rows ) {
                    // Ignore bad returns and null sets here.
                    if ( !err && rows && ( 0 < rows.length ) ) {
                        // Add the networks array to the returned record.
                        rec.networks = [];
                        for ( var i = 0; i < rows.length; ++i ) {
                            rec.networks.push( rows[ i ].networkTypeId );
                        }
                    }
                    resolve( rec );
                });
            }
        });
    });
}

// Update the company record.
//
// company - the updated record.  Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateCompany = function( company ) {
    return new Promise( function( resolve, reject ) {
        db.updateRecord("companies", "id", company, function( err, row ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( row );
            }
        });
    });
}

// Delete the company record.
//
// companyId - the id of the company record to delete.
//
// Returns a promise that performs the delete.
exports.deleteCompany = function( companyId ) {
    return new Promise( function ( resolve, reject ) {
        db.deleteRecord("companies", "id", companyId, function( err, rec ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( rec );
            }
        });
    });
}

//******************************************************************************
// Custom retrieval functions.
//******************************************************************************

// Retrieve the company by name.
//
// Returns a promise that does the retrieval.
exports.retrieveCompanybyName = function( name ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("companies", "name", name, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( rec );
            }
        });
    });
}

// Retrieves a subset of the companies in the system given the options.
//
// Options include limits on the number of companies returned, the offset to
// the first company returned (together giving a paging capability), and a
// search string on company name.
// The returned totalCount shows the number of records that match the query,
// ignoring any limit and/or offset.
exports.retrieveCompanies = function( options ) {
    return new Promise( function( resolve, reject ) {
        var sql = "select * from companies";
        var sqlTotalCount = "select count(id) as count from companies";
        if ( options ) {
            if ( options.search ) {
                sql += " where name like " + db.sqlValue( options.search );
                sqlTotalCount += " where name like " + db.sqlValue( options.search );
            }
            if ( options.limit ) {
                sql += " limit " + db.sqlValue( options.limit );
            }
            if ( options.offset ) {
                sql += " offset " + db.sqlValue( options.offset );
            }
        }
        db.select(sql, function( err, rows ) {
            if ( err ) {
                reject( err );
            }
            else {
                // Limit and/or offset requires a second search to get a
                // total count.  Well, usually.  Can also skip if the returned
                // count is less than the limit (add in the offset to the
                // returned rows).
                if ( options &&
                     ( options.limit || options.offset ) )
                {
                    // If we got back less than the limit rows, then the
                    // totalCount is the offset and the number of rows.  No
                    // need to run the other query.
                    // Handle if one or the other value is missing.
                    var limit = Number.MAX_VALUE;
                    if ( options.limit ) {
                        limit = options.limit;
                    }
                    var offset = 0;
                    if ( options.offset ) {
                        offset = options.offset;
                    }
                    if ( rows.length < limit ) {
                        resolve( { totalCount: offset + rows.length,
                                   records: rows } );
                    }
                    else {
                        // Must run counts query.
                        db.select(sqlTotalCount, function( err, count ) {
                            if ( err ) {
                                reject( err );
                            }
                            else {
                                resolve( { totalCount: count[0].count,
                                           records: rows } );
                            }
                        });
                    }
                }
                else {
                    resolve( { totalCount: rows.length, records: rows } );
                }
            }
        });
    });
}

//******************************************************************************
// Other functions.
//******************************************************************************

// Tests the password for validity based on the passwordPolicies for the
// company.
//
// companyId - The company to test the password for
// password  - The password to be tested.
//
// Returns a promise that will perform the tests.
exports.passwordValidator = function( companyId, password ) {
    return new Promise( function( resolve, reject ) {
        // Get the rules from the passwordPolicies table
        pwVal.retrievePasswordPolicies( companyId ).then( function( rows ) {
            // Verify that the password passes each rule.
            for ( var i = 0; i < rows.length; ++i ) {
                var regexp;
                try {
                    regexp = new RegExp( rows[ i ].ruleRegExp );
                } catch (e) {
                    // Invalid expression.  Skip it.
                    continue;
                }

                if ( ! regexp.test( password ) ) {
                    // Invalid password
                    reject( rows[ i ].ruleText );
                    return;
                }
            }
            resolve();
        });

    });
}


// Gets the types of companies from the database table
exports.getTypes = function() {
    return new Promise( function( resolve, reject ) {
        var sql = "select * from companyTypes";
        db.select(sql, function( err, rows ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( rows );
            }
        });
    });
}
