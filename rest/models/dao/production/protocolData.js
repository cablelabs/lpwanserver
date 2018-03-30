// Database implementation.
var db = require( "../../../lib/dbsqlite.js" );

// Logging
var appLogger = require( '../../../lib/appLogger.js' );

// Error reporting
var httpError = require( 'http-errors' );

//******************************************************************************
// ProtocolData database table.
//
// Use by the protocols to store relevant data for their own use.
//******************************************************************************

//******************************************************************************
// CRUD support.
//******************************************************************************

// Create the protocolData record.
//
// networkId         - the id of the network this data is stored for.
// networkProtocolId - the id of the networktype, linked to the protocol
//                     used.  This is used in case the network changes protocols,
//                     so old data is not confused with new.
// key               - the dataIdentifier.  This identifier is defined by the
//                     network protocol code, and must be unique in that context
//                     across companies/applications/devices/deviceProfiles, etc.
// data              - The string to store under the specified key.  It is up to
//                     the network protocol code to convert to/from whatever data
//                     type to a string for storage.
//
// Returns the promise that will execute the create.
exports.createProtocolData = function( networkId, networkProtocolId, key, data ) {
    return new Promise( function( resolve, reject ) {
        // Create the user record.
        var pd = {};
        pd.networkId = networkId;
        pd.networkProtocolId = networkProtocolId;
        pd.dataIdentifier = key;
        pd.dataValue = data;

        // OK, save it!
        db.insertRecord("protocolData", pd, function( err, record ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( record );
            }
        });
    });
};

// Retrieve a protocolData record by id.
//
// id - the record id of the protocolData.
//
// Returns a promise that executes the retrieval.
exports.retrieveProtocolDataRecord = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.fetchRecord("protocolData", "id", id, function ( err, rec ) {
            if ( err ) {
                reject( err );
            }
            else if ( !rec ) {
                reject( new httpError.NotFound );
            }
            else {
                resolve( rec.dataValue );
            }
        });
    });
};

// Retrieve a protocolData record by id.
//
// networkId     - the record id of the network this data is stored for.
// networkTypeId - the record id of the networkType this data is stored for.
// key           - The key for the specific data item.
//
// Returns a promise that executes the retrieval.
exports.retrieveProtocolData = function( networkId, networkProtocolId, key ) {
    return new Promise( function ( resolve, reject ) {
        var sql = "select * from protocolData where networkId = " +
                  db.sqlValue( networkId ) +
                  " and networkProtocolId = " +
                  db.sqlValue( networkProtocolId ) +
                  " and dataIdentifier = " +
                  db.sqlValue( key );
        db.select(sql, function ( err, rows ) {
            if ( err ) {
                reject( err );
            }
            else if ( !rows || ( 0 == rows.length ) ) {
                reject( 404 );
            }
            else if ( 1 != rows.length ) {
                reject( new Error( "Too many matches" ) );
            }
            else {
                resolve( rows[ 0 ].dataValue );
            }
        });
    });
};

// Update the protocolData record.
//
// protocolData - the updated record.  Note that the id must be unchanged
//                from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateProtocolData = function( protocolData ) {
    return new Promise( function( resolve, reject ) {
        db.updateRecord("protocolData", "id", protocolData, function( err, row ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( row );
            }
        });
    });
};

// Delete the protocolData record.
//
// id - the id of the protocolData record to delete.
//
// Returns a promise that performs the delete.
exports.deleteProtocolData = function( id ) {
    return new Promise( function ( resolve, reject ) {
        db.deleteRecord("protocolData", "id", id, function( err, rec ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( rec );
            }
        });
    });
};

// Delete the protocolData records with keys that start with the passed string.
//
// networkId     - the record id of the network this data is stored for.
// networkTypeId - the record id of the networkType this data is stored for.
// key           - The key for the specific data item.
//
// Returns a promise that performs the delete.
exports.clearProtocolData = function( networkId, networkProtocolId, keyStartsWith ) {
    return new Promise( function ( resolve, reject ) {
        var sql = "delete from protocolData where networkId = " +
                  db.sqlValue( networkId ) +
                  " and networkProtocolId = " +
                  db.sqlValue( networkProtocolId ) +
                  " and dataIdentifier like " +
                  db.sqlValue( keyStartsWith + "%" );

        db.select(sql, function ( err, rows ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve();
            }
        });
    });
}

// Retrieve the protocolData records with keys that start with the passed string
// and have the passed data.
//
// networkId     - the record id of the network this data is stored for.
// networkTypeId - the record id of the networkType this data is stored for.
// key           - The key for the specific data item.
//
// Returns a promise that performs the delete.
exports.reverseLookupProtocolData = function( networkId, keyLike, data ) {
    return new Promise( function ( resolve, reject ) {
        var sql = "select * from protocolData where networkId = " +
                  db.sqlValue( networkId ) +
                  " and dataIdentifier like \"" +
                  keyLike +
                  "\" and dataValue = "
                  + db.sqlValue( data );

        db.select(sql, function ( err, rows ) {
            if ( err ) {
                reject( err );
            }
            else {
                resolve( rows );
            }
        });
    });
}
