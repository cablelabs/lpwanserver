// Database implementation.
var db = require( "../../../lib/dbsqlite.js" );

// Logging
var appLogger = require( "../../../lib/appLogger.js" );

// Device access
var dev = require( "./devices.js" );

// Error reporting
var httpError = require( 'http-errors' );

//******************************************************************************
// DeviceProfiles database table.
//******************************************************************************

//******************************************************************************
// CRUD support.
//******************************************************************************

// Create the deviceProfiles record.
//
// deviceId          - The id for the device this link is being created for
// networkTypeId     - The id for the network the device is linked to
// name              - The display name for the profile.
// description       - The description for the profile
// networkSettings   - The settings required by the network protocol in json
//                     format
// Returns the promise that will execute the create.
exports.createDeviceProfile = function( networkTypeId, companyId, name, description, networkSettings ) {
    return new Promise( function( resolve, reject ) {
        // Create the link record.
        var profile = {};
        profile.networkTypeId = networkTypeId;
        profile.companyId = companyId;
        profile.name = name;
        profile.description = description;
        profile.networkSettings = JSON.stringify( networkSettings );

        // OK, save it!
        db.insertRecord("deviceProfiles", profile, function( err, record ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( record );
            }
        });
    });
}

// Retrieve a deviceProfiles record by id.
//
// id - the record id of the deviceProfiles record.
//
// Returns a promise that executes the retrieval.
exports.retrieveDeviceProfile = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("deviceProfiles", "id", id, function ( err, rec ) {
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
            return;
        });
    });
}

// Update the deviceProfiles record.
//
// profile - the updated record. Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateDeviceProfile = function( profile ) {
    return new Promise( function( resolve, reject ) {
        if ( profile.networkSettings ) {
            profile.networkSettings = JSON.stringify( profile.networkSettings );
        }
        db.updateRecord("deviceProfiles", "id", profile, function( err, row ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( row );
            }
        });
    });
}

// Delete the deviceProfiles record.
//
// id - the id of the deviceProfiles record to delete.
//
// Returns a promise that performs the delete.
exports.deleteDeviceProfile = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.deleteRecord("deviceProfiles", "id", id, function( err, rec ) {
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

// Retrieves a subset of the deviceProfiles in the system given the options.
//
// Options include the companyId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
exports.retrieveDeviceProfiles = function( options ) {
    return new Promise( function( resolve, reject ) {
        var sql = "select * from deviceProfiles";
        var sqlTotalCount = "select count( id ) as count from deviceProfiles";
        if ( options ) {
            if ( options.companyId || options.networkTypeId || options.search ) {
                var needsAnd = false;
                sql += " where";
                sqlTotalCount += " where";
                if ( options.networkTypeId ) {
                    sql += " networkTypeId = " + db.sqlValue( options.networkTypeId );
                    sqlTotalCount += " networkTypeId = " + db.sqlValue( options.networkTypeId );
                    needsAnd = true;
                }
                if ( options.companyId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " companyId = " + db.sqlValue( options.companyId );
                    needsAnd = true;
                    sqlTotalCount += " companyId = " + db.sqlValue( options.companyId );
                    needsAnd = true;
                }
                if ( options.search ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " name like " + db.sqlValue( options.search );
                    needsAnd = true;
                    sqlTotalCount += " name like " + db.sqlValue( options.search );
                    needsAnd = true;
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
