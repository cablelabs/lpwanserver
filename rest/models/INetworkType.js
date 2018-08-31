// Configuration access.
var nconf = require('nconf');
const appLogger = require('../lib/appLogger')

// Error reporting
var httpError = require( 'http-errors' );

//******************************************************************************
// The NetworkType interface.
//******************************************************************************

// Class constructor.
//
// Loads the implementation for the networkType interface based on the passed
// subdirectory name.  The implementation file networkTypes.js is to be found in
// that subdirectory of the models/dao directory (Data Access Object).
//
// implPath - The subdirectory to get the dao implementation from.
//
function NetworkType() {
    this.impl = new require( './dao/' +
                             nconf.get( "impl_directory" ) +
                             '/networkTypes.js' );
    // Maps a type name to a numeric value.
    this.types = {};
    // Maps a numeric value to the type name.
    this.reverseTypes = {};
    // Cache of the raw type list, loaded at startup, and updated along with the
    // database.
    this.typeList = [];

    this.reloadCache();
}

NetworkType.prototype.reloadCache = async function() {
    // Clear existing maps.  TypeList array cache is replaced at retrieval.
    var me = this;
    me.types = {};
    me.reverseTypes = {};

    try {
        // Load the types from the database.
        var tl = await me.impl.retrieveAllNetworkTypes();
        me.typeList = tl;
        for ( var i = 0; i < me.typeList.length; ++i ) {
            me.types[ me.typeList[ i ].name ] = me.typeList[ i ].id;
            me.reverseTypes[ me.typeList[ i ].id ] = me.typeList[ i ].name;
        }
    }
    catch( err ) {
        throw "Failed to load network types: " + err;
    }
}

// Retrieves the networkTypes in the system given the options.
//
// This should be a pretty short list, so search options are not provided.
//
// Just returns the cache.  Not very expesive to keep around, and we expect
// very few changes to this list.
NetworkType.prototype.retrieveNetworkTypes = function( ) {
    return Promise.resolve( this.typeList );
}

// Retrieve a NetworkType record by id.
//
// id - the record id of the NetworkType.
//
// Returns a promise that executes the retrieval, but just does a lookup on the
// typesById cache, and builds the full record from that.  Quick and easy, and
// avoids the database hit.
NetworkType.prototype.retrieveNetworkType = function( id ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        var ret = me.reverseTypes[ id ];
        appLogger.log(me.reverseTypes)
        if ( ret ) {
            // Build this simple record rather than doing a database hit or a
            // linear search through the cached records.
            // NOTE: A change in database structure may require changes to this
            //       function!
            resolve( { id: id, name: ret });
        }
        else {
            reject( new httpError.NotFound );
        }
    });
}

// Create the NetworkType record.
//
// name  - the name of the networkType
//
// Returns the promise that will execute the create.  It also reloads the
// cache from scratch when executed.  We expect these operations to be rare, so
// the overhead is negligible, and it keeps the code super simple.
NetworkType.prototype.createNetworkType = function( name ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        me.impl.createNetworkType( name ).then( function( id ) {
            // Reload the cache on success.
            me.reloadCache()
              .then(() => {
                resolve( id );
              }).catch((err) => {
                  reject(err)
            })
        })
        .catch( function( err ) {
            reject( err );
        });
    });
}

// Update the networkType record.
//
// networkType - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns the promise that will execute the update.  It also reloads the
// cache from scratch when executed.  We expect these operations to be rare, so
// the overhead is negligible, and it keeps the code super simple.
NetworkType.prototype.updateNetworkType = function( record ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        me.impl.updateNetworkType( record ).then( function( rec ) {
            // Reload the cache on success.
            me.reloadCache();
            resolve( rec );
        })
        .catch( function( err ) {
            reject( err );
        });
    });
}

// Delete the networkType record.
//
// networkTypeId - the id of the networkType record to delete.
//
// Returns the promise that will execute the delete.  It also reloads the
// cache from scratch when executed.  We expect these operations to be rare, so
// the overhead is negligible, and it keeps the code super simple.
NetworkType.prototype.deleteNetworkType = function( id ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        me.impl.deleteNetworkType( id ).then( function() {
            // Reload the cache on success.
            me.reloadCache();
            resolve();
        })
        .catch( function( err ) {
            reject( err );
        });
    });
}

module.exports = NetworkType;
