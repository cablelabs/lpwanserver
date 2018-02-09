// Database implementation.
var db = require( "../../../lib/dbsqlite.js" );

// Error reporting
var httpError = require( 'http-errors' );

//******************************************************************************
// CompanyNetworkTypeLinks database table.
//******************************************************************************

//******************************************************************************
// CRUD support.
//******************************************************************************

// Create the companyNetworkTypeLinks record.
//
// companyId       - The id for the company this link is being created for
// networkTypeId       - The id for the network the company is linked to
// networkSettings - The settings required by the network protocol in json
//                   format
//
// Returns the promise that will execute the create.
exports.createCompanyNetworkTypeLink = function( companyId, networkTypeId, networkSettings ) {
    return new Promise( function( resolve, reject ) {
        // Create the user record.
        var cnl = {};
        cnl.companyId = companyId;
        cnl.networkTypeId = networkTypeId;
        if ( networkSettings ) {
            cnl.networkSettings = JSON.stringify( networkSettings );
        }
        // OK, save it!
        db.insertRecord("companyNetworkTypeLinks", cnl, function( err, record ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( record );
            }
        });
    });
}

// Retrieve a companyNetworkTypeLinks record by id.
//
// id - the record id of the companyNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
exports.retrieveCompanyNetworkTypeLink = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("companyNetworkTypeLinks", "id", id, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }
            else if ( !rec ) {
                reject( new httpError.NotFound );
            }
            else {
                // Stored in the database as a string, make it an object.
                rec.networkSettings = JSON.parse( rec.networkSettings );
                resolve( rec );
            }
        });
    });
}

// Update the companyNetworkTypeLinks record.
//
// companyNetworkTypeLinks - the updated record.  Note that the id must be unchanged
//                       from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateCompanyNetworkTypeLink = function( companyNetworkTypeLink ) {
    return new Promise( function( resolve, reject ) {
        if ( companyNetworkTypeLink.networkSettings ) {
            companyNetworkTypeLink.networkSettings = JSON.stringify( companyNetworkTypeLink.networkSettings );
        }
        db.updateRecord("companyNetworkTypeLinks", "id", companyNetworkTypeLink, function( err, row ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( row );
            }
        });
    });
}

// Delete the companyNetworkTypeLinks record.
//
// id - the id of the companyNetworkTypeLinks record to delete.
//
// Returns a promise that performs the delete.
exports.deleteCompanyNetworkTypeLink = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.deleteRecord("companyNetworkTypeLinks", "id", id, function( err, rec ) {
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

// Retrieves a subset of the companyNetworkTypeLinks in the system given the options.
//
// Options include the companyId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
exports.retrieveCompanyNetworkTypeLinks = function( options ) {
    return new Promise( function( resolve, reject ) {
        var sql = "select * from companyNetworkTypeLinks";
        var sqlTotalCount = "select count(id) as count from companyNetworkTypeLinks";
        if ( options ) {
            if ( options.companyId || options.networkTypeId ) {
                sql += " where";
                if ( options.companyId ) {
                    sql += " companyId = " + db.sqlValue( options.companyId );
                    sqlTotalCount += " companyId = " + db.sqlValue( options.companyId );
                    if ( options.networkTypeId ) {
                        sql += " and";
                    }
                }
                if ( options.networkTypeId ) {
                    sql += " networkTypeId = " + db.sqlValue( options.networkTypeId );
                    sqlTotalCount += " networkTypeId = " + db.sqlValue( options.networkTypeId );
                }
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
                rows.forEach( function( row ) {
                    // Stored in the database as a string, make it an object.
                    row.networkSettings = JSON.parse( row.networkSettings );
                })
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
