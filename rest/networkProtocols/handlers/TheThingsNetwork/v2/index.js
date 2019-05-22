const NetworkProtocol = require('../../../NetworkProtocol')
const appLogger = require('../../../../lib/appLogger')
const uuid = require('uuid/v1')
const R = require('ramda')
const { tryCatch, renameKeys } = require('../../../../lib/utils')
// const config = require('../../../../config')
const ApiClient = require('./client')

// const HTTP_INTEGRATION_PROCESS_ID = 'lpwanserver-httppush'

/**********************************************************************************************************************
 * Bookeeping: Register, Test, Connect
 *********************************************************************************************************************/
/**
 * The Things Network Protocol Handler Module
 * @module networkProtocols/The Things Network
 * @see module:networkProtocols/networkProtocols
 */

module.exports = class TheThingsNetworkV2 extends NetworkProtocol {
  constructor (opts) {
    super(opts)
    this.client = new ApiClient()
    this.networkProtocolId = opts.networkProtocolId
    this.client.on('uplink', x => this.modelAPI.applications.passDataToApplication(x.appId, x.networkId, x.payload))
    this.subscribeToDataForEnabledApps()
  }

  async subscribeToDataForEnabledApps () {
    const antlQuery = { networkType: { id: 1 } }
    const { records: antls } = await this.modelAPI.applicationNetworkTypeLinks.list(antlQuery)
    let appIds = antls.map(R.path(['application', 'id']))
    const networkQuery = { networkProtocol: { id: this.networkProtocolId } }
    const { records: networks } = await this.modelAPI.networks.list(networkQuery)
    try {
      const promises = R.flatten(networks.map(nwk => appIds.map(id => this.startApplication(nwk, id))))
      await Promise.all(promises)
    }
    catch (err) {
      appLogger.log(`Error subscribing to TTN data: ${err}`, 'error')
    }
  }

  /**
   * Test the network to verify it functions correctly.
   *
   * @param network - network to test
   * @param loginData - credentials
   * @returns {Promise<any>}
   */
  async test (network) {
    await this.client.listApplications(network)
    return true
  }

  /**
   * Connect with the remote The Things Network network
   * @param network - The networks record for the The Things Network network
   * @param loginData -
   * @returns {Promise<BearerToken>}
   */
  async connect (network) {
    const sd = network.securityData
    if (!((sd.username && sd.password) && !(sd.code && sd.redirect_uri))) {
      const error = new Error('LPWan does not have credentials for TTN')
      error.code = 42
      throw error
    }
    await this.client.getSession(network)
  }

  /**
   * Pull remote resources on TTN v2.0 Server
   *
   * @param network - network information
   * @param dataAPI - id mappings
   * @param modelAPI - DB access
   * @returns {Promise<Empty>}
   */
  async pullNetwork (network, dataAPI, modelAPI) {
    try {
      const apps = await this.pullApplications(network, modelAPI, dataAPI)
      const devices = await Promise.all(apps.map(x =>
        this.pullDevices(network, x.remoteApplication, x.localApplication, {}, modelAPI, dataAPI)
      ))
      appLogger.log(devices, 'info')
      appLogger.log('Success Pulling Network ' + network.name, 'info')
    }
    catch (err) {
      appLogger.log(err, 'error')
      throw err
    }
  }

  /**
   * Pull remote applications on TTN V1.
   * 1. Pulls application on TTN Account Server
   * 2. Pulls specific application from US-West Handler
   *
   * @param network
   * @param dataAPI
   * @param modelAPI
   * @returns {Promise<Array[Remote to Local Application Id Mapping]>}
   */
  async pullApplications (network, modelAPI, dataAPI) {
    try {
      const apps = await this.client.listApplications(network)
      return Promise.all(apps.map(x => this.addRemoteApplication(x, network, modelAPI, dataAPI)))
    }
    catch (e) {
      appLogger.log('Error pulling applications from network ' + network.name + ': ' + e)
      throw e
    }
  }

  async addRemoteApplication (accountServerApp, network, modelAPI, dataAPI) {
    try {
      let handlerApp = await this.client.loadHandlerApplication(network, accountServerApp.id)
      let integration
      try {
        // integration = await this.client.loadApplicationIntegration(network, accountServerApp.id, HTTP_INTEGRATION_PROCESS_ID)
      }
      catch (err) {
        if (err.statusCode !== 404) throw err
      }
      let normalizedApplication = this.normalizeApplicationData(handlerApp, accountServerApp, network)
      const { records: localApps } = await modelAPI.applications.list({ search: accountServerApp.name })
      let localApp = localApps[0]
      if (!localApp) {
        const localAppData = {
          ...R.pick(['name', 'description'], normalizedApplication),
          companyId: 2,
          reportingProtocolId: 1
        }
        if (integration) localAppData.baseUrl = integration.settings.TTI_URL
        localApp = await modelAPI.applications.create(localAppData)
        appLogger.log('Created ' + localApp.name)
      }

      let { records: appNtls } = await modelAPI.applicationNetworkTypeLinks.list({ applicationId: localApp.id })
      let appNtl = appNtls[0]
      if (!appNtl) {
        appNtl = await modelAPI.applicationNetworkTypeLinks.create(
          {
            applicationId: localApp.id,
            networkTypeId: network.networkType.id,
            networkSettings: normalizedApplication
          },
          {
            companyId: localApp.company.id,
            remoteOrigin: true
          }
        )
        await this.modelAPI.protocolData.upsert(network, makeApplicationDataKey(localApp.id, 'appNwkId'), normalizedApplication.id)
      }
      if (localApp.baseUrl) await this.startApplication(network, localApp.id)
      return { localApplication: localApp, remoteApplication: normalizedApplication }
    }
    catch (e) {
      appLogger.log(e, 'error')
      throw e
    }
  }

  /**
   * Pull remote devices from a TTN server
   * @param network
   * @param companyId
   * @param dpMap
   * @param remoteApplicationId
   * @param applicationId
   * @param dataAPI
   * @param modelAPI
   * @returns {Promise<any>}
   */
  async pullDevices (network, remoteApp, localApp, dpMap, modelAPI, dataAPI) {
    try {
      const { devices = [] } = await this.client.listDevices(network, remoteApp.id)
      await Promise.all(devices.map(device => {
        return this.addRemoteDevice(device, network, localApp.id, dpMap, modelAPI, dataAPI)
      }))
      return devices
    }
    catch (e) {
      appLogger.log('Error pulling devices from network ' + network.name, 'error')
      appLogger.log(e, 'error')
      throw e
    }
  }

  async addRemoteDevice (remoteDevice, network, localAppId, dpMap, modelAPI, dataAPI) {
    appLogger.log('Adding ' + remoteDevice.deveui)
    appLogger.log(remoteDevice)
    let existingDevice = await modelAPI.devices.list({ search: remoteDevice.lorawan_device.dev_eui })

    appLogger.log(existingDevice)
    if (existingDevice.totalCount > 0) {
      existingDevice = existingDevice.records[0]
      appLogger.log(existingDevice.name + ' already exists')
    }
    else {
      appLogger.log('creating ' + remoteDevice.lorawan_device.dev_eui)
      existingDevice = await modelAPI.devices.create(remoteDevice.lorawan_device.dev_eui, remoteDevice.description, localAppId)
      appLogger.log('Created ' + existingDevice.name)
    }

    let existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.list({ deviceId: existingDevice.id })
    let existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.load(localAppId)

    if (existingDeviceNTL.totalCount > 0) {
      appLogger.log(existingDevice.name + ' link already exists')
      return { localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id }
    }
    appLogger.log('creating Network Link for ' + existingDevice.name)
    try {
      const dp = await this.addRemoteDeviceProfile(remoteDevice, existingApplicationNTL, network, modelAPI, dataAPI)
      appLogger.log(dp, 'info')
      let normalizedDevice = this.normalizeDeviceData(remoteDevice, dp.localDeviceProfile)
      appLogger.log(normalizedDevice)
      const existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.create(existingDevice.id, network.networkType.id, dp.localDeviceProfile, normalizedDevice, 2, { remoteOrigin: true })
      appLogger.log(existingDeviceNTL)
      await this.modelAPI.protocolData.upsert(network, makeDeviceDataKey(existingDevice.id, 'devNwkId'), remoteDevice.dev_id)
      appLogger.log({ localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id })
      return { localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id }
    }
    catch (e) {
      appLogger.log(e, 'error')
      throw e
    }
  }

  async addRemoteDeviceProfile (remoteDevice, application, network, modelAPI) {
    let networkSpecificDeviceProfileInformation = this.normalizeDeviceProfileData(remoteDevice, application)
    appLogger.log(networkSpecificDeviceProfileInformation, 'error')
    try {
      const existingDeviceProfile = await modelAPI.deviceProfiles.create(
        network.networkType.id,
        2,
        networkSpecificDeviceProfileInformation.name,
        'Device Profile managed by LPWAN Server, perform changes via LPWAN',
        networkSpecificDeviceProfileInformation,
        { remoteOrigin: true }
      )
      return {
        localDeviceProfile: existingDeviceProfile.id,
        remoteDeviceProfile: existingDeviceProfile.id
      }
    }
    catch (e) {
      appLogger.log(e)
      throw e
    }
  }

  /**
   * Push all information out to the network server
   *
   * @param network
   * @param dataAPI
   * @param modelAPI
   * @returns {Promise<any>}
   */
  async pushNetwork (network, dataAPI, modelAPI) {
    try {
      await this.pushApplications(network, dataAPI, modelAPI)
      const pushedResource = await this.pushDevices(network, dataAPI, modelAPI)
      appLogger.log('Success Pushing Network ' + network.name, 'info')
      appLogger.log(pushedResource, 'info')
    }
    catch (e) {
      appLogger.log(e, 'error')
      throw e
    }
  }

  async pushApplications (network, dataAPI, modelAPI) {
    try {
      let existingApplications = await modelAPI.applications.list()
      appLogger.log(existingApplications, 'info')
      const pushedResources = await Promise.all(existingApplications.records.map(record => {
        return this.pushApplication(network, record, dataAPI, modelAPI)
      }))
      appLogger.log('Success Pushing Applications', 'info')
      appLogger.log(pushedResources, 'info')
      return pushedResources
    }
    catch (e) {
      appLogger.log(e, 'error')
      throw e
    }
  }

  async pushApplication (network, application, dataAPI, modelAPI) {
    appLogger.log(application, 'error')
    const badProtocolTableError = new Error('Bad things in the Protocol Table')
    try {
      // See if it already exists
      const appNetworkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(application.id, 'appNwkId'))
      if (!appNetworkId) {
        throw badProtocolTableError
      }
      appLogger.log('Ignoring Application  ' + application.id + ' already on network ' + network.name + ' as ' + appNetworkId, 'info')
      return { localApplication: application.id, remoteApplication: appNetworkId }
    }
    catch (e) {
      if (e === badProtocolTableError) throw e
      try {
        appLogger.log('Pushing Application ' + application.name, 'info')
        const appNetworkId = await this.addApplication(network, application.id, dataAPI, modelAPI)
        appLogger.log('Added application ' + application.id + ' to network ' + network.name, 'info')
        return { localApplication: application.id, remoteApplication: appNetworkId }
      }
      catch (err) {
        appLogger.log(err, 'error')
        throw err
      }
    }
  }

  async pushDevices (network, dataAPI, modelAPI) {
    try {
      let existingDevices = await modelAPI.devices.list()
      const pushedResources = await Promise.all(existingDevices.records.map(record => {
        return this.pushDevice(network, record, dataAPI)
      }))
      appLogger.log(pushedResources)
      return pushedResources
    }
    catch (e) {
      appLogger.log(e, 'error')
      throw e
    }
  }

  async pushDevice (network, device, dataAPI) {
    const badProtocolTableError = new Error('Something bad happened with the Protocol Table')
    try {
      const devNetworkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(device.id, 'devNwkId'))
      appLogger.log('Ignoring Device  ' + device.id + ' already on network ' + network.name, 'info')
      if (devNetworkId) {
        return { localDevice: device.id, remoteDevice: devNetworkId }
      }
      appLogger.log(devNetworkId + ' found for network ' + network.name + ' for device ' + device.id, 'info')
      throw badProtocolTableError
    }
    catch (e) {
      if (e === badProtocolTableError) throw e
      try {
        appLogger.log('Adding Device  ' + device.id + ' to network ' + network.name, 'info')
        const devNetworkId = await this.addDevice(network, device.id, dataAPI)
        appLogger.log('Added Device  ' + device.id + ' to network ' + network.name, 'info')
        return { localDevice: device.id, remoteDevice: devNetworkId }
      }
      catch (err) {
        appLogger.log(err, 'error')
        throw err
      }
    }
  }

  /**
   * @desc Add a new application to the The Things Network network
   *
   * @param network - The networks record for the The Things Network network
   * @param applicationId - The application id for the application to create on the The Things Network network
   * @param dataAPI - access to the data records and error tracking
   * @returns {Promise<string>} - Remote (The Things Network) id of the new application
   */
  async addApplication (network, applicationId, dataAPI, modelAPI) {
    let application
    let applicationData
    try {
      // Get the local application data.
      application = await dataAPI.getApplicationById(applicationId)
      applicationData = await dataAPI.getApplicationNetworkType(applicationId, network.networkType.id)
    }
    catch (err) {
      appLogger.log('Failed to get required data for addApplication: ' + applicationId, 'error')
      throw err
    }
    let { handlerApp, accountServerApp } = this.deNormalizeApplicationData(applicationData.networkSettings, application)
    try {
      accountServerApp = await this.client.createApplication(network, accountServerApp)
      applicationData.networkSettings.applicationEUI = accountServerApp.euis[0]
      appLogger.log(applicationData, 'error')
      await modelAPI.applicationNetworkTypeLinks.update(applicationData, { companyId: 2, remoteOrigin: true })
      await this.modelAPI.protocolData.upsert(network, makeApplicationDataKey(application.id, 'appNwkId'), accountServerApp.id)
      return this.registerApplicationWithHandler(network, handlerApp, accountServerApp, dataAPI)
    }
    catch (err) {
      appLogger.log('Error on create application: ' + err, 'error')
      appLogger.log(err, 'error')
      throw err
    }
  }

  /**
   * @desc get an application from the The Things Network network
   *
   * @param network - The networks record for the The Things Network network
   * @param applicationId - The application id to fetch from the The Things Network network
   * @param dataAPI - access to the data records and error tracking
   * @returns {Promise<Application>} - Remote application data
   */
  async getApplication (network, applicationId) {
    try {
      let appNetworkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(applicationId, 'appNwkId'))
      return this.client.loadApplication(network, appNetworkId)
    }
    catch (e) {
      appLogger.log('Error on get application: ' + e, 'error')
      throw e
    }
  }

  /**
   * @desc Update an application on the The Things Network network
   *
   * @param network - The networks record for the The Things Network network
   * @param applicationId - The application id for the application to update on the The Things Network network
   * @param dataAPI - access to the data records and error tracking
   * @returns {Promise<?>} - Empty promise means application was updated on The Things Network network
   */
  async updateApplication (network, applicationId, dataAPI) {
    try {
      // Get the application data.
      let application = await dataAPI.getApplicationById(applicationId)
      let coNetworkId = await this.modelAPI.protocolData.loadValue(network, makeCompanyDataKey(application.company.id, 'coNwkId'))
      let appNetworkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(applicationId, 'appNwkId'))
      let applicationData = await dataAPI.getApplicationNetworkType(applicationId, network.networkType.id)

      // build body
      const body = {
        'id': appNetworkId,
        'name': application.name,
        'organizationID': coNetworkId,
        'description': 'This Application is Managed by LPWanServer',
        'payloadCodec': '',
        'payloadDecoderScript': '',
        'payloadEncoderScript': ''
      }

      // Optional data
      if (applicationData && applicationData.networkSettings) {
        if (applicationData.networkSettings.isABP) {
          body.isABP = applicationData.networkSettings.isABP
        }
        if (applicationData.networkSettings.isClassC) {
          body.isClassC = applicationData.networkSettings.isClassC
        }
        if (applicationData.networkSettings.relaxFCnt) {
          body.relaxFCnt = applicationData.networkSettings.relaxFCnt
        }
        if (applicationData.networkSettings.rXDelay) {
          body.rXDelay = applicationData.networkSettings.rXDelay
        }
        if (applicationData.networkSettings.rX1DROffset) {
          body.rX1DROffset = applicationData.networkSettings.rX1DROffset
        }
        if (applicationData.networkSettings.rXWindow) {
          body.rXWindow = applicationData.networkSettings.rXWindow
        }
        if (applicationData.networkSettings.rX2DR) {
          body.rX2DR = applicationData.networkSettings.rX2DR
        }
        if (applicationData.networkSettings.aDRInterval) {
          body.aDRInterval = applicationData.networkSettings.aDRInterval
        }
        if (applicationData.networkSettings.installationMargin) {
          body.installationMargin = applicationData.networkSettings.installationMargin
        }
        if (applicationData.networkSettings.payloadCodec && applicationData.networkSettings.payloadCodec !== 'NONE') {
          body.payloadCodec = applicationData.networkSettings.payloadCodec
        }
        if (applicationData.networkSettings.payloadDecoderScript) {
          body.payloadDecoderScript = applicationData.networkSettings.payloadDecoderScript
        }
        if (applicationData.networkSettings.payloadEncoderScript) {
          body.payloadEncoderScript = applicationData.networkSettings.payloadEncoderScript
        }
      }

      appLogger.log(application)
      appLogger.log(applicationData)

      await this.client.updateApplication(network, appNetworkId, body)
      return
    }
    catch (e) {
      appLogger.log('Error on update application: ', 'error')
      throw e
    }
  }

  /**
   * @desc Delete an application to the The Things Network network
   *
   * @param network - The networks record for the The Things Network network
   * @param applicationId - The application id for the application to delete on the The Things Network network
   * @param dataAPI - access to the data records and error tracking
   * @returns {Promise<?>} - Empty promise means the application was deleted.
   */
  async deleteApplication (network, applicationId, dataAPI) {
    try {
      // Get the application data.
      let appNetworkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(applicationId, 'appNwkId'))
      await this.client.deleteAccountApplication(network, appNetworkId)
      await dataAPI.deleteProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(applicationId, 'appNwkId')
      )
    }
    catch (err) {
      appLogger.log('Error on delete application: ', 'error')
      throw err
    }
  }

  // Start the application.
  //
  // network       - The networks record for the network that uses this
  // applicationId - The application's record id.
  //
  // Returns a Promise that starts the application data flowing from the remote
  // system.
  async startApplication (network, appId) {
    const appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(appId, 'appNwkId'))
    await this.client.subscribeToApplicationData(network, appNwkId)
  }

  // Stop the application.
  //
  // network       - The networks record for the network that uses this protocol.
  // applicationId - The local application's id to be stopped.
  //
  // Returns a Promise that stops the application data flowing from the remote
  // system.
  async stopApplication (network, appId) {
    const appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(appId, 'appNwkId'))
    await this.client.unsubscribeFromApplicationData(network, appNwkId)
  }

  async postSingleDevice (network, device, deviceProfile, application, remoteApplicationId, dataAPI) {
    try {
      console.log('******postSingleDevice******')
      console.log(JSON.stringify(device, null, 2))
      let ttnDevice = this.deNormalizeDeviceData(device.networkSettings, deviceProfile.networkSettings, application.networkSettings, remoteApplicationId)
      delete ttnDevice.attributes
      await this.client.createDevice(network, ttnDevice.app_id, ttnDevice)
      await this.modelAPI.protocolData.upsert(network, makeDeviceDataKey(device.id, 'devNwkId'), ttnDevice.dev_id)
      return ttnDevice.dev_id
    }
    catch (err) {
      appLogger.log('Error on create device: ', 'error')
      throw err
    }
  }

  async addDevice (network, deviceId, dataAPI) {
    let result
    let promiseList = [
      // dataAPI.getDeviceById(deviceId),
      dataAPI.getDeviceNetworkType(deviceId, network.networkType.id),
      dataAPI.getDeviceProfileByDeviceIdNetworkTypeId(deviceId, network.networkType.id),
      dataAPI.getApplicationByDeviceId(deviceId)
    ]
    try {
      result = await tryCatch(Promise.all(promiseList))
      if (result[0]) {
        appLogger.log('Could not retrieve local device, dntl, and device profile: ', 'error')
        throw new Error('Could not retrieve local device, dntl, and device profile: ')
      }
      let [dntl, deviceProfile, application] = result[1]
      result = await tryCatch(dataAPI.getApplicationNetworkType(application.id, network.networkType.id))
      if (result[0]) {
        appLogger.log('Could not retrieve application ntl: ', 'error')
        throw new Error('Could not retrieve application ntl')
      }
      const applicationData = result[1]
      result = await tryCatch(this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(application.id, 'appNwkId')))
      if (result[0]) {
        appLogger.log('Error fetching Remote Application Id', 'error')
        throw result[0]
      }
      const remoteApplicationId = result[1]
      appLogger.log('Moment of Truth', 'error')
      const postDeviceResult = await this.postSingleDevice(network, dntl, deviceProfile, applicationData, remoteApplicationId, dataAPI)
      appLogger.log('Success Adding Device ' + ' to ' + network.name, 'info')
      return postDeviceResult
    }
    catch (err) {
      appLogger.log(err, 'error')
      throw err
    }
  }

  /**
   * @desc get a device from the The Things Network network
   *
   * @param network - The networks record for the The Things Network network
   * @param deviceId - The device id to fetch from the The Things Network network
   * @param dataAPI - access to the data records and error tracking
   * @returns {Promise<Application>} - Remote device data
   */
  async getDevice (network, deviceId) {
    try {
      let devNetworkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(deviceId, 'devNwkId'))
      return this.client.loadDevice(network, devNetworkId)
    }
    catch (err) {
      appLogger.log('Error on get device: ', 'error')
      throw err
    }
  }

  /**
   * @desc Update a device on the The Things Network network
   *
   * @param network - The networks record for the The Things Network network
   * @param applicationId - The device id for the device to update on the The Things Network network
   * @param dataAPI - access to the data records and error tracking
   * @returns {Promise<?>} - Empty promise means device was updated on The Things Network network
   */
  async updateDevice (network, deviceId, dataAPI) {
    let device
    let devNetworkId
    let appNwkId
    let dpNwkId
    let dntl
    try {
      // Get the device data.
      device = await dataAPI.getDeviceById(deviceId)
      let dp = await dataAPI.getDeviceProfileByDeviceIdNetworkTypeId(deviceId, network.networkType.id)
      dntl = await dataAPI.getDeviceNetworkType(deviceId, network.networkType.id)
      devNetworkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(deviceId, 'devNwkId'))
      appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(device.application.id, 'appNwkId'))
      dpNwkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceProfileDataKey(dp.id, 'dpNwkId'))
    }
    catch (err) {
      appLogger.log('Failed to get supporting data for updateDevice: ' + err)
      throw err
    }

    try {
      await this.client.updateDevice(network, devNetworkId, {
        'applicationID': appNwkId,
        'description': device.name,
        'devEUI': dntl.networkSettings.devEUI,
        'deviceProfileID': dpNwkId,
        'name': device.name
      })
      // Devices have a separate API for appkeys...
      try {
        await this.client.updateDeviceKeys(network, dntl.networkSettings.devEUI, {
          'devEUI': dntl.networkSettings.devEUI,
          'deviceKeys': {
            'appKey': dntl.networkSettings.appKey
          }
        })
      }
      catch (err) {
        appLogger.log('Error on update device keys: ', 'error')
        throw err
      }
    }
    catch (err) {
      appLogger.log('Error on update device: ', 'error')
      throw err
    }
  }

  /**
   * @desc Delete a device to the The Things Network network
   *
   * @param network - The networks record for the The Things Network network
   * @param applicationId - The device id for the device to delete on the The Things Network network
   * @param dataAPI - access to the data records and error tracking
   * @returns {Promise<?>} - Empty promise means the device was deleted.
   */
  async deleteDevice (network, deviceId, dataAPI) {
    let devNetworkId
    try {
      devNetworkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(deviceId, 'devNwkId'))
    }
    catch (err) {
      // Can't delete without the remote ID.
      appLogger.log("Failed to get remote network's device ID: " + err)
      throw err
    }

    try {
      await this.client.deleteDevice(network, devNetworkId)
      // Deleted device, network key is no longer valid.
      try {
        await dataAPI.deleteProtocolDataForKey(
          network.id,
          network.networkProtocol.id,
          makeDeviceDataKey(deviceId, 'devNwkId'))
      }
      catch (err) {
        appLogger.log("Failed to delete remote network's device ID: " + err)
      }
      // Devices have a separate API for appkeys...
      await this.client.deleteDeviceKeys(network, devNetworkId)
    }
    catch (err) {
      appLogger.log('Error on delete device: ', 'error')
      throw err
    }
  }

  /**
   * Device Profiles are not supported by The Things Network
   *
   * @param network
   * @param deviceProfileId
   * @param dataAPI
   * @returns {Error}
   */
  addDeviceProfile () {
    appLogger.log('The Things Network: addDeviceProfile')
    appLogger.log('Device Profiles are not supported by The Things Network')
    let error = new Error('Device Profiles are not supported by The Things Network')
    appLogger.log('Error on addDeviceProfile: ', 'error')
    return (error)
  }

  /**
   * Device Profiles are not supported by The Things Network
   * @param network
   * @param deviceProfileId
   * @param dataAPI
   * @returns {Error}
   */
  getDeviceProfile () {
    appLogger.log('The Things Network: getDeviceProfile')
    appLogger.log('Device Profiles are not supported by The Things Network')
    let error = new Error('Device Profiles are not supported by The Things Network')
    appLogger.log('Error on getDeviceProfile: ', 'error')
    return (error)
  }

  /**
   * Device Profiles are not supported by The Things Network
   * @param network
   * @param deviceProfileId
   * @param dataAPI
   * @returns {Error}
   */
  updateDeviceProfile () {
    appLogger.log('The Things Network: updateDeviceProfile')
    appLogger.log('Device Profiles are not supported by The Things Network')
    let error = new Error('Device Profiles are not supported by The Things Network')
    appLogger.log('Error on updateDeviceProfile: ', 'error')
    return (error)
  }

  /**
   * Device Profiles are not supported by The Things Network
   * @param network
   * @param deviceProfileId
   * @param dataAPI
   * @returns {Error}
   */
  deleteDeviceProfile () {
    appLogger.log('The Things Network: deleteDeviceProfile')
    appLogger.log('Device Profiles are not supported by The Things Network')
    let error = new Error('Device Profiles are not supported by The Things Network')
    appLogger.log('Error on deleteDeviceProfile: ', 'error')
    return (error)
  }

  /**
   * Device Profiles are not supported by The Things Network
   * @param network
   * @param deviceProfileId
   * @param dataAPI
   * @returns {Error}
   */
  pushDeviceProfile () {
    appLogger.log('The Things Network: pushDeviceProfile')
    appLogger.log('Device Profiles are not supported by The Things Network')
    let error = new Error('Device Profiles are not supported by The Things Network')
    appLogger.log('Error on pushDeviceProfile: ', 'error')
    return (error)
  }

  async registerApplicationWithHandler (network, handlerApp, accountServerApp, dataAPI) {
    try {
      await this.client.registerApplication(network, handlerApp.appId)
      return this.setApplication(network, handlerApp, accountServerApp, dataAPI)
    }
    catch (e) {
      appLogger.log('Error on register Application: ' + e, 'error')
      throw e
    }
  }

  async setApplication (network, handlerApp, accountServerApp) {
    try {
      await this.client.updateHandlerApplication(network, accountServerApp.id, handlerApp)
      return accountServerApp.id
    }
    catch (e) {
      appLogger.log('Error on get Application: ' + e, 'error')
      throw e
    }
  }

  async passDataToDevice (network, appId, deviceId, body) {
    // Ensure network is enabled
    if (!network.securityData.enabled) return
    const devNwkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(deviceId, 'devNwkId'))
    const appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(appId, 'appNwkId'))
    return this.client.createDeviceMessage(network, appNwkId, devNwkId, body)
  }

  normalizeApplicationData (handlerApp, accountServerApp, network) {
    appLogger.log(handlerApp.appId, 'error')
    appLogger.log(accountServerApp, 'error')

    let normalized = {
      description: accountServerApp.name,
      id: handlerApp.app_id,
      name: handlerApp.app_id,
      key: accountServerApp.access_keys[0].key,
      payloadCodec: handlerApp.payload_format,
      payloadEncoderScript: handlerApp.encoder,
      payloadDecoderScript: handlerApp.decoder,
      validationScript: handlerApp.validator,
      serviceProfileID: accountServerApp.handler,
      organizationID: network.securityData.username
    }
    if (accountServerApp.euis && accountServerApp.euis.length > 0) {
      normalized.applicationEUI = accountServerApp.euis[0]
    }
    return normalized
  }

  deNormalizeApplicationData (remoteApplication, application) {
    let magicId = application.id + '-lpwanserver-' + uuid()
    magicId = magicId.substr(0, 36)
    // No underscore or dash allowed in first or last position
    magicId = magicId.replace(/^[_-]*|[_-]*$/, '')
    let ttnApplication = {
      accountServerApp: {
        id: magicId,
        name: application.name,
        rights: [
          'settings',
          'delete',
          'collaborators',
          'devices'
        ],
        access_keys: [
          {
            'rights': [
              'settings',
              'devices',
              'messages:up:r',
              'messages:down:w'
            ],
            'name': 'lpwan'
          }
        ]
      },
      handlerApp: {
        appId: magicId,
        decoder: remoteApplication.payloadDecoderScript,
        encoder: remoteApplication.payloadEncoderScript,
        payload_format: remoteApplication.payloadCodec,
        validator: remoteApplication.validationScript
      }
    }

    if (remoteApplication.applicationEUI) {
      ttnApplication.accountServerApp.euis = [remoteApplication.applicationEUI]
    }

    return ttnApplication
  }

  normalizeDeviceProfileData (remoteDeviceProfile, remoteApplicationMeta) {
    let normalized = {
      id: remoteDeviceProfile.dev_id + '-profile',
      name: remoteDeviceProfile.description,
      networkServerID: remoteApplicationMeta.serviceProfileID,
      organizationID: remoteApplicationMeta.organizationID,
      supports32BitFCnt: remoteDeviceProfile.lorawan_device.uses32_bit_f_cnt,
      macVersion: '1.0.2',
      regParamsRevision: 'B',
      maxEIRP: 30
    }
    if (remoteDeviceProfile.lorawan_device.activation_constraints === 'otaa' || (remoteDeviceProfile.lorawan_device.app_key !== '')) {
      normalized.supportsJoin = true
    }
    else {
      normalized.supportsJoin = false
    }

    if (normalized.networkServerID === 'ttn-handler-us-west') {
      normalized.rfRegion = 'US902'
    }
    else if (normalized.networkServerID === 'ttn-handler-eu') {
      normalized.rfRegion = 'EU868'
    }
    else if (normalized.networkServerID === 'ttn-handler-asia-se') {
      normalized.rfRegion = 'China779'
    }
    else if (normalized.networkServerID === 'ttn-handler-brazil') {
      normalized.rfRegion = 'AS923'
    }
    else { // default
      normalized.rfRegion = 'US902'
    }

    function filterAttributes (attributes, key) {
      let temp = remoteDeviceProfile.attributes.filter(obj => obj.key === key)
      if (temp && temp.length > 0) {
        return temp[0].value
      }
      else {
        return ''
      }
    }

    if (remoteDeviceProfile.attributes && remoteDeviceProfile.attributes.length > 0) {
      normalized.classBTimeout = filterAttributes(remoteDeviceProfile.attributes, 'classBTimeout')
      normalized.classCTimeout = filterAttributes(remoteDeviceProfile.attributes, 'classCTimeout')
      normalized.factoryPresetFreqs = filterAttributes(remoteDeviceProfile.attributes, 'factoryPresetFreqs')
      normalized.macVersion = filterAttributes(remoteDeviceProfile.attributes, 'macVersion')
      normalized.maxDutyCycle = filterAttributes(remoteDeviceProfile.attributes, 'maxDutyCycle')
      normalized.maxEIRP = filterAttributes(remoteDeviceProfile.attributes, 'maxEIRP')
      normalized.pingSlotDR = filterAttributes(remoteDeviceProfile.attributes, 'pingSlotDR')
      normalized.pingSlotFreq = filterAttributes(remoteDeviceProfile.attributes, 'pingSlotFreq')
      normalized.pingSlotPeriod = filterAttributes(remoteDeviceProfile.attributes, 'pingSlotPeriod')
      normalized.regParamsRevision = filterAttributes(remoteDeviceProfile.attributes, 'regParamsRevision')
      normalized.rxDROffset1 = filterAttributes(remoteDeviceProfile.attributes, 'rxDROffset1')
      normalized.rxDataRate2 = filterAttributes(remoteDeviceProfile.attributes, 'rxDataRate2')
      normalized.rxDelay1 = filterAttributes(remoteDeviceProfile.attributes, 'rxDelay1')
      normalized.rxFreq2 = filterAttributes(remoteDeviceProfile.attributes, 'rxFreq2')
      normalized.supportsClassB = filterAttributes(remoteDeviceProfile.attributes, 'supportsClassB')
      normalized.supportsClassC = filterAttributes(remoteDeviceProfile.attributes, 'supportsClassC')
    }
    return normalized
  }

  normalizeDeviceData (remoteDevice, deviceProfileId) {
    let normalized = {
      applicationID: remoteDevice.app_id,
      description: remoteDevice.description,
      devEUI: remoteDevice.lorawan_device.dev_eui,
      deviceProfileID: deviceProfileId,
      name: remoteDevice.dev_id,
      skipFCntCheck: false,
      deviceStatusBattery: '',
      deviceStatusMargin: '',
      lastSeenAt: remoteDevice.lorawan_device.last_seen
    }
    // TTN only supports 1.0.x currently, so  nwkKey === appKey for conversion
    if (remoteDevice.lorawan_device.activation_constraints === 'otaa' || (remoteDevice.lorawan_device.app_key !== '')) {
      normalized.deviceKeys = {
        appKey: remoteDevice.lorawan_device.app_key,
        devEUI: remoteDevice.lorawan_device.dev_eui,
        nwkKey: remoteDevice.lorawan_device.app_key
      }
    }
    else {
      normalized.deviceActivation = {
        aFCntDown: remoteDevice.lorawan_device.f_cnt_down,
        appSKey: remoteDevice.lorawan_device.app_s_key,
        devAddr: remoteDevice.lorawan_device.dev_addr,
        devEUI: remoteDevice.lorawan_device.dev_eui,
        fCntUp: remoteDevice.lorawan_device.f_cnt_up,
        nFCntDown: remoteDevice.lorawan_device.f_cnt_down,
        nwkSEncKey: remoteDevice.lorawan_device.nwk_s_key,
        sNwkSIntKey: remoteDevice.lorawan_device.nwk_s_key,
        fNwkSIntKey: remoteDevice.lorawan_device.nwk_s_key
      }
    }
    return normalized
  }

  /**
   * @see ./data/json/lora2.json
   *
   * @param remoteDevice
   * @returns {{device: {applicationID: (*|string), description: *, devEUI: *, deviceProfileID: *, name: *, skipFCntCheck: (*|boolean)}, deviceStatusBattery: number, deviceStatusMargin: number, lastSeenAt: (string|null)}}
   */
  deNormalizeDeviceData (localDevice, localDeviceProfile, application, remoteApplicationId) {
    let ttnDeviceData = {
      altitude: 0,
      app_id: remoteApplicationId,
      description: localDevice.description,
      dev_id: localDevice.devEUI,
      latitude: 52.375,
      longitude: 4.887,
      lorawan_device: {
        activation_constraints: 'otaa',
        app_eui: application.applicationEUI,
        app_id: remoteApplicationId,
        dev_eui: localDevice.devEUI,
        dev_id: localDevice.devEUI,
        last_seen: localDevice.lastSeenAt,
        uses32_bit_f_cnt: localDeviceProfile.supports32BitFCnt
      }
    }

    if (!localDevice.lastSeenAt || localDevice.lastSeenAt === '') {
      ttnDeviceData.lorawan_device.last_seen = 0
    }

    if (localDeviceProfile.supportsJoin) {
      ttnDeviceData.lorawan_device.activation_constraints = 'otta'
      ttnDeviceData.lorawan_device.app_key = localDevice.deviceKeys.appKey
    }
    else if (localDevice.deviceActivation) {
      const activationKeyMap = {
        appSKey: 'app_s_key',
        nwkSEncKey: 'nwk_s_key',
        devAddr: 'dev_addr',
        nFCntDown: 'f_cnt_down',
        fCntUp: 'f_cnt_up'
      }
      Object.assign(
        ttnDeviceData.lorawan_device,
        renameKeys(activationKeyMap, localDevice.deviceActivation),
        { activation_constraints: 'abp', disable_f_cnt_check: false }
      )
    }

    const attributes = [
      'classBTimeout', 'classCTimeout', 'factoryPresetFreqs', 'factoryPresetFreqs', 'maxDutyCycle', 'maxEIRP',
      'pingSlotDR', 'pingSlotFreq', 'pingSlotPeriod', 'regParamsRevision', 'rxDROffset1', 'rxDataRate2',
      'rxDelay1', 'rxFreq2', 'supportsClassB', 'supportsClassC'
    ]
    ttnDeviceData.attributes = attributes
      .filter(key => key in localDeviceProfile)
      .map(key => ({ key, value: localDeviceProfile[key] }))

    appLogger.log(ttnDeviceData, 'info')
    return ttnDeviceData
  }
}

