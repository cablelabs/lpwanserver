var modelAPI = {}
var ProtocolDataModel = require( '../../rest/models/IProtocolData.js' )
var NetworkProtocolAPI = require( '../../rest/networkProtocols/networkProtocols.js' )

function ModelAPI () {
  modelAPI = this
  this.protocolData = new ProtocolDataModel( this )
  this.networkProtocolAPI = new NetworkProtocolAPI( this.networkProtocols )

}

module.exports = ModelAPI
