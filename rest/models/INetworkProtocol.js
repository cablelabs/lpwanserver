// Configuration access.
var nconf = require('nconf');

//******************************************************************************
// The NetworkProtocol interface.
//******************************************************************************
function NetworkProtocol() {
    this.impl = new require( './dao/' +
                             nconf.get( "impl_directory" ) +
                             '/networkProtocols.js' );
}

NetworkProtocol.prototype.retrieveNetworkProtocols = function( options ) {
    return this.impl.retrieveNetworkProtocols( options );
}

NetworkProtocol.prototype.retrieveNetworkProtocol = function( id ) {
    return this.impl.retrieveNetworkProtocol( id );
}

NetworkProtocol.prototype.createNetworkProtocol = function( name, networkTypeId, protocolHandler ) {
    return this.impl.createNetworkProtocol( name, networkTypeId, protocolHandler );
}

NetworkProtocol.prototype.updateNetworkProtocol = function( record ) {
    return this.impl.updateNetworkProtocol( record );
}

NetworkProtocol.prototype.deleteNetworkProtocol = function( id ) {
    return this.impl.deleteNetworkProtocol( id );
}

module.exports = NetworkProtocol;
