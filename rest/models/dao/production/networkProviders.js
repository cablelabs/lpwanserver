// Database implementation.
var db = require( "../../../lib/dbsqlite.js" );

// Error reporting
var httpError = require( 'http-errors' );

//******************************************************************************
// NetworkProviders database table.
//******************************************************************************

//******************************************************************************
// CRUD support.
//******************************************************************************

// Create the networkProviders record.
//
// name  - the name of the networkProvider
//
// Returns the promise that will execute the create.
exports.createNetworkProvider = function( name ) {
    return new Promise( function( resolve, reject ) {
        // Create the record.
        var networkProvider = {};
        networkProvider.name = name;

        // OK, save it!
        db.insertRecord("networkProviders", networkProvider, function( err, record ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( record );
            }
        });
    });
}

// Retrieve a networkProvider record by id.
//
// id - the record id of the networkProvider.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkProvider = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("networkProviders", "id", id, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }else if ( !rec ) {
                reject( new httpError.NotFound );
            }
            else {
                resolve( rec );
            }
        });
    });
}

// Update the networkProvider record.
//
// networkProvider - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetworkProvider = function( networkProvider ) {
    return new Promise( function( resolve, reject ) {
        db.updateRecord("networkProviders", "id", networkProvider, function( err, row ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( row );
            }
        });
    });
}

// Delete the networkProvider record.
//
// networkProviderId - the id of the networkProvider record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkProvider = function( networkProviderId ) {
    return new Promise( function ( resolve, reject ) {
        db.deleteRecord("networkProviders", "id", networkProviderId, function( err, rec ) {
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

// Gets all networkProviders from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllNetworkProviders = function() {
    return new Promise( function( resolve, reject ) {
        var sql = 'SELECT * from networkProviders';
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

// Retrieve the networkProvider by name.
//
// Returns a promise that does the retrieval.
exports.retrieveNetworkProviders = function( options ) {
    return new Promise( function( resolve, reject ) {
        var sql = "select * from networkProviders";
        var sqlTotalCount = "select count(id) as count from networkProviders";
        var needsAnd = false;
        if ( options ) {
            if ( options.search ) {
                sql += " where";
                sqlTotalCount += " where";
            }
            if ( options.search ) {
                sql += " name like " + db.sqlValue( options.search );
                sqlTotalCount += " name like " + db.sqlValue( options.search );
                needsAnd = true;
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
