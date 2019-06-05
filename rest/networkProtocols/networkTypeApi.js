// General libraries in use in this module.
var appLogger = require('../lib/appLogger.js')

// An object to access dataModel data and cache it for operations across
// multiple networks, preventing a lot of redundant database hits.
var NetworkProtocolDataAccess = require('./networkProtocolDataAccess.js')

//* *****************************************************************************
// Defines the generic cross-network API from the perspective of a networkType,
// that propogates calls the the individual networks on behalf of the caller.
//* *****************************************************************************
function NetworkTypeApi (modelAPI) {
  this.modelAPI = modelAPI
  this.protos = this.modelAPI.networkProtocolAPI
}

// Wait for all promises to complete, then resolve with the
// NetworkProtocolDataAccess logs
function tracker (total, npda, resolve) {
  let count = 0
  return () => {
    if (++count === total) resolve(npda.getLogs())
  }
}

// Most of the operations here have the same format:
//
// 1) Create a Promise that:
// 2) Load a set of networks of a type, and
// 3) For each network, create a Promise to do an operation on that network,
// 4) Execute the created promises in parallel until all complete, and
// 5) Return the log messages from the remote netowrk accesses.
//
// The difference being the actual operations being performed.  This function
// handles all of the common parts.
//
// operationName    - The name of the operation, used by the
//                    NetworkProtocolDataAccess object.
// networkTypeId    - Used to get the set of networks we'll run this operation
//                    against.
// operationFunction - A callback function that returns a promise for the passed
//                     network, using the passed NetworkProtocolDataAccess.
NetworkTypeApi.prototype.forAllNetworksOfType = function forAllNetworksOfType (operationName,
  networkTypeId,
  operationFunction) {
  return new Promise(async resolve => {
    // Get the data access object/cache set up for this operation across all
    // networks associated with the networkType.  This object keeps a cache
    // of local database queries, keeps track of log messages, and provides
    // a key/value store for the network protocols to store data regarding
    // useful data for the remote network (e.g., the id for the remote
    // company, admin account credetials for the company).
    var npda = new NetworkProtocolDataAccess(this.modelAPI, operationName)

    // Init the logs for this module.
    let networkType = await this.modelAPI.networkTypes.load(networkTypeId)
    npda.initLog(networkType, null)

    var networks
    try {
      // Get the networks we'll be operating on that support the
      // networkType.
      networks = await this.modelAPI.networks.list({ 'networkTypeId': networkTypeId })
    }
    catch (err) {
      appLogger.log('Error retrieving networks for type ID ' + networkTypeId)
      npda.addLog(null, 'Error retrieving networks for type ID ' + networkTypeId)
      resolve(npda.getLogs())
      return
    }

    if (networks.records.length === 0) {
      // Just resolve.
      resolve(npda.getLogs())
    }

    const done = tracker(networks.records.length, npda, resolve)

    networks.records.forEach(network => {
      // Initialize the logging for this network.
      npda.initLog(networkType, network)
      operationFunction(npda, network).then(
        done,
        err => {
          npda.addLog(network, err)
          done()
        }
      )
    })
  })
}

//* *****************************************************************************
// Add/Push/Delete remote companies.
//* ************************************************************134:4*****************

// Add company.
//
// networkTypeId - The id of the networkType to get the new company.
// companyId     - The id for the companies record.
//
// Returns a Promise that connects to the remote systems and creates the
// company.
NetworkTypeApi.prototype.addCompany = function (networkTypeId, companyId) {
  return this.forAllNetworksOfType(
    'Create Company',
    networkTypeId,
    (npda, network) => this.protos.addCompany(npda, network, companyId)
  )
}

// Push the local company data to the remote companies by "pushing" changes.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
// companyId     - The companyId for the company to "push" to the remote network.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pushCompany = function (networkTypeId, companyId) {
  return this.forAllNetworksOfType(
    'Push Company',
    networkTypeId,
    (npda, network) => this.protos.pushCompany(npda, network, companyId)
  )
}

// Pull all company data from the remote network.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pullCompany = function (networkTypeId) {
  return this.forAllNetworksOfType(
    'Pull Company',
    networkTypeId,
    (npda, network) => this.protos.pullCompany(npda, network)
  )
}

