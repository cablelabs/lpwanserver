// Configuration access.
var nconf = require('nconf');
var NetworkProtocolDataAccess = require( "../networkProtocols/networkProtocolDataAccess" );

//******************************************************************************
// The Network interface.
//******************************************************************************
var modelAPI;

function Network( server ) {
    this.impl = new require( './dao/' +
                             nconf.get( "impl_directory" ) +
                             '/networks.js' );
    modelAPI = server;
}

Network.prototype.retrieveNetworks = function( options ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let ret = await me.impl.retrieveNetworks( options );
            let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Retrieve bulk" );
            // Don't do a forEach or map here.  We need this done NOW, so it
            // is converted for other code.
            for ( let i = 0; i < ret.records.length; ++i ) {
                let rec = ret.records[ i ];
                if ( rec.securityData ) {
                    let k = await dataAPI.getProtocolDataForKey(
                                                    rec.id,
                                                    rec.networkProtocolId,
                                                    genKey( rec.id ) );
                    rec.securityData = await dataAPI.access( rec, rec.securityData, k );
                }
            };

            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

Network.prototype.retrieveNetwork = function( id ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let ret = await me.impl.retrieveNetwork( id );
            if ( ret.securityData ) {
                let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Retrieve" );
                let k = await dataAPI.getProtocolDataForKey( id,
                                                    ret.networkProtocolId,
                                                    genKey( id ) );
                ret.securityData = await dataAPI.access( ret, ret.securityData, k );
            }

            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

Network.prototype.createNetwork = function( name, networkProviderId, networkTypeId, networkProtocolId, baseUrl, securityData ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Create" );
            let k = dataAPI.genKey();
            if ( securityData ) {
                securityData = dataAPI.hide( null, securityData, k );
            }
            let ret = await me.impl.createNetwork( name,
                                                   networkProviderId,
                                                   networkTypeId,
                                                   networkProtocolId,
                                                   baseUrl,
                                                   securityData );
            await dataAPI.putProtocolDataForKey( ret.id,
                                                 networkProtocolId,
                                                 genKey( ret.id ),
                                                 k );

            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

Network.prototype.updateNetwork = function( record ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Update" );
            let old = await me.impl.retrieveNetwork( record.id );
            let k = await dataAPI.getProtocolDataForKey(
                                                    record.id,
                                                    old.networkProtocolId,
                                                    genKey( record.id ) );

            if ( record.networkProtocolId ) {
                await dataAPI.deleteProtocolDataForKey( record.id,
                                                        old.networkProtocolId,
                                                        genKey( record.id ) );
                await dataAPI.putProtocolDataForKey( record.id,
                                                     record.networkProtocolId,
                                                     genKey( record.id ),
                                                     k );
            }

            if ( record.securityData ) {
                record.securityData = dataAPI.hide( null,
                                                    record.securityData,
                                                    k );
            }
            let ret = await me.impl.updateNetwork( record );
            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

Network.prototype.deleteNetwork = function( id ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Delete" );
            let old = await me.impl.retrieveNetwork( id );
            await dataAPI.deleteProtocolDataForKey( id,
                                                    old.networkProtocolId,
                                                    genKey( id ) );
            let ret = await me.impl.deleteNetwork( id );
            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

genKey = function( networkId ) {
    return "nk" + networkId;
}

module.exports = Network;
