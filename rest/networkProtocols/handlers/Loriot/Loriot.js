const NetworkProtocol = require('../../NetworkProtocol')
const appLogger = require('../../../lib/appLogger.js')
const R = require('ramda')
const config = require('../../../config')
const httpError = require('http-errors')

module.exports = class Loriot extends NetworkProtocol {
  getCompanyAccessAccount (network) {
    const { securityData } = network
    if (!securityData || !securityData.apiKey) {
      appLogger.log('Network security data is incomplete for ' + network.name)
      return null
    }
    return securityData
  }

  async connect (network, loginData) {
    return loginData.apiKey
  }

  async test (session, network) {
    await this.client.listApplications(session, network, { perPage: 20, page: 1 })
    return true
  }

  async pullNetwork (session, network, dataAPI, modelAPI) {
    const apps = await this.pullApplications(session, network, modelAPI, dataAPI)
    await Promise.all(apps.reduce((acc, x) => {
      acc.push(this.pullDevices(session, network, x.remoteApp._id, x.localApp.id, modelAPI, dataAPI))
      acc.push(this.pullIntegrations(session, network, x.remoteApp._id, x.localApp.id, modelAPI, dataAPI))
      return acc
    }, []))
  }

  async pushNetwork (session, network, dataAPI, modelAPI) {
    await this.pushApplications(session, network, modelAPI, dataAPI)
    await this.pushDevices(session, network, modelAPI, dataAPI)
  }

  async pullApplications (session, network, modelAPI, dataAPI) {
    let { apps } = await this.client.listApplications(session, network, {
      perPage: 9999,
      page: 1
    })
    return Promise.all(apps.map(app => this.addRemoteApplication(session, network, app._id, modelAPI, dataAPI)))
  }

  async pushApplications (session, network, modelAPI, dataAPI) {
    let { records } = await modelAPI.applications.retrieveApplications()
    await Promise.all(records.map(x => this.pushApplication(session, network, x, dataAPI, false)))
  }

  async addRemoteApplication (session, network, remoteAppId, modelAPI, dataAPI) {
    const remoteApp = await this.client.loadApplication(session, network, remoteAppId)
    const { records: localApps } = await modelAPI.applications.retrieveApplications({ search: remoteApp.name })
    let localApp = localApps[0]
    if (localApp) {
      appLogger.log(localApp.name + ' already exists')
    }
    else {
      localApp = await modelAPI.applications.createApplication({
        ...R.pick(['name', 'description'], remoteApp),
        companyId: 2,
        reportingProtocolId: 1,
        baseUrl: 'http://set.me.to.your.real.url:8888'
      })
      appLogger.log('Created ' + localApp.name)
    }
    const { records: appNtls } = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({ applicationId: localApp.id })
    let appNtl = appNtls[0]
    if (appNtl) {
      appLogger.log(localApp.name + ' link already exists')
    }
    else {
      appNtl = await modelAPI.applicationNetworkTypeLinks.createApplicationNetworkTypeLink(
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
      await dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(localApp.id, 'appNwkId'),
        `${remoteApp._id}`
      )
      await dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(localApp.id, 'appEUI'),
        remoteApp.appeui
      )
    }
    return { localApp, remoteApp }
  }

  async pushApplication (session, network, app, dataAPI, update = true) {
    let appNetworkId
    try {
      appNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(app.id, 'appNwkId')
      )
      if (appNetworkId) appNetworkId = parseInt(appNetworkId, 10)
      if (update && appNetworkId) {
        return this.updateApplication(session, network, app.id, dataAPI)
      }
      else if (appNetworkId) {
        appLogger.log('Ignoring Application  ' + app.id + ' already on network ' + network.name)
        return { localApplication: app.id, remoteApplication: appNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      appNetworkId = await this.addApplication(session, network, app.id, dataAPI)
      appLogger.log('Added application ' + app.id + ' to network ' + network.name)
      return { localApplication: app.id, remoteApplication: appNetworkId }
    }
  }

  async addApplication (session, network, appId, dataAPI) {
    try {
      // Get the local application data.
      const localApp = await dataAPI.getApplicationById(appId)
      // Loriot only accepts "title" and "capacity" (both required) when creating new apps
      // Title is called name when fetching the app, only it's title on create.
      const body = await this.client.createApplication(session, network, { title: localApp.name, capacity: 10 })
      // Save the application ID from the remote network.
      await dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(localApp.id, 'appNwkId'),
        `${body._id}`
      )
    }
    catch (err) {
      appLogger.log('Failed to get required data for addApplication: ' + err)
      throw err
    }
  }

  async deleteApplication (session, network, appId, dataAPI) {
    let appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(appId, 'appNwkId')
    )
    appNetworkId = parseInt(appNetworkId, 10)
    await this.client.deleteApplication(session, network, appNetworkId)
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(appId, 'appNwkId')
    )
  }

  async pullDevices (session, network, remoteAppId, localAppId, modelAPI, dataAPI) {
    const params = { perPage: 9999, page: 1 }
    const { devices } = await this.client.listDevices(session, network, remoteAppId, params)
    return Promise.all(devices.map(device => this.addRemoteDevice(session, network, device._id, remoteAppId, localAppId, modelAPI, dataAPI)))
  }

  async addRemoteDevice (session, network, remoteDeviceId, remoteAppId, localAppId, modelAPI, dataAPI) {
    const remoteDevice = await this.client.loadDevice(session, network, remoteAppId, remoteDeviceId)
    appLogger.log('Adding ' + remoteDevice.title)
    appLogger.log(remoteDevice)
    let { records } = await modelAPI.devices.retrieveDevices({ search: remoteDevice.title })
    let localDevice = records[0]
    if (localDevice) {
      appLogger.log(localDevice.name + ' already exists')
    }
    else {
      appLogger.log('creating ' + remoteDevice.title)
      localDevice = await modelAPI.devices.createDevice(remoteDevice.title, remoteDevice.description, localAppId)
      appLogger.log('Created ' + localDevice.name)
    }

    let { totalCount } = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({ deviceId: localDevice.id })
    if (totalCount > 0) {
      appLogger.log(localDevice.name + ' link already exists')
    }
    else {
      appLogger.log('creating Network Link for ' + localDevice.name)
      const dp = await this.addRemoteDeviceProfile(remoteDevice, network, modelAPI)
      appLogger.log(dp, 'info')
      let networkSettings = this.buildDeviceNetworkSettings(remoteDevice, dp.localDeviceProfile)
      appLogger.log(networkSettings)
      const deviceNtl = await modelAPI.deviceNetworkTypeLinks.createDeviceNetworkTypeLink(localDevice.id, network.networkType.id, dp.localDeviceProfile, networkSettings, 2, { remoteOrigin: true })
      appLogger.log(deviceNtl)
    }
    dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeDeviceDataKey(localDevice.id, 'devNwkId'),
      remoteDevice._id
    )
    return localDevice.id
  }

  async addRemoteDeviceProfile (remoteDevice, network, modelAPI) {
    let networkSettings = this.buildDeviceProfileNetworkSettings(remoteDevice)
    appLogger.log(networkSettings, 'error')
    try {
      const localDeviceProfile = await modelAPI.deviceProfiles.createDeviceProfile(
        network.networkType.id,
        2,
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

  async pullIntegrations (session, network, remoteAppId, localAppId, modelAPI) {
    const remoteApp = await this.client.loadApplication(session, network, remoteAppId)
    const [ integration ] = remoteApp.outputs.filter(x => x.output === 'httppush')
    appLogger.log(integration, 'warn')
    const deliveryURL = `api/ingest/${localAppId}/${network.id}`
    const reportingUrl = `${config.get('base_url')}${deliveryURL}`
    if (!integration || integration.osetup.url === reportingUrl) return
    await modelAPI.applications.updateApplication({ id: localAppId, baseUrl: integration.uplinkDataURL })
    const updatePayload = { output: 'httppush', osetup: { url: reportingUrl } }
    if (integration) {
      await this.client.updateApplicationIntegrations(session, network, remoteApp._id, updatePayload)
    }
    else {
      await this.client.createApplicationIntegration(session, network, remoteApp._id, updatePayload)
    }
  }

  async pushDevices (session, network, modelAPI, dataAPI) {
    let { records } = await modelAPI.devices.retrieveDevices()
    await Promise.all(records.map(x => this.pushDevice(session, network, x, dataAPI, false)))
  }

  async pushDevice (session, network, device, dataAPI, update = true) {
    let devNetworkId
    try {
      devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeDeviceDataKey(device.id, 'devNwkId')
      )
      if (update && devNetworkId) {
        return this.updateDevice(session, network, device.id, dataAPI)
      }
      else if (devNetworkId) {
        appLogger.log('Ignoring Device  ' + device.id + ' already on network ' + network.name)
        return { localDevice: device.id, remoteDevice: devNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      devNetworkId = await this.addDevice(session, network, device.id, dataAPI)
      appLogger.log('Added Device ' + device.id + ' to network ' + network.name)
      return { localDevice: device.id, remoteDevice: devNetworkId }
    }
  }

  async addDevice (session, network, deviceId, dataAPI) {
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
    let appNwkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(device.application.id, 'appNwkId'))
    appNwkId = parseInt(appNwkId, 10)
    let deviceData = this.buildRemoteDevice(
      device,
      dntl,
      deviceProfile
    )
    // when creating a device on Loriot, keys and activation props can be included
    const data = deviceData.device
    if (deviceData.deviceKeys) {
      Object.assign(data, deviceData.deviceKeys)
    }
    else if (deviceData.deviceActivation) {
      Object.assign(data, deviceData.deviceActivation)
    }
    else {
      appLogger.log('Remote Device ' + deviceData.device.name + ' does not have authentication parameters')
    }
    await this.client.createDevice(session, network, appNwkId, data)
    dataAPI.putProtocolDataForKey(network.id,
      network.networkProtocol.id,
      makeDeviceDataKey(device.id, 'devNwkId'),
      deviceData.device.deveui)
    return dntl.networkSettings.devEUI
  }

  async getDevice (session, network, deviceId, dataAPI) {
    const device = dataAPI.getDeviceById(deviceId)
    var devNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeDeviceDataKey(deviceId, 'devNwkId'))
    return this.client.loadDevice(session, network, device.application.id, devNetworkId)
  }

  async updateDevice (session, network, deviceId, dataAPI) {
    let device = await dataAPI.getDeviceById(deviceId)
    const dntl = await dataAPI.getDeviceNetworkType(device.id, network.networkType.id)
    const deviceProfile = await dataAPI.getDeviceProfileById(dntl.deviceProfile.id)
    let devNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeDeviceDataKey(dntl.id, 'devNwkId'))
    devNetworkId = parseInt(devNetworkId, 10)
    let appNwkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(device.application.id, 'appNwkId'))
    appNwkId = parseInt(appNwkId, 10)
    let deviceData = this.buildRemoteDeviceUpdate(
      dntl,
      deviceProfile
    )
    // Unable to update device with a basic payload that should be allowed according to the docs
    // The error is 400 with no message
    // await this.client.updateDevice(session, network, appNwkId, devNetworkId, deviceData.device)
    if (deviceProfile.networkSettings.supportsJoin && deviceData.deviceKeys) {
      await this.client.updateDeviceKeys(session, network, appNwkId, deviceData.deviceKeys)
    }
    else if (deviceData.deviceActivation) {
      await this.client.activateDevice(session, network, appNwkId, deviceData.deviceActivation)
    }
    else {
      appLogger.log('Remote Device ' + deviceData.device.name + ' does not have authentication parameters')
    }
  }

  async deleteDevice (session, network, deviceId, dataAPI) {
    let device = await dataAPI.getDeviceById(deviceId)
    let devNetworkId
    let appNwkId
    try {
      devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeDeviceDataKey(deviceId, 'devNwkId'))
      appNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(device.application.id, 'appNwkId'))
      appNwkId = parseInt(appNwkId, 10)
    }
    catch (err) {
      // Can't delete without the remote ID.
      appLogger.log("Failed to get remote network's device ID: " + err)
      throw err
    }
    await this.client.deleteDevice(session, network, appNwkId, devNetworkId)
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
        seqno: ns.deviceActivation.fCntUp,
        seqdn: ns.deviceActivation.fCntDwn,
        devaddr: ns.deviceActivation.devAddr,
        appskey: ns.deviceActivation.appSKey,
        nwkskey: ns.deviceActivation.nwkSKey
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
