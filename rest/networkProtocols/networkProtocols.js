// General libraries in use in this module.
const appLogger = require('../lib/appLogger.js')
const path = require('path')
const handlersDir = path.join(__dirname, 'handlers')
const httpError = require('http-errors')

// ******************************************************************************
// Defines the generic cross-network API, and manages the network protocols
// for the upper layers.
// ******************************************************************************

const handlerList = [
  'LoraOpenSource/v1',
  'LoraOpenSource/v2',
  'TheThingsNetwork/v2',
  'Loriot/v4'
]

/**
 * Defines the generic cross-network API, and manages the network protocols
 * for the upper layers.
 * @class NetworkProtocolAccess
 */

module.exports = class NetworkProtocolAccess {
  // Constructor - gets the database API for the networkProtocols
  constructor (modelAPI) {
    this.modelAPI = modelAPI
    this.networkProtocolsById = {}
    this.networkProtocolsByHandler = {}
    this.handlerList = handlerList
  }

  async register () {
    for (let i = 0; i < handlerList.length; i++) {
      let Proto = require(path.join(handlersDir, handlerList[i]))
      let proto = new Proto({ modelAPI: this.modelAPI })
      this.networkProtocolsByHandler[handlerList[i]] = proto
      await proto.register(this.modelAPI.networkProtocols)
    }
  }

  clearProtocolMap () {
    this.networkProtocolsById = {}
    this.networkProtocolsByHandler = {}
  }

  clearProtocol ({ id }) {
    delete this.networkProtocolsById[id]
  }

  /**
   * @param network
   * @returns {Promise<Protocol>} - Protocol Handler for this network.
   */
  async getProtocol (network) {
    const { id: npId } = network.networkProtocol
    if (this.networkProtocolsById[npId]) return this.networkProtocolsById[npId]
    // We'll need the protocol for the network.
    const np = await appLogger.logOnThrow(
      () => this.modelAPI.networkProtocols.load(npId),
      err => `Failed to load network protocol code: ${err}`
    )
    const { protocolHandler: handler } = np
    if (this.networkProtocolsByHandler[handler]) {
      this.networkProtocolsById[npId] = this.networkProtocolsByHandler[handler]
      return this.networkProtocolsById[npId]
    }
    const Proto = require(`${handlersDir}/${np.protocolHandler}`)
    const proto = new Proto({ modelAPI: this.modelAPI })
    this.networkProtocolsById[npId] = this.networkProtocolsByHandler[handler] = proto
    return proto
  }

  /**
   *
   * @param network
   * @param loginData
   * @returns {Promise<any>}
   */
  async test (network) {
    if (!network.securityData.authorized) {
      throw httpError.Unauthorized()
    }
    const proto = await this.getProtocol(network)
    return proto.test(network)
  }

  /**
   *
   * @param network
   * @param loginData
   * @returns {Promise<any>} - Key, token, or connection data required to access the network
   */
  async connect (network) {
    const proto = await this.getProtocol(network)
    return proto.connect(network)
  }

  /**
   *
   * @param network - the network to disconnect from
   * @param account - to account to disconnect
   */
  async disconnect (network) {
    const proto = await this.getProtocol(network)
    return proto.disconnect(network)
  }

  // Add company.
  //
  // dataAPI   - Access to the data we may need to execute this operation.
  // network   - The network data.
  // companyId - The company Id for the company data to be propogated,.
  //
  // Returns a Promise that ostensibly connects to the remote system and creates
  // the company.  This may or may not do as promised (haha), and the
  // implementation is completely up to the developer of the protocol.  Options
  // include creating the company and an admin account for that company which
  // can be used in lower-level (application, device) methods, or simply ignoring
  // this call and using a global admin account to add applications and devices.
  async addCompany (dataAPI, network, companyId) {
    const proto = await this.getProtocol(network)
    return proto.addCompany(network, companyId, dataAPI)
  }

  // Push company.  If the company exists on the remote system, update it to match
  // the local data.  Otherwise, create it.
  //
  // dataAPI   - Access to the data we may need to execute this operation.
  // network   - The network data.
  // companyId - The company Id for the company data to be propogated,.
  //
  // Returns a Promise that ostensibly connects to the remote system and updates
  // or creates the remote company.  This may or may not do as promised (haha) -
  // the implementation is completely up to the developers of the protocols.
  async pushNetwork (dataAPI, network, modelAPI) {
    const proto = await this.getProtocol(network)
    return proto.pushNetwork(network, dataAPI, modelAPI)
  }

  // Pull company.  If the company exists on the remote system, update it to match
  // the local data.  Otherwise, create it.
  //
  // dataAPI   - Access to the data we may need to execute this operation.
  // network   - The network data.
  //
  // Returns a Promise that ostensibly connects to the remote system and updates
  // or creates the remote company.  This may or may not do as promised (haha) -
  // the implementation is completely up to the developers of the protocols.
  async pullNetwork (dataAPI, network, modelAPI) {
    const proto = await this.getProtocol(network)
    return proto.pullNetwork(network, dataAPI, modelAPI)
  }

  // Delete the company.
  //
  // dataAPI       - Access to the data we may need to execute this operation.
  // network       - The network data.
  // companyId     - The company Id for the company data to be deleted.
  //
  // Returns a Promise that gets the application record from the remote system.
  async deleteCompany (dataAPI, network, companyId) {
    const proto = await this.getProtocol(network)
    return proto.deleteCompany(network, companyId, dataAPI)
  }
  // Add application.
  //
  // dataAPI       - Access to the data we may need to execute this operation.
  // network       - The network data.
  // applicationId - The application Id for the application data to be propogated.
  //
  // Returns a Promise that connects to the remote system and creates the
  // application.
  async addApplication (dataAPI, network, applicationId) {
    const proto = await this.getProtocol(network)
    return proto.addApplication(network, applicationId, dataAPI)
  }

  // Push application.  If the application exists on the remote system, update it
  // to match the local data.  Otherwise, create it.
  //
  // dataAPI       - Access to the data we may need to execute this operation.
  // network       - The network data.
  // applicationId - The application Id for the application data to be propogated,.
  //
  // Returns a Promise that ostensibly connects to the remote system and updates
  // or creates the remote company.  This may or may not do as promised (haha) -
  // the implementation is completely up to the developers of the protocols.
  async pushApplication (dataAPI, network, application) {
    const proto = await this.getProtocol(network)
    return proto.pushApplication(network, application, dataAPI)
  }

  // Pull company.  If the company exists on the remote system, update it to match
  // the local data.  Otherwise, create it.
  //
  // dataAPI   - Access to the data we may need to execute this operation.
  // network   - The network data.
  //
  // Returns a Promise that ostensibly connects to the remote system and updates
  // or creates the remote company.  This may or may not do as promised (haha) -
  // the implementation is completely up to the developers of the protocols.
  // TODO: pullApplications? (plural)
  async pullApplication (dataAPI, network) {
    const proto = await this.getProtocol(network)
    return proto.getApplications(network, dataAPI)
  }

  // Delete the application.
  //
  // dataAPI       - Access to the data we may need to execute this operation.
  // network       - The network data.
  // applicationId - The application Id for the application data to be deleted,.
  //
  // Returns a Promise that deletes the application record from the remote system.
  async deleteApplication (dataAPI, network, applicationId) {
    const proto = await this.getProtocol(network)
    return proto.deleteApplication(network, applicationId, dataAPI)
  }
  // Start the application.
  //
  // expressApp      - The express application to send data to.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // companyData     - The companyNetworkTypeLinks record for this company and
  //                   network.
  // application     - The applicatiapions record.
  // applicationData - The applicationNetworkTypeLinks record for this Application
  //                   and network.
  // deliveryFunc    - The function to call with new data.
  //
  // Returns a Promise that starts the application data flowing from the remote
  // network to the application target.

  async startApplication (dataAPI, network, applicationId) {
    const proto = await this.getProtocol(network)
    return proto.startApplication(network, applicationId, dataAPI)
  }

  // Stop the application.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // companyData     - The companyNetworkTypeLinks record for this company and
  //                   network.
  // application     - The applications record.
  // applicationData - The applicationNetworkTypeLinks record for this Application
  //                   and network.
  //
  // Returns a Promise that stops the application data flowing from the remote
  // system.
  async stopApplication (dataAPI, network, applicationId) {
    const proto = await this.getProtocol(network)
    return proto.stopApplication(network, applicationId, dataAPI)
  }

  // Add device.
  //
  // dataAPI  - Access to the data we may need to execute this operation.
  // network  - The network data.
  // deviceId - The device Id for the device data to be propogated.
  //
  // Returns a Promise that connects to the remote system and creates the
  // device.
  async addDevice (dataAPI, network, deviceId) {
    const proto = await this.getProtocol(network)
    return proto.addDevice(network, deviceId, dataAPI)
  }

  // Push device.  If the device exists on the remote system, update it
  // to match the local data.  Otherwise, create it.
  //
  // dataAPI  - Access to the data we may need to execute this operation.
  // network  - The network data.
  // deviceId - The device Id for the device data to be propogated,.
  //
  // Returns a Promise that ostensibly connects to the remote system and updates
  // or creates the remote company.  This may or may not do as promised (haha) -
  // the implementation is completely up to the developers of the protocols.
  async pushDevice (dataAPI, network, device) {
    const proto = await this.getProtocol(network)
    return proto.pushDevice(network, device, dataAPI)
  }

  async pullDevices (dataAPI, network, applicationId) {
    const proto = await this.getProtocol(network)
    return proto.pullDevices(network, applicationId, dataAPI)
  }

  // Delete the device.
  //
  // dataAPI  - Access to the data we may need to execute this operation.
  // network  - The network data.
  // deviceId - The device Id for the device data to be deleted,.
  //
  // Returns a Promise that deletes the device record from the remote system.
  async deleteDevice (dataAPI, network, deviceId) {
    const proto = await this.getProtocol(network)
    return proto.deleteDevice(network, deviceId, dataAPI)
  }

  // Add deviceProfile.
  //
  // dataAPI         - Access to the data we may need to execute this operation.
  // network         - The network data.
  // deviceProfileId - The deviceProfile Id for the deviceProfile data to be propogated.
  //
  // Returns a Promise that connects to the remote system and creates the
  // deviceProfile.
  async addDeviceProfile (dataAPI, network, deviceProfileId) {
    const proto = await this.getProtocol(network)
    return proto.addDeviceProfile(network, deviceProfileId, dataAPI)
  }

  // Push deviceProfile.  If the deviceProfile exists on the remote system, update it
  // to match the local data.  Otherwise, create it.
  //
  // dataAPI         - Access to the data we may need to execute this operation.
  // network         - The network data.
  // deviceProfileId - The deviceProfile Id for the deviceProfile data to be propogated,.
  //
  // Returns a Promise that ostensibly connects to the remote system and updates
  // or creates the remote company.  This may or may not do as promised (haha) -
  // the implementation is completely up to the developers of the protocols.
  async pushDeviceProfile (dataAPI, network, deviceProfileId) {
    const proto = await this.getProtocol(network)
    return proto.pushDeviceProfile(network, deviceProfileId, dataAPI)
  }

  // Pull company.  If the company exists on the remote system, update it to match
  // the local data.  Otherwise, create it.
  //
  // dataAPI   - Access to the data we may need to execute this operation.
  // network   - The network data.
  //
  // Returns a Promise that ostensibly connects to the remote system and updates
  // or creates the remote company.  This may or may not do as promised (haha) -
  // the implementation is completely up to the developers of the protocols.
  async pullDeviceProfile (dataAPI, network, deviceProfileId) {
    const proto = await this.getProtocol(network)
    return proto.pullDeviceProfile(network, deviceProfileId, dataAPI)
  }

  // Delete the deviceProfile.
  //
  // dataAPI         - Access to the data we may need to execute this operation.
  // network         - The network data.
  // deviceProfileId - The deviceProfile Id for the deviceProfile data to be deleted,.
  //
  // Returns a Promise that deletes the deviceProfile record from the remote system.
  async deleteDeviceProfile (dataAPI, network, deviceProfileId) {
    const proto = await this.getProtocol(network)
    return proto.deleteDeviceProfile(network, deviceProfileId, dataAPI)
  }

  // Pass data to devices
  async passDataToDevice (dataAPI, network, appId, deviceId, data) {
    const proto = await this.getProtocol(network)
    return proto.passDataToDevice(network, appId, deviceId, data, dataAPI)
  }
}
