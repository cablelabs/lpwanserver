// Configuration access.
var nconf = require('nconf');

//******************************************************************************
// The ProtocolData interface.
//******************************************************************************
function ProtocolData() {
    this.impl = new require( './dao/' +
                             nconf.get( "impl_directory" ) +
                             '/protocolData.js' );
}

ProtocolData.prototype.retrieveProtocolDataRecord = function( id ) {
    return this.impl.retrieveProtocolDataRecord( id );
}

ProtocolData.prototype.retrieveProtocolData = function( networkId, networkProtocolId, key ) {
    return this.impl.retrieveProtocolData( networkId, networkProtocolId, key );
}

ProtocolData.prototype.createProtocolData = function( networkId, networkProtocolId, key, data ) {
    return this.impl.createProtocolData( networkId, networkProtocolId, key, data );
}

ProtocolData.prototype.updateProtocolData = function( record ) {
    return this.impl.updateProtocolData( record );
}

ProtocolData.prototype.deleteProtocolData = function( id ) {
    return this.impl.deleteProtocolData( id );
}

ProtocolData.prototype.clearProtocolData = function( networkId, networkProtocolId, keyStartsWith ) {
    return this.impl.clearProtocolData( networkId, networkProtocolId, keyStartsWith );
}

ProtocolData.prototype.reverseLookupProtocolData = function( networkId, keyLike, data ) {
    return this.impl.reverseLookupProtocolData( networkId, keyLike, data );
}

module.exports = ProtocolData;
