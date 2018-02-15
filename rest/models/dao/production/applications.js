// Database implementation.
var db = require( "../../../lib/dbsqlite.js" );

// Error reporting
var httpError = require( 'http-errors' );

//******************************************************************************
// Applications database table.
//******************************************************************************

//******************************************************************************
// CRUD support.
//******************************************************************************

// Create the application record.
//
// name                - the name of the application
// companyId           - the id of the Company this application belongs to
// reportingProtocolId - The protocol used to report data to the application
// baseUrl             - The base URL to use for reporting the data to the
//                       application using the reporting protocol
//
// Returns the promise that will execute the create.
exports.createApplication = function( name, companyId, reportingProtocolId, baseUrl ) {
    return new Promise( function( resolve, reject ) {
        // Create the user record.
        var application = {};
        application.name = name;
        application.companyId = companyId;
        application.reportingProtocolId = reportingProtocolId;
        application.baseUrl = baseUrl;

        // OK, save it!
        db.insertRecord("applications", application, function( err, record ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( record );
            }
        });
    });
}

// Retrieve a application record by id.  This method retrieves not just the
// application fields, but also returns an array of the networkTypeIds the
// application has applicationNetworkTypeLinks to.
//
// id - the record id of the application.
//
// Returns a promise that executes the retrieval.
exports.retrieveApplication = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("applications", "id", id, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }else if ( !rec ) {
                reject( new httpError.NotFound );
            }
            else {
                // Get the networks for this application.
                var networksQuery = "select networkTypeId from applicationNetworkTypeLinks where applicationId = " + db.sqlValue( id );
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

// Update the application record.
//
// application - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateApplication = function( application ) {
    return new Promise( function( resolve, reject ) {
        db.updateRecord("applications", "id", application, function( err, row ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( row );
            }
        });
    });
}

// Delete the application record.
//
// applicationId - the id of the application record to delete.
//
// Returns a promise that performs the delete.
exports.deleteApplication = function( applicationId ) {
    return new Promise( function ( resolve, reject ) {
        db.deleteRecord("applications", "id", applicationId, function( err, rec ) {
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

// Gets all applications from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllApplications = function() {
    return new Promise( function( resolve, reject ) {
        var sql = 'SELECT * from applications;';
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

// Retrieve the application by name.
//
// Returns a promise that does the retrieval.
exports.retrieveApplicationbyName = function( name ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("applications", "name", name, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( rec );
            }
        });
    });
}

// Retrieves a subset of the applications in the system given the options.
//
// Options include limits on the number of applications returned, the offset to
// the first application returned (together giving a paging capability), a
// search string on application name, a companyId, and a reportingProtocolId.
// The returned totalCount shows the number of records that match the query,
// ignoring any limit and/or offset.
exports.retrieveApplications = function( options ) {
    return new Promise( function( resolve, reject ) {
        var sql = "select * from applications";
        var sqlTotalCount = "select count(id) as count from applications";
        if ( options ) {
            if ( options.search ||
                 options.companyId ||
                 options.reportingProtocolId ) {
                sql += " where";
                sqlTotalCount += " where";
                var needsAnd = false;
                if ( options.search ) {
                    sql += " name like " + db.sqlValue( options.search );
                    sqlTotalCount += " name like " + db.sqlValue( options.search );
                    needsAnd = true;
                }
                if ( options.companyId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " companyId = " + db.sqlValue( options.companyId );
                    sqlTotalCount += " companyId = " + db.sqlValue( options.companyId );
                    needsAnd = true;
                }
                if ( options.reportingProtocolId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " reportingProtocolId = " + db.sqlValue( options.reportingProtocolId );
                    sqlTotalCount += " reportingProtocolId = " + db.sqlValue( options.reportingProtocolId );
                }
            }
            if ( options.limit ) {
                sql += " limit " + db.sqlValue( options.limit );
            }
            if ( options.offset ) {
                sql += " offset " + db.sqlValue( options.offset );
            }
        }

        // Do the basic query.
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
