// Database implementation.
var db = require( "../../../lib/dbsqlite.js" );

// Device access
var dev = require( "./devices.js" );

// Application/company validation from applicationNetowrkLinks
var app = require( "./applicationNetworkTypeLinks.js" );

// Error reporting
var httpError = require( 'http-errors' );

//******************************************************************************
// DeviceNetworkTypeLinks database table.
//******************************************************************************

//******************************************************************************
// CRUD support.
//******************************************************************************

// Create the deviceNetworkTypeLinks record.
//
// deviceId          - The id for the device this link is being created for
// networkTypeId         - The id for the network the device is linked to
// networkSettings   - The settings required by the network protocol in json
//                     format
// validateCompanyId - If supplied, the device MUST belong to this company.
//
// Returns the promise that will execute the create.
exports.createDeviceNetworkTypeLink = function( deviceId, networkTypeId, deviceProfileId, networkSettings, validateCompanyId ) {
    return new Promise( function( resolve, reject ) {
        validateCompanyForDevice( validateCompanyId, deviceId ).then( function() {
            // Create the link record.
            var link = {};
            link.deviceId = deviceId;
            link.networkTypeId = networkTypeId;
            link.deviceProfileId = deviceProfileId;
            link.networkSettings = JSON.stringify( networkSettings );

            // OK, save it!
            db.insertRecord("deviceNetworkTypeLinks", link, function( err, record ) {
                if ( err ) {
                    reject( err );
                }
                else {
                    resolve( record );
                }
            });
        })
        .catch( function( err ) {
            reject( err );
        });
    });
}

// Retrieve a deviceNetworkTypeLinks record by id.
//
// id - the record id of the deviceNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
exports.retrieveDeviceNetworkTypeLink = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("deviceNetworkTypeLinks", "id", id, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }
            else if ( !rec ) {
                reject( new httpError.NotFound );
            }
            else {
                if ( rec.networkSettings ) {
                    rec.networkSettings = JSON.parse( rec.networkSettings );
                }
                resolve( rec );
            }
        });
    });
}

// Update the deviceNetworkTypeLinks record.
//
// deviceNetworkTypeLinks      - the updated record. Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - If supplied, the device MUST belong to this
//                           company.
//
// Returns a promise that executes the update.
exports.updateDeviceNetworkTypeLink = function( dnl, validateCompanyId ) {
    return new Promise( function( resolve, reject ) {
        validateCompanyForDeviceNetworkTypeLink( validateCompanyId, dnl.id ).then( function() {
            if ( dnl.networkSettings ) {
                dnl.networkSettings = JSON.stringify( dnl.networkSettings );
            }
            db.updateRecord("deviceNetworkTypeLinks", "id", dnl, function( err, row ) {
                if ( err ) {
                    reject( err );
                }
                else {
                    resolve( row );
                }
            });
        })
        .catch( function( err ) {
            reject( err );
        });
    });
}

// Delete the deviceNetworkTypeLinks record.
//
// id                - the id of the deviceNetworkTypeLinks record to delete.
// validateCompanyId - If supplied, the device MUST belong to this company.
//
// Returns a promise that performs the delete.
exports.deleteDeviceNetworkTypeLink = function( id, validateCompanyId ) {
    return new Promise( function ( resolve, reject ) {
        validateCompanyForDeviceNetworkTypeLink( validateCompanyId, id ).then( function() {
            db.deleteRecord("deviceNetworkTypeLinks", "id", id, function( err, rec ) {
                if ( err ) {
                    reject( err );
                }
                else {
                    resolve( rec );
                }
            });
        })
        .catch( function( err ) {
            reject( err );
        });
    });
}

//******************************************************************************
// Custom retrieval functions.
//******************************************************************************

// Retrieves a subset of the deviceNetworkTypeLinks in the system given the options.
//
// Options include the deviceId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
exports.retrieveDeviceNetworkTypeLinks = function( options ) {
    return new Promise( function( resolve, reject ) {
        var sql = "select dnl.* from deviceNetworkTypeLinks dnl";
        var sqlTotalCount = "select count(dnl.id) as count from deviceNetworkTypeLinks dnl";
        if ( options ) {
            if ( options.companyId ) {
                sql += ", devices d, applications a"
                sqlTotalCount += ", devices d, applications a"
            }
            if ( options.companyId || options.deviceId || options.networkTypeId ) {
                var needsAnd = false;
                sql += " where";
                sqlTotalCount += " where";
                if ( options.deviceId ) {
                    sql += " dnl.deviceId = " + db.sqlValue( options.deviceId );
                    sqlTotalCount += " dnl.deviceId = " + db.sqlValue( options.deviceId );
                    needsAnd = true;
                }
                if ( options.networkTypeId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " dnl.networkTypeId = " + db.sqlValue( options.networkTypeId );
                    sqlTotalCount += " dnl.networkTypeId = " + db.sqlValue( options.networkTypeId );
                    needsAnd = true;
                }
                if ( options.applicationId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " dnl.deviceId = d.id and d.applicationId = " + db.sqlValue( options.applicationId );
                    sqlTotalCount += " dnl.deviceId = d.id and d.applicationId = " + db.sqlValue( options.applicationId );
                    needsAnd = true;
                }
                if ( options.companyId ) {
                    if ( needsAnd ) {
                        sql += " and";
                        sqlTotalCount += " and";
                    }
                    sql += " dnl.deviceId = d.id and d.applicationId = a.id and a.companyId = " + db.sqlValue( options.companyId );
                    sqlTotalCount += " dnl.deviceId = d.id and d.applicationId = a.id and a.companyId = " + db.sqlValue( options.companyId );
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
                    if ( row.networkSettings ) {
                        row.networkSettings = JSON.parse( row.networkSettings );
                    }
                });
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

/***************************************************************************
 * Validation methods
 ***************************************************************************/
function validateCompanyForDevice( companyId, deviceId ) {
    return new Promise( function( resolve, reject ) {
        // undefined companyId is always valid - means the caller is a used for
        // an admin company, so they can set up any links.
        if ( !companyId ) {
            resolve();
        }
        else {
            dev.retrieveDevice( deviceId )
            .then( function( d ) {
                app.validateCompanyForApplication( companyId, d.applicationId )
                .then( resolve() )
                .catch( function( err ) {
                    reject( err );
                });
            })
            .catch( function( err ) {
                reject( err );
            });
        }
    });
}

function validateCompanyForDeviceNetworkTypeLink( companyId, dnlId ) {
    return new Promise( function( resolve, reject ) {
        // undefined companyId is always valid - means the caller is a used for
        // an admin company, so they can set up any links.
        if ( !companyId ) {
            resolve();
        }
        else {
            exports.retrieveDeviceNetworkTypeLink( dnlId ) .then( function( dnl ) {
                validateCompanyForDevice( dnl.deviceId )
                .then( resolve() )
                .catch( function( err ) {
                    reject( err );
                });
            })
            .catch( function( err ) {
                reject( err );
            });
        }
    });
}
