// Database implementation.
var db = require( "../../../lib/dbsqlite.js" );

// Error reporting
var httpError = require( 'http-errors' );

//******************************************************************************
// Devices database table.
//******************************************************************************

//******************************************************************************
// CRUD support.
//******************************************************************************

// Create the device record.
//
// name                - the name of the device
// description         - a description of the device
// deviceModel         - model information for the device
// applicationId       - the id of the Application this device belongs to
//
// Returns the promise that will execute the create.
exports.createDevice = function( name, description, applicationId, deviceModel ) {
    return new Promise( function( resolve, reject ) {
        // Create the user record.
        var device = {};
        device.name = name;
        device.description = description;
        device.applicationId = applicationId;
        device.deviceModel = deviceModel;

        // OK, save it!
        db.insertRecord("devices", device, function( err, record ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( record );
            }
        });
    });
}

// Retrieve a device record by id.  This method retrieves not just the
// device fields, but also returns an array of the networkTypeIds the
// device has deviceNetworkTypeLinks to.
//
// id - the record id of the device.
//
// Returns a promise that executes the retrieval.
exports.retrieveDevice = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("devices", "id", id, function ( err, rec ) {
            if ( err ) {
                reject( err );
            } else if ( !rec ) {
                reject( new httpError.NotFound );
            }
            else {
                // Get the networks for this device.
                var networksQuery = "select networkTypeId from deviceNetworkTypeLinks where deviceId = " + db.sqlValue( id );
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

// Update the device record.
//
// device - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateDevice = function( device ) {
    return new Promise( function( resolve, reject ) {
        db.updateRecord("devices", "id", device, function( err, row ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( row );
            }
        });
    });
}

// Delete the device record.
//
// deviceId - the id of the device record to delete.
//
// Returns a promise that performs the delete.
exports.deleteDevice = function( deviceId ) {
    return new Promise( function ( resolve, reject ) {
        db.deleteRecord("devices", "id", deviceId, function( err, rec ) {
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

// Gets all devices from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllDevices = function() {
    return new Promise( function( resolve, reject ) {
        var sql = 'SELECT * from devices;';
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

// Retrieve the device by name.
//
// Returns a promise that does the retrieval.
exports.retrieveDevicebyName = function( name ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("devices", "name", name, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( rec );
            }
        });
    });
}

// Retrieves a subset of the devices in the system given the options.
//
// Options include limits on the number of devices returned, the offset to
// the first device returned (together giving a paging capability), a
// search string on device name, a companyId, an applicationId, or a
// deviceProfileId.
exports.retrieveDevices = function( options ) {
    return new Promise( function( resolve, reject ) {
        var sql = "select d.* from devices d";
        var sqlTotalCount = "select count( d.id ) as count from devices d";
        if ( options ) {
            if ( options.companyId ) {
                sql += ", applications a"
                sqlTotalCount += ", applications a"
            }
            if ( options.companyId ||
                 options.search ||
                 options.applicationId ||
                 options.deviceProfileId ) {
                sql += " where";
                sqlTotalCount += " where";
                var needsAnd = false;
                if ( options.search ) {
                    sql += " d.name like " + db.sqlValue( options.search );
                    sqlTotalCount += " d.name like " + db.sqlValue( options.search );
                    needsAnd = true;
                }
                if ( options.applicationId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " d.applicationId = " + db.sqlValue( options.applicationId );
                    sqlTotalCount += " d.applicationId = " + db.sqlValue( options.applicationId );
                    needsAnd = true;
                }
                if ( options.companyId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " d.applicationId = a.id and a.companyId = " + db.sqlValue( options.companyId );
                    sqlTotalCount += " d.applicationId = a.id and a.companyId = " + db.sqlValue( options.companyId );
                    needsAnd = true;
                }
                if ( options.deviceProfileId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " d.deviceProfileId = " + db.sqlValue( options.deviceProfileId );
                    sqlTotalCount += " d.deviceProfileId = " + db.sqlValue( options.deviceProfileId );
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
