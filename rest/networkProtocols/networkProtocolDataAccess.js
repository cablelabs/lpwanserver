// Configuration access.
var nconf = require('nconf');
var cry = require( 'cry' + 'pto' );

// Logging
var appLogger = require( '../lib/appLogger.js' );
var stackTrace = require('stack-trace');

var modelAPI;

// Breaking it up makes it harder to search via grep...
var al = 'a' + 'es-' + '25' + '6-' + 'c' + 'tr';

var delimiter = '-';

//******************************************************************************
// The NetworkProtocol Data Access object.
//
// Allows NetworkProtocols to access data for the current company, application,
// device, etc., so that we don't end up pre-loading data the protocol doesn't
// need.  Also, caches data so that repeated hits on the database can be
// avoided.  This object is expected to be short-lived, allowing the cache to
// expire between operations.
//******************************************************************************
// Class constructor.
//
// Sets up the structure for access to the database implementation and keeps
// track of the "global" function for the lifespan of this object for logging.
//
// server   - The modelAPI, giving access to the data access apis.
// fdesc    - The function description for logging, outlining why the data is
//            being accessed.
//
function NetworkProtocolDataAccess( server, fdesc ) {
    modelAPI = server;
    if ( fdesc ) {
        this.funcDesc = fdesc;
    }
    else {
        this.funcDesc = "Unspecified function";
    }

    // Company cache maps companyId to company record.
    this.companyCache = {};

    // CompanyNetworkTypeCache maps string of companyId:networkTypeId to
    // companyNetworkType record.
    this.companyNetworkTypeCache = {};

    // Application cache maps applicationId to application record.
    this.applicationCache = {};

    // ApplicationNetworkTypeCache maps string of applicationId:networkTypeId
    // to applicationNetworkType record.
    this.applicationNetworkTypeCache = {};

    // Device cache maps deviceId to device record.
    this.deviceCache = {};

    // DeviceNetworkTypeCache maps string of deviceId:networkTypeId
    // to deviceNetworkType record.
    this.deviceNetworkTypeCache = {};

    // DeviceProfileCache maps deviceProfileId deviceProfile record.
    this.deviceProfileCache = {};

    // DevicesInProfileCache maps deviceProfileId to an array of deviceIds.
    this.devicesInProfileCache = {};

    // Errors seen while processing data for the network.
    this.logs = {};
}

// One of the few non-caching methods in this object, gets the networks for the
// network type ID.  It is expected that this will be called once by a method
// that creates this object, but it'll be common code across many operations.
NetworkProtocolDataAccess.prototype.getNetworksOfType = function( networkTypeId ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        modelAPI.networks.retrieveNetworks( { "networkTypeId": networkTypeId } ).then( function( recs ) {
            resolve( recs );
        })
        .catch( function( err ) {
            appLogger.log( me.funcDesc + ": Failed to load networks of type " +
                           networkTypeId +
                           ": " + err );
            reject( err );
        });
    });
}

// Returns a promise that retrieves company data for the companyId.
NetworkProtocolDataAccess.prototype.getCompanyById = function( id ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        var company = me.companyCache[ id ];
        if ( company ) {
            resolve( company );
        }
        else {
            modelAPI.companies.retrieveCompany( id ).then( function( rec ) {
                me.companyCache[ id ] = rec;
                resolve( rec );
            })
            .catch( function( err ) {
                appLogger.log( this.funcDesc + ": Failed to load company " + id +
                               ": " + err );
                reject( err );
            });
        }
    });
}

// Returns a promise that retrieves application data for the applicationId.
NetworkProtocolDataAccess.prototype.getApplicationById = function( id ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        var app = me.applicationCache[ id ];
        if ( app ) {
            resolve( app );
        }
        else {
            modelAPI.applications.retrieveApplication( id ).then( function( rec ) {
                me.applicationCache[ id ] = rec;
                resolve( rec );
            })
            .catch( function( err ) {
                appLogger.log( this.funcDesc + ": Failed to load application " + id +
                               ": " + err );
                reject( err );
            });
        }
    });
}

// Returns a promise that returns the reporting API for the application.
NetworkProtocolDataAccess.prototype.getReportingAPIByApplicationId = function( id ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            // While it may make sense to keep a cache of reporting protocols
            // here, that is handled within the reportingProtocols API anyway.
            // So just use the general interface.
            var application = await me.getApplicationById( id );
            var reportingAPI = await modelAPI.reportingProtocolAPIs.getProtocol( application );
            resolve( reportingAPI );
        }
        catch( err ) {
            appLogger.log( me.funcDesc + ": Failed to load application " +
                           id + " or its reportingProtocol: " + err );
            reject( err );
        }
    });
}

// Returns a promise that retrieves device data for the deviceId.
NetworkProtocolDataAccess.prototype.getDeviceById = function( id ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        var dev = me.deviceCache[ id ];
        if ( dev ) {
            resolve( dev );
        }
        else {
            modelAPI.devices.retrieveDevice( id ).then( function( rec ) {
                me.deviceCache[ id ] = rec;
                resolve( rec );
            })
            .catch( function( err ) {
                appLogger.log( me.funcDesc + ": Failed to load device " + id +
                               ": " + err );
                reject( err );
            });
        }
    });
}

