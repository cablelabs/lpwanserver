// Network Protocol use.
var NetworkTypeAPI = require('../networkProtocols/networkTypeApi')
var NetworkProtocolAPI = require('../networkProtocols/networkProtocols')

function ModelAPI () {
  this.applications = require('./IApplication').model
  this.applicationNetworkTypeLinks = require('./IApplicationNetworkTypeLink').model
  this.devices = require('./IDevice').model
  this.deviceNetworkTypeLinks = require('./IDeviceNetworkTypeLink').model
  this.deviceProfile = require('./IDeviceProfile').model
  this.networks = require('./INetwork').model
  this.networkProtocols = require('./INetworkProtocol').model
  this.networkTypes = require('./INetworkType').model
  this.protocolData = require('./ProtocolData').model
  this.reportingProtocols = require('./IReportingProtocol').model
  this.sessions = require('./ISession').model
  this.users = require('./IUser').model

  // The networkProtocol API, giving access to a specific remote network.
  this.networkProtocolAPI = new NetworkProtocolAPI(this)
  // The networkType API, giving access to the various remote networks of a
  // given type.
  this.networkTypeAPI = new NetworkTypeAPI(this)
}

ModelAPI.prototype.initialize = async function initializeModelAPI () {
  await this.networkProtocols.initialize(this)
  await this.reportingProtocols.initialize()
  await this.users.init()
  await this.emails.init()
}

module.exports = new ModelAPI()
