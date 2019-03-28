// General libraries in use in this module.
const appLogger = require('../lib/appLogger.js')
const path = require('path')
const R = require('ramda')
const handlersDir = path.join(__dirname, 'handlers')
const httpError = require('http-errors')

// ******************************************************************************
// Defines the generic cross-network API, and manages the network protocols
// for the upper layers.
// ******************************************************************************

const handlers = [
  'LoraOpenSource/v1',
  'LoraOpenSource/v2',
  'TheThingsNetwork/v2'
]

/**
 * Defines the generic cross-network API, and manages the network protocols
 * for the upper layers.
 * @class NetworkProtocolAccess
 */

module.exports = class NetworkProtocolAccess {
  // Constructor - gets the database API for the networkProtocols
  constructor (modelAPI) {
    this.npAPI = modelAPI.networkProtocols
    this.modelAPI = modelAPI
    this.networkProtocolMap = {}
  }

  async register () {
    for (let i = 0; i < handlers.length; i++) {
      let Proto = require(path.join(handlersDir, handlers[i]))
      let proto = new Proto()
      await proto.register(this.npAPI)
    }
  }

  clearProtocolMap () {
    this.networkProtocolMap = {}
  }

  clearProtocol ({ id }) {
    if (this.networkProtocolMap[id]) delete this.networkProtocolMap[id]
  }

  /**
   * @param network
   * @returns {Promise<Protocol>} - Protocol Handler for this network.
   */
  async getProtocol (network) {
    const { id } = network.networkProtocol
    const npMap = this.networkProtocolMap
    if (npMap[id]) return npMap[id]
    // We'll need the protocol for the network.
    const np = await appLogger.logOnThrow(
      () => this.npAPI.retrieveNetworkProtocol(network.networkProtocol.id),
      err => `Failed to load network protocol code: ${err}`
    )
    const NetworkProtocol = require(`${handlersDir}/${np.protocolHandler}`)
    npMap[id] = {
      sessionData: {},
      api: new NetworkProtocol()
    }
    return npMap[id]
  }

  /**
   *
   * @param network
   * @param loginData
   * @returns {Promise<any>}
   */
  async test (network, dataAPI) {
    if (!network.securityData.authorized) {
      throw httpError.Unauthorized()
    }
    const getAccess = proto => proto.api.getCompanyAccessAccount(network, dataAPI)
    const { proto, session } = await this.getSession(network, getAccess)
    const body = await proto.api.test(session, network)
    appLogger.log(body)
  }

  /**
   *
   * @param network
   * @param loginData
   * @returns {Promise<any>} - Key, token, or connection data required to access the network
   */
  async connect (network, loginData) {
    appLogger.log('Inside NPA connect')
    appLogger.log(JSON.stringify(loginData))
    const proto = await this.getProtocol(network)
    const connection = await proto.api.connect(network, loginData)
    if (!proto.sessionData[network.id]) proto.sessionData[network.id] = {}
    proto.sessionData[network.id].connection = connection
    return connection
  }

  /**
   *
   * @param network - the network to disconnect from
   * @param account - to account to disconnect
   */
  disconnect (network) {
    const { id } = network.networkProtocol
    const npMap = this.networkProtocolMap
    if (!npMap[id] || !npMap[id].sessionData[network.id]) return
    npMap[id].api.disconnect(npMap[id].sessionData[network.id]).catch(() => {})
    delete npMap[id].sessionData[network.id]
  }

  // For methods that require sessions, make sure./rest/networkProtocols/ we have a current one for the
  // network/login.  If not log in.  Then try running protocolFunc with the
  // protocol and the session data.  If the first attempt fails with 401
  // (unauthorized), try logging in again, assuming the previous login expired,
  // and try the func one more time.
  async sessionWrapper (network, loginData) {
    const updateNetworkSecurityData = async (network, connection) => {
      if (typeof connection === 'object') {
        Object.assign(network.securityData, connection)
      }
      network.securityData.authorized = true
      await this.modelAPI.networks.updateNetwork(R.pick(['id', 'securityData'], network))
    }
    const proto = await this.getProtocol(network)
    try {
      // Get the protocol, use the session to make the call to the
      // network's protocol code.
      if (!network.securityData.authorized) {
        // Wait, we don't have a session.  Just log in.
        appLogger.log('No session for login, connecting...')
        await this.connect(network, loginData)
        await updateNetworkSecurityData(network, proto.sessionData[network.id].connection)
      }
      if (!proto.sessionData) proto.sessionData = {}
      if (!proto.sessionData[network.id]) {
        // Why is loginData, which is used to get a connection, being assigned as the connection?
        proto.sessionData[network.id] = {
          connection: loginData
        }
      }
      return proto
    }
    catch (err) {
      if (err !== 401) throw err
      try {
        appLogger.log('Session expired(?), reconnecting...')
        await this.connect(network, loginData)
        appLogger.log('Reconnected session...')
        await updateNetworkSecurityData(network, proto.sessionData[network.id].connection)
        return proto
      }
      catch (err) {
        // Error again, just report
        appLogger.log('Access failure with ' + network.name + ': ' + err)
        network.securityData.authorized = false
        await this.modelAPI.networks.updateNetwork(network)
        throw err
      }
    }
  }

  async getSession (network, getAccess) {
    const netProto = await this.getProtocol(network)
    const loginData = await appLogger.logOnThrow(
      () => getAccess(netProto),
      err => 'Unable to get login data for' + network.name + ': ' + err
    )
    const proto = await this.sessionWrapper(network, loginData)
    return {
      proto,
      session: proto.sessionData[network.id]
    }
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
    const getAccess = proto => proto.api.getCompanyAccessAccount(network, dataAPI)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.addCompany(session, network, companyId, dataAPI)
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
    const getAccess = proto => proto.api.getCompanyAccessAccount(network, dataAPI)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.pushNetwork(session, network, dataAPI, modelAPI)
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
    const getAccess = proto => proto.api.getCompanyAccessAccount(network, dataAPI)
    const { proto, session } = await this.getSession(network, getAccess)
    appLogger.log(`networkProtcols: pullNetwork: session: ${JSON.stringify(session)}`)
    return proto.api.pullNetwork(session, network, dataAPI, modelAPI)
  }

  // Delete the company.
  //
  // dataAPI       - Access to the data we may need to execute this operation.
  // network       - The network data.
  // companyId     - The company Id for the company data to be deleted.
  //
  // Returns a Promise that gets the application record from the remote system.
  async deleteCompany (dataAPI, network, companyId) {
    const getAccess = proto => proto.api.getCompanyAccessAccount(network, dataAPI)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.deleteCompany(session, network, companyId, dataAPI)
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
    const getAccess = proto => proto.api.getApplicationAccessAccount(network, dataAPI, applicationId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.addApplication(session, network, applicationId, dataAPI)
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
    const getAccess = proto => proto.api.getApplicationAccessAccount(network, dataAPI, application.id)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.pushApplication(session, network, application, dataAPI)
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
    const getAccess = proto => proto.api.getCompanyAccessAccount(network, dataAPI)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.getApplications(session, network, dataAPI)
  }

  // Delete the application.
  //
  // dataAPI       - Access to the data we may need to execute this operation.
  // network       - The network data.
  // applicationId - The application Id for the application data to be deleted,.
  //
  // Returns a Promise that deletes the application record from the remote system.
  async deleteApplication (dataAPI, network, applicationId) {
    const getAccess = proto => proto.api.getApplicationAccessAccount(network, dataAPI, applicationId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.deleteApplication(session, network, applicationId, dataAPI)
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
    const getAccess = proto => proto.api.getApplicationAccessAccount(network, dataAPI, applicationId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.startApplication(session, network, applicationId, dataAPI)
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
    const getAccess = proto => proto.api.getApplicationAccessAccount(network, dataAPI, applicationId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.stopApplication(session, network, applicationId, dataAPI)
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
    const getAccess = proto => proto.api.getDeviceAccessAccount(network, dataAPI, deviceId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.addDevice(session, network, deviceId, dataAPI)
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
    const getAccess = proto => proto.api.getDeviceAccessAccount(network, dataAPI, device.id)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.pushDevice(session, network, device, dataAPI)
  }

  async pullDevices (dataAPI, network, applicationId) {
    const getAccess = proto => proto.api.getCompanyAccessAccount(network, dataAPI)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.pullDevices(session, network, applicationId, dataAPI)
  }

  // Delete the device.
  //
  // dataAPI  - Access to the data we may need to execute this operation.
  // network  - The network data.
  // deviceId - The device Id for the device data to be deleted,.
  //
  // Returns a Promise that deletes the device record from the remote system.
  async deleteDevice (dataAPI, network, deviceId) {
    const getAccess = proto => proto.api.getDeviceAccessAccount(network, dataAPI, deviceId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.deleteDevice(session, network, deviceId, dataAPI)
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
    const getAccess = proto => proto.api.getDeviceProfileAccessAccount(network, dataAPI, deviceProfileId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.addDeviceProfile(session, network, deviceProfileId, dataAPI)
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
    const getAccess = proto => proto.api.getDeviceProfileAccessAccount(network, dataAPI, deviceProfileId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.pushDeviceProfile(session, network, deviceProfileId, dataAPI)
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
    const getAccess = proto => proto.api.getCompanyAccessAccount(network, dataAPI)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.pullDeviceProfile(session, network, deviceProfileId, dataAPI)
  }

  // Delete the deviceProfile.
  //
  // dataAPI         - Access to the data we may need to execute this operation.
  // network         - The network data.
  // deviceProfileId - The deviceProfile Id for the deviceProfile data to be deleted,.
  //
  // Returns a Promise that deletes the deviceProfile record from the remote system.
  async deleteDeviceProfile (dataAPI, network, deviceProfileId) {
    const getAccess = proto => proto.api.getDeviceProfileAccessAccount(network, dataAPI, deviceProfileId)
    const { proto, session } = await this.getSession(network, getAccess)
    return proto.api.deleteDeviceProfile(session, network, deviceProfileId, dataAPI)
  }
}