// Returns a promise that retrieves company data for the companyId.
NetworkProtocolDataAccess.prototype.getDeviceProfileById = function( id ) {
    var me = this;
    return new Promise( function( resolve, reject ) {
        var dp = me.deviceProfileCache[ id ];
        if ( dp ) {
            resolve( dp );
        }
        else {
            modelAPI.deviceProfiles.retrieveDeviceProfile( id ).then( function( rec ) {
                me.deviceProfileCache[ id ] = rec;
                resolve( rec );
            })
            .catch( function( err ) {
                appLogger.log( this.funcDesc + ": Failed to load deviceProfile " + id +
                               ": " + err );
                reject( err );
            });
        }
    });
}

// Returns a promise that retrieves company data for the applicationId.
NetworkProtocolDataAccess.prototype.getCompanyByApplicationId = function( appId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var app = await me.getApplicationById( appId );
            var co = await me.getCompanyById( app.companyId );
            resolve( co );
        }
        catch( err ) {
            reject( err );
        }
    });
}

// Returns a promise that retrieves company data for the deviceId.
NetworkProtocolDataAccess.prototype.getCompanyByDeviceId = function( devId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var dev = await me.getDeviceById( devId );
            var co = await me.getCompanyByApplicationId( dev.applicationId );
            resolve( co );
        }
        catch( err ) {
            reject( err );
        }
    });
}

// Returns a promise that retrieves company data for the deviceProfileId.
NetworkProtocolDataAccess.prototype.getCompanyByDeviceProfileId = function( devProId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var devPro = await me.getDeviceProfileById( devProId );
            var co = await me.getCompanyById( devPro.companyId );
            resolve( co );
        }
        catch( err ) {
            reject( err );
        }
    });
}

// Returns a promise that retrieves application data for the deviceId.
NetworkProtocolDataAccess.prototype.getApplicationByDeviceId = function( devId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var dev = await me.getDeviceById( devId );
            return await me.getApplicationById( dev.applicationId );
            resolve( co );
        }
        catch( err ) {
            reject( err );
        }
    });
}

// Returns a promise that retrieves device profile data for the deviceId and
NetworkProtocolDataAccess.prototype.getDeviceProfileByDeviceIdNetworkTypeId = function( devId, ntId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var dnt = await me.getDeviceNetworkType( devId, ntId );
            var devPro = await me.getDeviceProfileById( dnt.deviceProfileId );
            resolve( devPro );
        }
        catch( err ) {
            reject( err );
        }
    });
}

// Returns a promise that retrieves company network data for the companyID and
// networkTypeId.
NetworkProtocolDataAccess.prototype.getCompanyNetworkType = function( companyId, networkTypeId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var cnt = me.companyNetworkTypeCache[ "" + companyId + ":" + networkTypeId ];
            if ( cnt ) {
                resolve( cnt );
            }
            else {
                var cntls = await modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLinks( { "companyId": companyId, "networkTypeId": networkTypeId } );
                me.companyNetworkTypeCache[ "" + companyId + ":" + networkTypeId ] = cntls[ 0 ];
                resolve( cntls[ 0 ] );
            }
        }
        catch( err ) {
            reject( err );
        }
    });
}

// Returns a promise that retrieves application network data for the
// applicationId and networkTypeId.
NetworkProtocolDataAccess.prototype.getApplicationNetworkType = function( applicationId, networkTypeId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var ant = me.applicationNetworkTypeCache[ "" + applicationId + ":" + networkTypeId ];
            if ( ant ) {
                resolve( ant );
            }
            else {
                var antls = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks( { "applicationId": applicationId, "networkTypeId": networkTypeId } );
                me.applicationNetworkTypeCache[ "" + applicationId + ":" + networkTypeId ] = antls[ 0 ];
                resolve( antls[ 0 ] );
            }
        }
        catch( err ) {
            reject( err );
        }
    });
}

// Returns a promise that retrieves device network data for the
// deviceId and networkTypeId.
NetworkProtocolDataAccess.prototype.getDeviceNetworkType = function( deviceId, networkTypeId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var dnt = me.deviceNetworkTypeCache[ "" + deviceId + ":" + networkTypeId ];
            if ( dnt ) {
                resolve( dnt );
            }
            else {
                var dntls = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks( { "deviceId": deviceId, "networkTypeId": networkTypeId } );

                me.deviceNetworkTypeCache[ "" + deviceId + ":" + networkTypeId ] = dntls.records[ 0 ];

                resolve( dntls.records[ 0 ] );
            }
        }
        catch( err ) {
            reject( err );
        }
    });
}

