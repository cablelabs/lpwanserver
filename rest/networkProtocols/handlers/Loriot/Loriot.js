const NetworkProtocol = require('../../NetworkProtocol')
const appLogger = require('../../../lib/appLogger.js')
const R = require('ramda')
const config = require('../../../config')
const httpError = require('http-errors')
const { joinUrl } = require('../../../lib/utils')

module.exports = class Loriot extends NetworkProtocol {
  async connect (network) {
    if (!network.securityData.apiKey) {
      return httpError.Unauthorized()
    }
  }

  async test (network) {
    await this.client.listApplications(network, { perPage: 20, page: 1 })
    return true
  }

  async pullNetwork (network, dataAPI, modelAPI) {
    const apps = await this.pullApplications(network, modelAPI, dataAPI)
    await Promise.all(apps.map(x =>
      this.pullDevices(network, x.remoteApp._id, x.localApp.id, modelAPI, dataAPI)
    ))
  }

  async pushNetwork (network, dataAPI, modelAPI) {
    await this.pushApplications(network, modelAPI, dataAPI)
    await this.pushDevices(network, modelAPI, dataAPI)
  }

  async pullApplications (network, modelAPI, dataAPI) {
    let { apps } = await this.client.listApplications(network, {
      perPage: 9999,
      page: 1
    })
    return Promise.all(apps.map(app => this.addRemoteApplication(network, app._id, modelAPI, dataAPI)))
  }

  async pushApplications (network, modelAPI, dataAPI) {
    let { records } = await modelAPI.applications.list()
    await Promise.all(records.map(x => this.pushApplication(network, x, dataAPI, false)))
  }

  async addRemoteApplication (network, remoteAppId, modelAPI, dataAPI) {
    const remoteApp = await this.client.loadApplication(network, remoteAppId)
    const [ integration ] = remoteApp.outputs.filter(x => x.output === 'httppush')
    const { records: localApps } = await modelAPI.applications.list({ search: remoteApp.name })
    const { records: cos } = await modelAPI.companies.list()
    const { records: reportingProtos } = await modelAPI.reportingProtocols.list()
    let localApp = localApps[0]
    if (!localApp) {
      let localAppData = {
        ...R.pick(['name', 'description'], remoteApp),
        companyId: cos[0].id,
        reportingProtocolId: reportingProtos[0].id
      }
      if (integration) localAppData.baseUrl = integration.url
      localApp = await modelAPI.applications.create(localAppData)
      appLogger.log('Created ' + localApp.name)
    }
    const { records: appNtls } = await modelAPI.applicationNetworkTypeLinks.list({ applicationId: localApp.id })
    let appNtl = appNtls[0]
    if (appNtl) {
      appLogger.log(localApp.name + ' link already exists')
    }
    else {
      appNtl = await modelAPI.applicationNetworkTypeLinks.create(
        {
          applicationId: localApp.id,
          networkTypeId: network.networkType.id,
          networkSettings: this.buildApplicationNetworkSettings(remoteApp)
        },
        {
          companyId: localApp.company.id,
          remoteOrigin: true
        }
      )
      await this.modelAPI.protocolData.upsert(network, makeApplicationDataKey(localApp.id, 'appNwkId'), `${remoteApp._id}`)
      await this.modelAPI.protocolData.upsert(network, makeApplicationDataKey(localApp.id, 'appEUI'), remoteApp.appeui)
    }
    if (localApp.baseUrl) await this.startApplication(network, localApp.id, dataAPI)
    return { localApp, remoteApp }
  }

  async pushApplication (network, app, dataAPI, update = true) {
    let appNetworkId
    try {
      appNetworkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(app.id, 'appNwkId'))
      if (appNetworkId) appNetworkId = parseInt(appNetworkId, 10)
      if (update && appNetworkId) {
        return this.updateApplication(network, app.id, dataAPI)
      }
      else if (appNetworkId) {
        appLogger.log('Ignoring Application  ' + app.id + ' already on network ' + network.name)
        return { localApplication: app.id, remoteApplication: appNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      appNetworkId = await this.addApplication(network, app.id, dataAPI)
      appLogger.log('Added application ' + app.id + ' to network ' + network.name)
      return { localApplication: app.id, remoteApplication: appNetworkId }
    }
  }

  async addApplication (network, appId, dataAPI) {
    try {
      // Get the local application data.
      const localApp = await dataAPI.getApplicationById(appId)
      // Loriot only accepts "title" and "capacity" (both required) when creating new apps
      // Title is called name when fetching the app, only it's title on create.
      const body = await this.client.createApplication(network, { title: localApp.name, capacity: 10 })
      // Save the application ID from the remote network.
      await this.modelAPI.protocolData.upsert(network, makeApplicationDataKey(localApp.id, 'appNwkId'), `${body._id}`)
    }
    catch (err) {
      appLogger.log('Failed to get required data for addApplication: ' + err)
      throw err
    }
  }

  async deleteApplication (network, appId, dataAPI) {
    let appNetworkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(appId, 'appNwkId'))
    appNetworkId = parseInt(appNetworkId, 10)
    await this.client.deleteApplication(network, appNetworkId)
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(appId, 'appNwkId')
    )
  }

  async startApplication (network, appId) {
    // Create a new endpoint to get POSTs, and call the deliveryFunc.
    // Use the local applicationId and the networkId to create a unique
    // URL.
    const url = joinUrl(config.get('base_url'), 'api/ingest', appId, network.id)

    // Set up the Forwarding with LoRa App Server
    var appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(appId, 'appNwkId'))

    const body = { output: 'httppush', osetup: { url } }

    try {
      await this.client.loadApplicationIntegration(network, appNwkId)
      await this.client.updateApplicationIntegration(network, appNwkId, body)
    }
    catch (err) {
      if (err.statusCode !== 404) throw err
      await this.client.createApplicationIntegration(network, appNwkId, body)
    }
  }

  async stopApplication (network, appId) {
    let appNwkId
    try {
      appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(appId, 'appNwkId'))
      try {
        await this.client.loadApplicationIntegration(network, appNwkId, 'http')
      }
      catch (err) {
        if (err.statusCode === 404) return
        throw err
      }
      await this.client.deleteApplicationIntegration(network, appNwkId, 'httppush')
    }
    catch (err) {
      appLogger.log(`Cannot delete http integration for application ${appId} on network ${network.name}: ${err}`)
      throw err
    }
  }

  async pullDevices (network, remoteAppId, localAppId, modelAPI, dataAPI) {
    const params = { perPage: 9999, page: 1 }
    const { devices } = await this.client.listDevices(network, remoteAppId, params)
    return Promise.all(devices.map(device => this.addRemoteDevice(network, device._id, remoteAppId, localAppId, modelAPI, dataAPI)))
  }

  async addRemoteDevice (network, remoteDeviceId, remoteAppId, localAppId, modelAPI, dataAPI) {
    const { records: cos } = await modelAPI.companies.list({ limit: 1 })
    let company = cos[0]
    const remoteDevice = await this.client.loadDevice(network, remoteAppId, remoteDeviceId)
    appLogger.log('Adding ' + remoteDevice.title)
    appLogger.log(remoteDevice)
    let { records } = await modelAPI.devices.list({ search: remoteDevice.title })
    let localDevice = records[0]
    if (localDevice) {
      appLogger.log(localDevice.name + ' already exists')
    }
    else {
      appLogger.log('creating ' + remoteDevice.title)
      localDevice = await modelAPI.devices.create(remoteDevice.title, remoteDevice.description, localAppId)
      appLogger.log('Created ' + localDevice.name)
    }

    let { totalCount } = await modelAPI.deviceNetworkTypeLinks.list({ deviceId: localDevice.id })
    if (totalCount > 0) {
      appLogger.log(localDevice.name + ' link already exists')
    }
    else {
      appLogger.log('creating Network Link for ' + localDevice.name)
      const dp = await this.addRemoteDeviceProfile(remoteDevice, network, modelAPI)
      appLogger.log(dp, 'info')
      let networkSettings = this.buildDeviceNetworkSettings(remoteDevice, dp.localDeviceProfile)
      appLogger.log(networkSettings)
      const deviceNtl = await modelAPI.deviceNetworkTypeLinks.create(localDevice.id, network.networkType.id, dp.localDeviceProfile, networkSettings, company.id, { remoteOrigin: true })
      appLogger.log(deviceNtl)
    }
    await this.modelAPI.protocolData.upsert(network, makeDeviceDataKey(localDevice.id, 'devNwkId'), remoteDevice._id)
    return localDevice.id
  }

  async addRemoteDeviceProfile (remoteDevice, network, modelAPI) {
    let networkSettings = this.buildDeviceProfileNetworkSettings(remoteDevice)
    const { records: cos } = await this.modelAPI.companies.list({ limit: 1 })
    let company = cos[0]
    appLogger.log(networkSettings, 'error')
    try {
      const localDeviceProfile = await modelAPI.deviceProfiles.create(
        network.networkType.id,
        company.id,
        networkSettings.name,
        'Device Profile managed by LPWAN Server, perform changes via LPWAN',
        networkSettings,
        { remoteOrigin: true }
      )
      return {
        localDeviceProfile: localDeviceProfile.id,
        remoteDeviceProfile: localDeviceProfile.id
      }
    }
    catch (e) {
      appLogger.log(e)
      throw e
    }
  }

  async pushDevices (network, modelAPI, dataAPI) {
    let { records } = await modelAPI.devices.list()
    await Promise.all(records.map(x => this.pushDevice(network, x, dataAPI, false)))
  }

  async pushDevice (network, device, dataAPI, update = true) {
    let devNetworkId
    try {
      devNetworkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(device.id, 'devNwkId'))
      if (update && devNetworkId) {
        return this.updateDevice(network, device.id, dataAPI)
      }
      else if (devNetworkId) {
        appLogger.log('Ignoring Device  ' + device.id + ' already on network ' + network.name)
        return { localDevice: device.id, remoteDevice: devNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      devNetworkId = await this.addDevice(network, device.id, dataAPI)
      appLogger.log('Added Device ' + device.id + ' to network ' + network.name)
      return { localDevice: device.id, remoteDevice: devNetworkId }
    }
  }

  async addDevice (network, deviceId, dataAPI) {
    appLogger.log(`Adding Device ${deviceId} to ${network.name}`)
    const device = await dataAPI.getDeviceById(deviceId)
    appLogger.log(JSON.stringify(device))
    const dntl = await dataAPI.getDeviceNetworkType(deviceId, network.networkType.id)
    appLogger.log(JSON.stringify(dntl))
    const deviceProfile = await dataAPI.getDeviceProfileById(dntl.deviceProfile.id)
    appLogger.log(JSON.stringify(deviceProfile))
    if (!dntl.networkSettings || !dntl.networkSettings.devEUI) {
      appLogger.log('deviceNetworkTypeLink MUST have networkSettings which MUST have devEUI', 'error')
      throw httpError.BadRequest()
    }
    let appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(device.application.id, 'appNwkId'))
    appNwkId = parseInt(appNwkId, 10)
    let deviceData = this.buildRemoteDevice(
      device,
      dntl,
      deviceProfile
    )
    const data = deviceData.device
    if (deviceData.deviceKeys) {
      Object.assign(data, deviceData.deviceKeys)
      // Unable to get this call to work, always throws "missing parameters" error
      // but I supplied all parameters in docs (and more)
      // await this.client.createOtaaDevice(network, appNwkId, data)
      // substitute regular create method, which ignores the device keys and creates new ones
      await this.client.createDevice(network, appNwkId, data)
    }
    else if (deviceData.deviceActivation) {
      Object.assign(data, deviceData.deviceActivation)
      await this.client.createAbpDevice(network, appNwkId, data)
    }
    else {
      appLogger.log('Remote Device ' + deviceData.device.name + ' does not have authentication parameters')
      await this.client.createDevice(network, appNwkId, data)
    }
    await this.modelAPI.protocolData.upsert(network, makeDeviceDataKey(device.id, 'devNwkId'), deviceData.device.deveui)
    return dntl.networkSettings.devEUI
  }

  async getDevice (network, deviceId, dataAPI) {
    const device = dataAPI.getDeviceById(deviceId)
    var devNetworkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(deviceId, 'devNwkId'))
    return this.client.loadDevice(network, device.application.id, devNetworkId)
  }

  async updateDevice (network, deviceId, dataAPI) {
    let device = await dataAPI.getDeviceById(deviceId)
    const dntl = await dataAPI.getDeviceNetworkType(device.id, network.networkType.id)
    const deviceProfile = await dataAPI.getDeviceProfileById(dntl.deviceProfile.id)
    let devNetworkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(dntl.id, 'devNwkId'))
    devNetworkId = parseInt(devNetworkId, 10)
    let appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(device.application.id, 'appNwkId'))
    appNwkId = parseInt(appNwkId, 10)
    let deviceData = this.buildRemoteDeviceUpdate(
      dntl,
      deviceProfile
    )
    // Loriot ignores updates on activation properties and device keys
    // if (deviceProfile.networkSettings.supportsJoin && deviceData.deviceKeys) {
    //   await this.client.updateDeviceKeys(network, appNwkId, deviceData.deviceKeys)
    // }
    // else if (deviceData.deviceActivation) {
    //   await this.client.activateDevice(network, appNwkId, deviceData.deviceActivation)
    // }
    // else {
    //   appLogger.log('Remote Device ' + deviceData.device.name + ' does not have authentication parameters')
    // }
    const data = R.omit(['deveui'], deviceData.device)
    await this.client.updateDevice(network, appNwkId, devNetworkId, data)
  }

  async deleteDevice (network, deviceId, dataAPI) {
    let device = await dataAPI.getDeviceById(deviceId)
    let devNetworkId
    let appNwkId
    try {
      devNetworkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(deviceId, 'devNwkId'))
      appNwkId = await this.modelAPI.protocolData.loadValue(network, makeApplicationDataKey(device.application.id, 'appNwkId'))
      appNwkId = parseInt(appNwkId, 10)
    }
    catch (err) {
      // Can't delete without the remote ID.
      appLogger.log("Failed to get remote network's device ID: " + err)
      throw err
    }
    await this.client.deleteDevice(network, appNwkId, devNetworkId)
    try {
      await dataAPI.deleteProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeDeviceDataKey(deviceId, 'devNwkId'))
    }
    catch (err) {
      appLogger.log("Failed to delete remote network's device ID: " + err)
    }
  }

  async passDataToDevice (network, appId, deviceId, body) {
    // Ensure network is enabled
    if (!network.securityData.enabled) return
    if (!body.data) {
      throw httpError(400, 'Downlinks to Loriot don\'t support JSON payloads')
    }
    const devNwkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(deviceId, 'devNwkId'))
    body = {
      cmd: 'tx',
      EUI: devNwkId,
      port: body.fPort,
      confirmed: body.confirmed,
      data: body.data
    }
    // API endpoint for sending downlinks unknown
    // return this.client.createDeviceMessage(network, appId, devNwkId, body)
  }

  buildApplicationNetworkSettings (remoteApplication) {
    const pick = [
      'deviceLimit', 'devices', 'overbosity', 'ogwinfo', 'clientsLimit', 'joinServerId', 'publishAppSKey',
      'cansend', 'orx', 'canotaa', 'suspended'
    ]
    return R.pick(pick, remoteApplication)
  }

  buildRemoteApplication (networkSettings) {
    const defaults = { cansend: true, orx: true, canotaa: true, suspended: false }
    const pick = [
      'overbosity', 'ogwinfo', 'joinServerId', 'publishAppSKey', 'orx', 'canotaa', 'joinrxw'
    ]
    return {
      ...defaults,
      ...R.pick(pick, networkSettings)
    }
  }

  buildDeviceProfileNetworkSettings (remoteDevice) {
    let result = {
      id: remoteDevice._id + '-profile',
      name: remoteDevice.title,
      supportsJoin: !!remoteDevice.appkey
    }
    if (remoteDevice.devclass !== 'A') {
      result[`supportsClass${remoteDevice.devclass}`] = true
    }
    if (remoteDevice.lorawan) {
      let { major, minor, revision } = remoteDevice.lorawan
      result.macVersion = `${major}.${minor}.${revision}`
    }
    return result
  }

  buildDeviceNetworkSettings (remoteDevice) {
    const rd = remoteDevice
    const result = {
      devEUI: rd._id,
      lastSeenAt: rd.lastseen,
      skipFCntCheck: rd.seqrelax
    }
    if (rd.appkey) {
      result.deviceKeys = { appKey: rd.appkey }
    }
    if (rd.devaddr) {
      result.deviceActivation = {
        fCntUp: rd.seqno,
        fCntDwn: rd.seqdn,
        devAddr: rd.devaddr,
        appSKey: rd.appskey,
        nwkSKey: rd.nwkskey
      }
    }
    return result
  }

  buildRemoteDevice (device, deviceNtl, deviceProfile) {
    const ns = deviceNtl.networkSettings

    const result = { device: {
      title: device.name,
      description: device.description,
      deveui: ns.devEUI
    } }

    const [higherClass] = ['C', 'B'].filter(x => deviceProfile.networkSettings[`supportsClass${x}`])
    result.device.devclass = higherClass || 'A'

    if (deviceProfile.networkSettings.macVersion) {
      let [major, minor, revision] = deviceProfile.networkSettings.macVersion.split('.')
      result.device.lorawan = { major, minor, revision }
    }

    if (ns.deviceKeys) {
      result.deviceKeys = {
        deveui: ns.devEUI,
        appkey: ns.deviceKeys.appKey
      }
    }
    else if (ns.deviceActivation && deviceProfile.networkSettings.macVersion.slice(0, 3) === '1.0') {
      result.deviceActivation = {
        deveui: ns.devEUI,
        seqno: ns.deviceActivation.fCntUp || -1,
        seqdn: ns.deviceActivation.fCntDwn || ns.deviceActivation.nFCntDown || 0,
        devaddr: ns.deviceActivation.devAddr,
        appskey: ns.deviceActivation.appSKey,
        nwkskey: ns.deviceActivation.nwkSKey || ns.deviceActivation.fNwkSIntKey
      }
    }

    return result
  }

  buildRemoteDeviceUpdate (deviceNtl, deviceProfile) {
    const ns = deviceNtl.networkSettings
    const result = { device: {
      ...R.pick(['rxw', 'adrMin', 'adrMax', 'adrFix'], ns),
      seqrelax: ns.skipFCntCheck
    } }

    const [higherClass] = ['C', 'B'].filter(x => deviceProfile.networkSettings[`supportsClass${x}`])
    result.device.devclass = higherClass || 'A'

    if (ns.deviceKeys) {
      result.deviceKeys = {
        deveui: ns.devEUI,
        appkey: ns.deviceKeys.appKey
      }
    }
    else if (ns.deviceActivation && deviceProfile.networkSettings.macVersion.slice(0, 3) === '1.0') {
      result.deviceActivation = {
        deveui: ns.devEUI,
        seqno: ns.deviceActivation.fCntUp,
        seqdn: ns.deviceActivation.fCntDwn,
        devaddr: ns.deviceActivation.devAddr,
        appskey: ns.deviceActivation.appSKey,
        nwkskey: ns.deviceActivation.nwkSKey
      }
    }

    return result
  }
}

function makeApplicationDataKey (applicationId, dataName) {
  return 'app:' + applicationId + '/' + dataName
}

function makeDeviceDataKey (deviceId, dataName) {
  return 'dev:' + deviceId + '/' + dataName
}