// Delete the company.
//
// networkTypeId - The networkTypes record id identifying the networks to delete
//                 the company from.
// companyId     - The companyid of the company to delete remotely.
//                 and network.
//
// Returns a Promise that deletes the company record from the remote system.
NetworkTypeApi.prototype.deleteCompany = function (networkTypeId, companyId) {
  return this.forAllNetworksOfType(
    'Delete Company',
    networkTypeId,
    (npda, network) => this.protos.deleteCompany(npda, network, companyId)
  )
}

//* *****************************************************************************
// Add/Push/Delete remote applications.
//* *****************************************************************************

// Add application.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
// applicationId - The applicationId for the application to add to the remote
//                 network.
//
// Returns a Promise that connects to the remote systems and creates the
// application.
NetworkTypeApi.prototype.addApplication = function (networkTypeId, applicationId) {
  return this.forAllNetworksOfType(
    'Create Application',
    networkTypeId,
    (npda, network) => this.protos.addApplication(npda, network, applicationId)
  )
}

// Push the local application data to the remote networks by "pushing" changes.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
// applicationId - The applicationId for the application to "push" to the remote
//                 network.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pushApplication = function (networkTypeId, application) {
  return this.forAllNetworksOfType(
    'Push Application',
    networkTypeId,
    (npda, network) => this.protos.pushApplication(npda, network, application)
  )
}

// Pull all application data from the remote network.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pullApplication = function (networkTypeId) {
  return this.forAllNetworksOfType(
    'Pull Application',
    networkTypeId,
    (npda, network) => this.protos.pullApplication(npda, network)
  )
}

// Delete the application.
//
// networkTypeId - The networkTypes record id identifying the networks to delete
//                 the application from.
// applicationId - The applicationId of the application to delete remotely.
//
// Returns a Promise that deletes the application record from the remote system.
NetworkTypeApi.prototype.deleteApplication = function (networkTypeId, applicationId) {
  return this.forAllNetworksOfType(
    'Delete Application',
    networkTypeId,
    (npda, network) => this.protos.deleteApplication(npda, network, applicationId)
  )
}

//* *****************************************************************************
// Start/Stop Application data delivery.
//* *****************************************************************************
// Start the application.
//
// network         - The networks record for the network that uses this
//                   protocol.
// companyData     - The companyNetworkTypeLinks record for this company and
//                   network.
// application     - The applications record.
// applicationData - The applicationNetworkTypeLinks record for this Application
//                   and network.
// deliveryFunc    - The function to call with new data.
//
// Returns a Promise that starts the application data flowing from the remote
// system.
NetworkTypeApi.prototype.startApplication = function (networkTypeId, applicationId) {
  return this.forAllNetworksOfType(
    'Start Application',
    networkTypeId,
    (npda, network) => this.protos.startApplication(npda, network, applicationId)
  )
}

// Stop the application.
//
// network         - The networks recofrd for the network that uses this
//                   protocol.
// companyData     - The companyNetworkTypeLinks record for this company and
//                   network.
// application     - The applications record.
// applicationData - The applicationNetworkTypeLinks record for this Application
//                   and network.
//
// Returns a Promise that stops the application data flowing from the remote
// system.
NetworkTypeApi.prototype.stopApplication = function (networkTypeId, applicationId) {
  return this.forAllNetworksOfType(
    'Stop Application',
    networkTypeId,
    (npda, network) => this.protos.stopApplication(npda, network, applicationId)
  )
}

//* *****************************************************************************
// Add/Push/Delete remote deviceProfiles.
//* *****************************************************************************

// Add deviceProfile.
//
// networkTypeId   - The networkTypes record id identifying the networks to push
//                   to.
// deviceProfileId - The deviceProfileId for the deviceProfile to add to the
//                   remote network.
//
// Returns a Promise that connects to the remote systems and creates the
// deviceProfile.
NetworkTypeApi.prototype.addDeviceProfile = function (networkTypeId, deviceProfileId) {
  return this.forAllNetworksOfType(
    'Create DeviceProfile',
    networkTypeId,
    (npda, network) => this.protos.addDeviceProfile(npda, network, deviceProfileId)
  )
}

// Push the local deviceProfile data to the remote networks by "pushing"
// changes.
//
// networkTypeId   - The networkTypes record id  identifying the networks to
//                   push to.
// deviceProfileId - The deviceProfileId for the deviceProfile to "push" to the
//                   remote network.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pushDeviceProfile = function (networkTypeId, deviceProfileId) {
  return this.forAllNetworksOfType(
    'Push DeviceProfile',
    networkTypeId,
    (npda, network) => this.protos.pushDeviceProfile(npda, network, deviceProfileId)
  )
}

