// General libraries in use in this module.
var appLogger = require( '../lib/appLogger.js' );

var request = require( 'request' );

//******************************************************************************
// Defines a generic API for using protocols, and keeps them loaded for reuse.
// Note that this methodology implies a restart is required if reportingProtocol
// code is changed.
//******************************************************************************

var reportingProtocolMap;

function ReportingProtocolAccess( reportingProtocolDB ) {
    this.rpDB = reportingProtocolDB;
    this.clearProtocolMap();
}

// Resets the entire protocol map.
ReportingProtocolAccess.prototype.clearProtocolMap = function() {
    reportingProtocolMap = {};
}

// Clears the protocol from the protocol map. Should be called if the reporting
// protocol is updated with a new code, or is deleted.
ReportingProtocolAccess.prototype.clearProtocol = function( reportingProtocol ) {
    var id = reportingProtocol.id;
    if ( reportingProtocolMap[ id ] ) {
        delete reportingProtocolMap[ id ];
    }
}

ReportingProtocolAccess.prototype.getProtocol = function( application ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        var id = application.reportingProtocolId;
        if ( ! reportingProtocolMap[ id ] ) {
            // We'll need the protocol for the network.
            try {
                var rp = await me.rpDB.retrieveReportingProtocol( id );
                reportingProtocolMap[ id ] = new require( './' + rp.protocolHandler );
                resolve( reportingProtocolMap[ id ] );
            }
            catch ( err ) {
                console.log( "Error loading reportingProtocol: " + err );
                reject( err );
            }
        }
        else {
            resolve( reportingProtocolMap[ id ] );
        }
    })
};


module.exports = ReportingProtocolAccess;
