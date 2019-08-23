const NetworkProtocol = require('../../NetworkProtocol')
const R = require('ramda')
const { log } = require('../../../log')
const { joinUrl, renameKeys } = require('../../../lib/utils')
const httpError = require('http-errors')
const config = require('../../../config')

module.exports = class LoraOpenSource extends NetworkProtocol {
  async connect ({ network }) {
    await this.client.getSession(network)
  }

  async test ({ network }) {
    await this.client.listApplications(network, { limit: 1, offset: 0 })
    return true
  }

  async pushNetwork ({ network }) {
    await Promise.all([
      this.pushDeviceProfiles(network),
      this.pushApplications(network)
    ])
    await this.pushDevices(network)
  }

  async pushApplications (network) {
    let [apps] = await this.modelAPI.applications.list()
    await Promise.all(apps.map(x => this.pushApplication({ network, application: x, update: false })))
  }

  async pushApplication ({ network, application: app, update = true }) {
    let appNetworkId
    try {
      appNetworkId = await this.modelAPI.protocolData.loadValue([network, makeApplicationDataKey(app.id, 'appNwkId')])
      log.info(`PUSH_APPLICATION: ${appNetworkId}`)
      if (update && appNetworkId) {
        return this.updateApplication(network, app.id)
      }
      else if (appNetworkId) {
        log.info('Ignoring Application  ' + app.id + ' already on network ' + network.name)
        return { localApplication: app.id, remoteApplication: appNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      appNetworkId = await this.addApplication({ network, applicationId: app.id })
      log.info('Added application ' + app.id + ' to network ' + network.name)
      return { localApplication: app.id, remoteApplication: appNetworkId }
    }
  }

  async pushDeviceProfiles ({ network }) {
    let [ dps ] = await this.modelAPI.deviceProfiles.list()
    await Promise.all(dps.map(x => this.pushDeviceProfile({ network, deviceProfile: x, update: false })))
  }

  async pushDeviceProfile ({ network, deviceProfile, update = true }) {
    let dpNetworkId
    try {
      dpNetworkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceProfileDataKey(deviceProfile.id, 'dpNwkId')])
      if (update && dpNetworkId) {
        return this.updateDeviceProfile(network, deviceProfile.id)
      }
      else if (dpNetworkId) {
        log.info('Ignoring DeviceProfile  ' + deviceProfile.id + ' already on network ' + network.name)
        return { localDeviceProfile: deviceProfile.id, remoteDeviceProfile: dpNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      dpNetworkId = await this.addDeviceProfile({ network, deviceProfileId: deviceProfile.id })
      log.info('Added DeviceProfile ' + deviceProfile.id + ' to network ' + network.name)
      return { localDeviceProfile: deviceProfile.id, remoteDeviceProfile: dpNetworkId }
    }
  }

  async pushDevices ({ network }) {
    let [ devices ] = await this.modelAPI.devices.list()
    await Promise.all(devices.map(x => this.pushDevice({ network, device: x, update: false })))
  }

  async pushDevice ({ network, device, update = true }) {
    let devNetworkId
    try {
      devNetworkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceDataKey(device.id, 'devNwkId')])
      if (update && devNetworkId) {
        return this.updateDevice(network, device.id)
      }
      else if (devNetworkId) {
        log.info('Ignoring Device  ' + device.id + ' already on network ' + network.name)
        return { localDevice: device.id, remoteDevice: devNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      devNetworkId = await this.addDevice({ network, deviceId: device.id })
      log.info('Added Device ' + device.id + ' to network ' + network.name)
      return { localDevice: device.id, remoteDevice: devNetworkId }
    }
  }

  async pullNetwork ({ network }) {
    const [pulledDevProfiles, pulledApps] = await Promise.all([
      this.pullDeviceProfiles(network),
      this.pullApplications(network)
    ])
    await Promise.all(pulledApps.map(x =>
      this.pullDevices(network, x.remoteApplication, x.localApplication, pulledDevProfiles)
    ))
  }

  async pullDeviceProfiles ({ network }) {
    const { result } = await this.client.listDeviceProfiles(network, {
      limit: 9999,
      offset: 0
    })
    return Promise.all(result.map(x => this.addRemoteDeviceProfile(network, x.id)))
  }

  async addRemoteDeviceProfile (network, remoteDevProfileId) {
    const remoteDeviceProfile = await this.client.loadDeviceProfile(network, remoteDevProfileId)
    log.info('Adding ' + remoteDeviceProfile.name)
    const [ dps ] = await this.modelAPI.deviceProfiles.list({ where: { search: remoteDeviceProfile.name }, limit: 1 })
    if (dps.length) {
      let localDp = dps[0]
      log.info(localDp.name + ' already exists')
      await this.modelAPI.protocolData.upsert([network, makeDeviceProfileDataKey(localDp.id, 'dpNwkId'), remoteDeviceProfile.id])
      return {
        localDeviceProfile: localDp.id,
        remoteDeviceProfile: remoteDeviceProfile.id
      }
    }
    log.info('creating ' + remoteDeviceProfile.name)
    let networkSettings = this.buildDeviceProfileNetworkSettings(remoteDeviceProfile)
    let localDp = await this.modelAPI.deviceProfiles.create({
      data: {
        networkTypeId: network.networkType.id,
        name: remoteDeviceProfile.name,
        description: 'Device Profile managed by LPWAN Server, perform changes via LPWAN',
        networkSettings
      },
      remoteOrigin: true
    })
    await this.modelAPI.protocolData.upsert([network, makeDeviceProfileDataKey(localDp.id, 'dpNwkId'), remoteDeviceProfile.id])
    return {
      localDeviceProfile: localDp.id,
      remoteDeviceProfile: remoteDeviceProfile.id
    }
  }

  async pullApplications (network) {
    let { result } = await this.client.listApplications(network, {
      limit: 9999,
      offset: 0
    })
    return Promise.all(result.map(app => this.addRemoteApplication(network, app.id)))
  }

  async addRemoteApplication (network, remoteAppId) {
    const remoteApp = await this.client.loadApplication(network, remoteAppId)
    let integration
    try {
      integration = await this.client.loadApplicationIntegration(network, remoteAppId, 'http')
    }
    catch (err) {
      if (err.statusCode !== 404) throw err
    }
    // Check for local app with the same name
    const [localApps] = await this.modelAPI.applications.list({ where: { search: remoteApp.name } })
    let localApp = localApps[0]
    const [ reportingProtos ] = await this.modelAPI.reportingProtocols.list()
    if (!localApp) {
      let localAppData = {
        ...R.pick(['name', 'description'], remoteApp),
        reportingProtocolId: reportingProtos[0].id
      }
      if (integration) localAppData.baseUrl = integration.uplinkDataURL
      localApp = await this.modelAPI.applications.create({ data: localAppData })
      log.info('Created ' + localApp.name)
    }
    await this.modelAPI.protocolData.upsert([network, makeApplicationDataKey(localApp.id, 'appNwkId'), remoteApp.id])

    const [ appNtls ] = await this.modelAPI.applicationNetworkTypeLinks.list({ where: { applicationId: localApp.id } })
    let appNtl = appNtls[0]
    if (appNtl) {
      log.info(localApp.name + ' link already exists')
    }
    else {
      appNtl = await this.modelAPI.applicationNetworkTypeLinks.create({
        data: {
          applicationId: localApp.id,
          networkTypeId: network.networkType.id,
          networkSettings: this.buildApplicationNetworkSettings(remoteApp)
        },
        remoteOrigin: true
      })
    }
    if (localApp.baseUrl) await this.startApplication({ network, applicationId: localApp.id })
    return { localApplication: localApp.id, remoteApplication: remoteApp.id }
  }

  async pullDevices (network, remoteAppId, localAppId, dpMap) {
    const params = { limit: 9999, offset: 0 }
    const { result } = await this.client.listDevices(network, remoteAppId, params)
    return Promise.all(result.map(device => this.addRemoteDevice(network, device.devEUI, localAppId, dpMap)))
  }

  async addRemoteDevice (network, remoteDeviceId, localAppId, dpMap) {
    const remoteDevice = await this.client.loadDevice(network, remoteDeviceId)
    log.info('Adding ' + remoteDevice.name)
    let deviceProfileIdMap = dpMap.find(o => o.remoteDeviceProfile === remoteDevice.deviceProfileID)
    let deviceProfile = await this.modelAPI.deviceProfiles.load({ where: { id: deviceProfileIdMap.localDeviceProfile } })
    try {
      if (deviceProfile.networkSettings.supportsJoin) {
        remoteDevice.deviceKeys = await this.client.loadDeviceKeys(network, remoteDevice.devEUI)
      }
      else {
        remoteDevice.deviceActivation = await this.client.loadDeviceActivation(network, remoteDevice.devEUI)
      }
    }
    catch (err) {
      log.info('Device does not have keys or activation')
    }

    let [ localDevices ] = await this.modelAPI.devices.list({ where: { search: remoteDevice.name }, limit: 1 })
    let localDevice
    if (localDevices.length) {
      localDevice = localDevices[0]
      log.info(localDevice.name + ' already exists')
    }
    else {
      log.info('creating ' + remoteDevice.name)
      const devData = { ...R.pick(['name', 'description'], remoteDevice), applicationId: localAppId }
      localDevice = await this.modelAPI.devices.create({ data: devData })
      log.info('Created ' + localDevice.name)
    }
    let [ devNtls ] = await this.modelAPI.deviceNetworkTypeLinks.list({ where: { deviceId: localDevice.id }, limit: 1 })
    if (devNtls.length) {
      log.info(localDevice.name + ' link already exists')
    }
    else {
      log.info('creating Network Link for ' + localDevice.name)
      let networkSettings = this.buildDeviceNetworkSettings(remoteDevice, deviceProfile)
      let devNtlData = {
        deviceId: localDevice.id,
        networkTypeId: network.networkType.id,
        deviceProfileId: deviceProfile.id,
        networkSettings
      }
      await this.modelAPI.deviceNetworkTypeLinks.create({ data: devNtlData, remoteOrigin: true })
    }
    await this.modelAPI.protocolData.upsert([network, makeDeviceDataKey(localDevice.id, 'devNwkId'), remoteDevice.devEUI])
    return localDevice.id
  }

  async addApplication ({ network, applicationId: appId }) {
    try {
      // Get the local application data.
      const localApp = await this.modelAPI.applications.load({ where: { id: appId } })
      const [appNtls] = await this.modelAPI.applicationNetworkTypeLinks.list({ where: {
        applicationId: appId,
        networkTypeId: network.networkType.id
      } })
      const [appNtl] = appNtls[0]
      const body = await this.client.createApplication(network, this.buildRemoteApplication(
        appNtl && appNtl.networkSettings,
        localApp
      ))
      // Save the application ID from the remote network.
      await this.modelAPI.protocolData.upsert([network, makeApplicationDataKey(localApp.id, 'appNwkId'), body.id])
      // Start application if baseUrl
      if (localApp.baseUrl && localApp.running) await this.startApplication({ network, applicationId: appId })
    }
    catch (err) {
      log.info('Failed to get required data for addApplication: ' + err)
      throw err
    }
  }

  async getApplication (network, appId) {
    const appNetworkId = await this.modelAPI.protocolData.loadValue([network, makeApplicationDataKey(appId, 'appNwkId')])
    return this.client.loadApplication(network, appNetworkId)
  }

  async updateApplication (network, appId) {
    // Get the application data.
    var localApp = await this.modelAPI.applications.load({ where: { id: appId } })
    var appNetworkId = await this.modelAPI.protocolData.loadValue([network, makeApplicationDataKey(appId, 'appNwkId')])
    const [appNtls] = await this.modelAPI.applicationNetworkTypeLinks.list({ where: {
      application: { id: appId },
      networkType: { id: network.networkType.id }
    } })
    const [appNtl] = appNtls[0]
    let reqBody = this.buildRemoteApplication(
      appNtl.networkSettings,
      localApp
    )

    reqBody.id = appNetworkId

    // Optional data
    if (appNtl && appNtl.networkSettings) {
      let props = ['isABP', 'isClassC', 'relaxFCnt', 'rXDelay', 'rX1DROffset', 'rXWindow', 'rX2DR', 'aDRInterval', 'installationMargin', 'payloadDecoderScript', 'payloadEncoderScript']
      Object.assign(reqBody, R.pick(props, appNtl.networkSettings))
      if (appNtl.networkSettings.payloadCodec && appNtl.networkSettings.payloadCodec !== 'NONE') {
        reqBody.payloadCodec = appNtl.networkSettings.payloadCodec
      }
    }
    await this.client.updateApplication(network, reqBody.id, reqBody)
  }

  async deleteApplication ({ network, applicationId: appId }) {
    var appNetworkId = await this.modelAPI.protocolData.loadValue([network, makeApplicationDataKey(appId, 'appNwkId')])
    await this.client.deleteApplication(network, appNetworkId)
    await this.modelAPI.protocolData.clearProtocolData([network.id, network.networkProtocol.id, makeApplicationDataKey(appId, 'appNwkId')])
  }

  async startApplication ({ network, applicationId: appId }) {
    // Create a new endpoint to get POSTs, and call the deliveryFunc.
    // Use the local applicationId and the networkId to create a unique
    // URL.
    const url = joinUrl(config.base_url, 'api/ingest', appId, network.id)

    // Set up the Forwarding with LoRa App Server
    var appNwkId = await this.modelAPI.protocolData.loadValue([network, makeApplicationDataKey(appId, 'appNwkId')])

    const body = {
      ackNotificationURL: url,
      errorNotificationURL: url,
      joinNotificationURL: url,
      uplinkDataURL: url,
      statusNotificationURL: url,
      locationNotificationURL: url
    }

    try {
      await this.client.loadApplicationIntegration(network, appNwkId, 'http')
      await this.client.updateApplicationIntegration(network, appNwkId, 'http', body)
    }
    catch (err) {
      if (err.statusCode !== 404) throw err
      await this.client.createApplicationIntegration(network, appNwkId, 'http', body)
    }
  }

  async stopApplication ({ network, applicationId: appId }) {
    let appNwkId
    try {
      appNwkId = await this.modelAPI.protocolData.loadValue([network, makeApplicationDataKey(appId, 'appNwkId')])
      try {
        await this.client.loadApplicationIntegration(network, appNwkId, 'http')
      }
      catch (err) {
        if (err.statusCode === 404) return
        throw err
      }
      await this.client.deleteApplicationIntegration(network, appNwkId, 'http')
    }
    catch (err) {
      log.error(`Cannot delete http integration for application ${appId} on network ${network.name}`, err)
      throw err
    }
  }

  async addDeviceProfile ({ network, deviceProfileId }) {
    log.info('Adding DP ' + deviceProfileId)
    // Get the deviceProfile data.
    const deviceProfile = await this.modelAPI.deviceProfiles.load({ where: { id: deviceProfileId } })
    const { id } = await this.client.createDeviceProfile(network, this.buildRemoteDeviceProfile(
      deviceProfile
    ))
    await this.modelAPI.protocolData.upsert([network, makeDeviceProfileDataKey(deviceProfile.id, 'dpNwkId'), id])
    return id
  }

  async getDeviceProfile (network, deviceProfileId) {
    var dpNetworkId
    try {
      dpNetworkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceProfileDataKey(deviceProfileId, 'dpNwkId')])
    }
    catch (err) {
      log.error('Error on get deviceProfile network ID:', err)
      throw err
    }
    return this.client.loadDeviceProfile(network, dpNetworkId)
  }

  async updateDeviceProfile (network, deviceProfileId) {
    // Get the application data.
    var deviceProfile
    var dpNetworkId
    try {
      deviceProfile = await this.modelAPI.deviceProfiles.load({ where: { id: deviceProfileId } })
      dpNetworkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceProfileDataKey(deviceProfileId, 'dpNwkId')])
    }
    catch (err) {
      log.error('Error getting supporting data for update device Profile:', err)
      throw err
    }
    const reqBody = {
      id: dpNetworkId,
      name: deviceProfile.name
    }
    // Optional data
    if (deviceProfile.networkSettings) {
      let props = [
        'macVersion',
        'regParamsRevision',
        'supportsJoin',
        'classBTimeout',
        'classCTimeout',
        'factoryPresetFreqs',
        'maxDutyCycle',
        'maxEIRP',
        'pingSlotDR',
        'pingSlotFreq',
        'pingSlotPeriod',
        'rfRegion',
        'rxDROffset1',
        'rxDataRate2',
        'rxDelay1',
        'rxFreq2',
        'supports32bitFCnt',
        'supportsClassB',
        'supportsClassC'
      ]
      Object.assign(reqBody, R.pick(props, deviceProfile.networkSettings))
      await this.client.updateDeviceProfile(network, reqBody.id, reqBody)
    }
  }

  async deleteDeviceProfile ({ network, deviceProfileId }) {
    let dpNetworkId
    try {
      dpNetworkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceProfileDataKey(deviceProfileId, 'dpNwkId')])
      await this.modelAPI.protocolData.clearProtocolData([
        network.id,
        network.networkProtocol.id,
        makeDeviceProfileDataKey(deviceProfileId, 'dpNwkId')
      ])
    }
    catch (err) {
      log.error('Error getting supporting data for delete deviceProfile:', err)
      throw err
    }
    await this.client.deleteDeviceProfile(network, dpNetworkId)
  }

  async addDevice ({ network, deviceId }) {
    log.info(`Adding Device ${deviceId} to ${network.name}`)
    const device = await this.modelAPI.devices.load({ where: { id: deviceId } })
    const [devNtls] = await this.modelAPI.deviceNetworkTypeLinks.list({ where: {
      deviceId,
      networkTypeId: network.networkType.id
    } })
    const [devNtl] = devNtls[0]
    if (!devNtl) return
    const deviceProfile = await this.modelAPI.deviceProfiles.load({ where: devNtl.deviceProfile })
    if (!devNtl.networkSettings || !devNtl.networkSettings.devEUI) {
      log.error('deviceNetworkTypeLink MUST have networkSettings which MUST have devEUI')
      throw httpError.BadRequest()
    }
    const appNwkId = await this.modelAPI.protocolData.loadValue([network, makeApplicationDataKey(device.application.id, 'appNwkId')])
    const dpNwkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceProfileDataKey(devNtl.deviceProfile.id, 'dpNwkId')])

    let deviceData = this.buildRemoteDevice(
      device,
      devNtl,
      deviceProfile,
      appNwkId,
      dpNwkId
    )
    await this.client.createDevice(network, deviceData.device)
    await this.modelAPI.protocolData.upsert([network, makeDeviceDataKey(device.id, 'devNwkId'), deviceData.device.devEUI])
    if (deviceProfile.networkSettings.supportsJoin && deviceData.deviceKeys) {
      await this.client.createDeviceKeys(network, deviceData.device.devEUI, deviceData.deviceKeys)
    }
    else if (deviceData.deviceActivation && deviceData.deviceActivation.fCntUp >= 0) {
      await this.client.activateDevice(network, deviceData.device.devEUI, deviceData.deviceActivation)
    }
    else {
      log.error('Remote Device ' + deviceData.device.name + ' does not have authentication parameters')
    }
    return dntl.networkSettings.devEUI
  }

  async getDevice (network, deviceId) {
    var devNetworkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceDataKey(deviceId, 'devNwkId')])
    return this.client.loadDevice(network, devNetworkId)
  }

  async updateDevice (network, deviceId) {
    const device = await this.modelAPI.devices.load({ where: { id: deviceId } })
    const [devNtls] = await this.modelAPI.deviceNetworkTypeLinks.list({ where: {
      deviceId,
      networkTypeId: network.networkType.id
    } })
    const [devNtl] = devNtls[0]
    const deviceProfile = await this.modelAPI.deviceProfiles.load({ where: devNtl.deviceProfile })
    const devNetworkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceDataKey(device.id, 'devNwkId')])
    const appNwkId = await this.modelAPI.protocolData.loadValue([network, makeApplicationDataKey(device.application.id, 'appNwkId')])
    const dpNwkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceProfileDataKey(deviceProfile.id, 'dpNwkId')])
    let deviceData = this.buildRemoteDevice(
      device,
      devNtl,
      deviceProfile,
      appNwkId,
      dpNwkId
    )
    await this.client.updateDevice(network, devNetworkId, deviceData.device)
    if (deviceProfile.networkSettings.supportsJoin && deviceData.deviceKeys) {
      await this.client.updateDeviceKeys(network, deviceData.device.devEUI, deviceData.deviceKeys)
    }
    else if (deviceData.deviceActivation) {
      // This is the ABP path.
      await this.client.deleteDeviceActivation(network, deviceData.device.devEUI)
      await this.client.activateDevice(network, deviceData.device.devEUI, deviceData.deviceActivation)
    }
    else {
      log.info('Remote Device ' + deviceData.device.name + ' does not have authentication parameters')
    }
  }

  async deleteDevice ({ network, deviceId }) {
    var devNetworkId
    try {
      devNetworkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceDataKey(deviceId, 'devNwkId')])
    }
    catch (err) {
      // Can't delete without the remote ID.
      log.error("Failed to get remote network's device ID:", err)
      throw err
    }
    await this.client.deleteDevice(network, devNetworkId)
    try {
      await this.modelAPI.protocolData.clearProtocolData([
        network.id,
        network.networkProtocol.id,
        makeDeviceDataKey(deviceId, 'devNwkId')
      ])
    }
    catch (err) {
      log.error("Failed to delete remote network's device ID: ", err)
    }
    await this.client.deleteDeviceKeys(network, devNetworkId)
  }

  async passDataToDevice ({ network, deviceId, data }) {
    // Ensure network is enabled
    if (!network.securityData.enabled) return
    const devNwkId = await this.modelAPI.protocolData.loadValue([network, makeDeviceDataKey(deviceId, 'devNwkId')])
    data = renameKeys({ jsonData: 'jsonObject' }, data)
    return this.client.createDeviceMessage(network, devNwkId, { ...data, devEUI: devNwkId })
  }

  buildApplicationNetworkSettings (remoteApplication) {
    const keys = ['payloadCodec', 'payloadDecoderScript', 'payloadEncoderScript']
    return R.pick(keys, remoteApplication)
  }

  buildRemoteApplication (networkSettings, serviceProfileId, organizationId, app) {
    const result = {
      ...R.pick(['name', 'description'], app),
      'organizationID': organizationId,
      'serviceProfileID': serviceProfileId
    }
    if (networkSettings) {
      Object.assign(result, R.pick(['payloadCodec', 'payloadDecoderScript', 'payloadEncoderScript'], networkSettings))
    }
    return result
  }

  buildDeviceProfileNetworkSettings (remoteDeviceProfile) {
    return R.omit(['createdAt', 'updatedAt'], remoteDeviceProfile)
  }

  buildRemoteDeviceProfile (deviceProfile, networkServerId, organizationId) {
    return {
      ...R.pick(['name'], deviceProfile),
      ...deviceProfile.networkSettings,
      networkServerID: networkServerId,
      organizationID: organizationId
    }
  }

  buildDeviceNetworkSettings (remoteDevice) {
    return R.pick([
      'devEUI',
      'skipFCntCheck',
      'deviceStatusBattery',
      'deviceStatusMargin',
      'lastSeenAt',
      'deviceKeys',
      'deviceActivation'
    ], remoteDevice)
  }

  buildRemoteDevice (device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId) {
    return { device: {
      ...R.pick(['name', 'description'], device),
      ...R.pick(['devEUI', 'skipFCntCheck'], deviceNtl.networkSettings),
      applicationID: remoteAppId,
      deviceProfileID: remoteDeviceProfileId
    } }
  }
}

function makeApplicationDataKey (applicationId, dataName) {
  return 'app:' + applicationId + '/' + dataName
}

function makeDeviceDataKey (deviceId, dataName) {
  return 'dev:' + deviceId + '/' + dataName
}

function makeDeviceProfileDataKey (deviceProfileId, dataName) {
  return 'dp:' + deviceProfileId + '/' + dataName
}