// Pull all deviceProfile data from the remote network.
//
// networkTypeId - The networkTypes record id  identifying the networks to pulled
//                 to.
//
// Returns a Promise that pulls changes to the remote network of type.
NetworkTypeApi.prototype.pullDeviceProfiles = function (networkTypeId) {
  return this.forAllNetworksOfType(
    'Pull DeviceProfile',
    networkTypeId,
    (npda, network) => this.protos.pullDeviceProfiles(npda, network)
  )
}

NetworkTypeApi.prototype.pullDeviceProfile = function (networkTypeId, deviceProfileId) {
  return this.forAllNetworksOfType(
    'Pull DeviceProfile',
    networkTypeId,
    (npda, network) => this.protos.pullDeviceProfile(npda, network, deviceProfileId)
  )
}

// Delete the deviceProfile.
//
// networkTypeId   - The networkTypes record id identifying the networks to delete
//                   delete the deviceProfile from.
// deviceProfileId - The deviceProfileId of the deviceProfile to delete remotely.
//
// Returns a Promise that deletes the deviceProfile record from the remote system.
NetworkTypeApi.prototype.deleteDeviceProfile = function (networkTypeId, deviceProfileId) {
  return this.forAllNetworksOfType(
    'Delete DeviceProfile',
    networkTypeId,
    (npda, network) => this.protos.deleteDeviceProfile(npda, network, deviceProfileId)
  )
}

//* *****************************************************************************
// Add/Push/Delete remote devices.
//* *****************************************************************************

// Add device.
//
// networkTypeId - The networkTypes record id identifying the networks to push
//                 to.
// deviceId      - The deviceId for the device to add to the remote network.
//
// Returns a Promise that connects to the remote systems and creates the
// device.
NetworkTypeApi.prototype.addDevice = function (networkTypeId, deviceId) {
  return this.forAllNetworksOfType(
    'Create Device',
    networkTypeId,
    (npda, network) => this.protos.addDevice(npda, network, deviceId)
  )
}

// Push the local device data to the remote networks by "pushing" changes.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
// deviceId      - The deviceId for the device to "push" to the remote network.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pushDevice = function (networkTypeId, device) {
  return this.forAllNetworksOfType(
    'Push Device',
    networkTypeId,
    (npda, network) => this.protos.pushDevice(npda, network, device)
  )
}

NetworkTypeApi.prototype.pullDevices = function (networkTypeId, applicationId) {
  return this.forAllNetworksOfType(
    'Pull Devices',
    networkTypeId,
    (npda, network) => this.protos.pullDevices(npda, network, applicationId)
  )
}

// Delete the device.
//
// networkTypeId - The networkTypes record id identifying the networks to delete
//                 the device from.
// deviceId      - The deviceId of the device to delete remotely.
//
// Returns a Promise that deletes the device record from the remote system.
NetworkTypeApi.prototype.deleteDevice = function (networkTypeId, deviceId) {
  return this.forAllNetworksOfType(
    'Delete Device',
    networkTypeId,
    (npda, network) => this.protos.deleteDevice(npda, network, deviceId)
  )
}

// Pass data to devices.
//
// networkTypeId - The ID of the networkType to get the new company.
// appId     - The ID of the application record
// deviceID  - The ID of the device record
NetworkTypeApi.prototype.passDataToDevice = async function (devNTL, appId, deviceId, data) {
  const ipNwkType = await this.modelAPI.networkTypes.loadByName('IP')
  if (ipNwkType && ipNwkType.id === devNTL.networkType.id) {
    const { records: nwkProtos } = await this.modelAPI.networkProtocols.list({ name: 'IP' })
    const handler = await this.modelAPI.networkProtocols.getHandler(nwkProtos[0].id)
    return handler.passDataToDevice(devNTL, data)
  }
  return this.forAllNetworksOfType(
    'Pass data to device',
    devNTL.networkType.id,
    (npda, network) => this.protos.passDataToDevice(npda, network, appId, deviceId, data)
  )
}

NetworkTypeApi.prototype.connect = function connect (network) {
  return this.protos.connect(network)
}

NetworkTypeApi.prototype.test = function (network, dataAPI) {
  return this.protos.test(network, dataAPI)
}

module.exports = NetworkTypeApi