// Returns a promise that retrieves devices associated with the deviceProfileId.
NetworkProtocolDataAccess.prototype.getDevicesForDeviceProfile = function( deviceProfileId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var devIds = me.devicesInProfileCache[ deviceProfileId ];
            if ( devIds ) {
                // Make an array of the devices.
                var devs = [];
                devIds.forEach( function( devId ) {
                    devs.push( me.getDeviceById( devId ) );
                });
                resolve( devs );
            }
            else {
                // Note that device profiles are limited to a particular company,
                // so a company component in the query is not needed.
                var devs = await modelAPI.devices.retrieveDevices( { "deviceProfileId": deviceProfileId } );
                var devIds = [];
                devs.forEach( function( rec ) {
                    // Keep the device cached.
                    me.devices[ rec.id ] = rec;
                    // And the Ids for the deviceProfile
                    devIds.push( rec.id );
                });
                // Save the
                me.devicesInProfileCache[ deviceProfileId ] = devIds;
                resolve( devs );
            }
        }
        catch( err ) {
            reject( err );
        }
    });
}

NetworkProtocolDataAccess.prototype.initLog = function( networkType, network ) {
    if ( null == network ) {
        this.logs[ 0 ] = {};
        this.logs[ 0 ].logs = [];
        this.logs[ 0 ].networkTypeName = networkType.name;
        this.logs[ 0 ].networkName = "All networks of type " + networkType.name;
    }
    else {
        this.logs[ network.id ] = {};
        this.logs[ network.id ].logs = [];
        this.logs[ network.id ].networkTypeName = networkType.name;
        this.logs[ network.id ].networkName = network.name;
    }
}

NetworkProtocolDataAccess.prototype.addLog = function( network, message ) {
    // Message objects are not a good thing.  Try a couple of common ones, then
    // resort to stringify
    if ( typeof message === "object" ) {
        if ( message.syscall ) {
            switch ( message.code ) {
                case "ECONNREFUSED":
                    message = "Cannot connect to remote network server";
                    break;
                case "ETIMEDOUT":
                    message = "Remote server timed out on request";
                    break;
                default:
                    message = message.syscall + " returned " + message.code;
                    break;
            }
        }
        else {
            message = JSON.stringify( message );
        }
    }

    if ( null == network ) {
        this.logs[ 0 ].logs.push( message );
    }
    else {
        this.logs[ network.id ].logs.push( message );
    }
}

NetworkProtocolDataAccess.prototype.getLogs = function() {
    // Deep copy, then drop networks that have no messages.
    let logs = JSON.parse( JSON.stringify( this.logs ) );
    for ( var id in logs ) {
        if ( logs[ id ].logs.length === 0 ) {
            delete logs[ id ];
        }
    }
    return logs;
}

NetworkProtocolDataAccess.prototype.getProtocolDataForKey = function( networkId, networkProtocolId, key ) {
    return modelAPI.protocolData.retrieveProtocolData( networkId, networkProtocolId, key );
}

NetworkProtocolDataAccess.prototype.putProtocolDataForKey = function( networkId, networkProtocolId, key, data ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            // Try a create first.
            await modelAPI.protocolData.createProtocolData( networkId, networkProtocolId, key, data );
        }
        catch ( err ) {
            // Nope?  Get and update!  (Need to get to get the record id.)
            var rec = me.getProtocolDataForKey( networkId, networkProtocolId, key );
            rec.data = data;
            await modelAPI.protocolData.updateProtocolData( rec );
        }
        resolve( );
    });
}

NetworkProtocolDataAccess.prototype.deleteProtocolDataForKey = function(
                               networkId,
                               networkProtocolId,
                               keyStartsWith ) {
   return modelAPI.protocolData.clearProtocolData( networkId, networkProtocolId, keyStartsWith );
}

NetworkProtocolDataAccess.prototype.getProtocolDataWithData = function(
                               networkId,
                               keyLike,
                               data ) {
   return modelAPI.protocolData.reverseLookupProtocolData( networkId, keyLike, data );
}

NetworkProtocolDataAccess.prototype.access = function( network, data, k ) {
    var parts = data.split( delimiter );
    var vec = Buffer.from( parts[ 0 ], 'base64' );
    var dec = cry.createDecipheriv( al, Buffer.from( k, 'base64' ), vec );
    var res = dec.update( parts[ 1 ], 'base64', 'utf8' );
    res += dec.final( 'utf8' );
    return JSON.parse( res );
}

NetworkProtocolDataAccess.prototype.hide = function( network, dataObject, k ) {
    var vec = cry.randomBytes( 16 );
    var cfr = cry.createCipheriv( al, Buffer.from( k, 'base64' ), vec );
    var en = cfr.update( JSON.stringify( dataObject ), 'utf8', 'base64' );
    en += cfr.final( 'base64' );
    return vec.toString( 'base64' ) + delimiter + en;
}

NetworkProtocolDataAccess.prototype.genKey = function( ) {
        var k = cry.randomBytes( 32 );
        return k.toString( 'base64' );
}

NetworkProtocolDataAccess.prototype.genPass = function( ) {
        var k = cry.randomBytes( 12 );
        return k.toString( 'base64' );
}


module.exports = NetworkProtocolDataAccess;