/**
 * @access private
 *
 * @param companyId
 * @param dataName
 * @returns {string}
 */
function makeCompanyDataKey (companyId, dataName) {
  return 'co:' + companyId + '/' + dataName
}

/**
 * @access private
 *
 * @param applicationId
 * @param dataName
 * @returns {string}
 */
function makeApplicationDataKey (applicationId, dataName) {
  return 'app:' + applicationId + '/' + dataName
}

/**
 * @access private
 *
 * @param deviceId
 * @param dataName
 * @returns {string}
 */
function makeDeviceDataKey (deviceId, dataName) {
  return 'dev:' + deviceId + '/' + dataName
}

/**
 * @access private
 *
 * @param deviceProfileId
 * @param dataName
 * @returns {string}
 */
function makeDeviceProfileDataKey (deviceProfileId, dataName) {
  return 'dp:' + deviceProfileId + '/' + dataName
}

// async function authorizeWithRefreshToken (network, loginData) {
//   try {
//     const body = await TTNAuthenticationRequest(network, loginData, {
//       body: {
//         grant_type: 'refresh_token',
//         refresh_token: loginData.refresh_token,
//         redirect_url: loginData.redirect_uri
//       }
//     })
//     body.username = 'TTNUser'
//     return body
//   }
//   catch (e) {
//     appLogger.log('Error on signin: ' + e)
//     throw e
//   }
// }
