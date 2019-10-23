const NetworkProtocol = require('../../NetworkProtocol')
const R = require('ramda')
const { renameKeys } = require('../../../lib/utils')

module.exports = class LoraOpenSource extends NetworkProtocol {
  async connect ({ network }) {
    await this.client.getSession(network)
  }

  async test ({ network }) {
    await this.client.listApplications(network, { limit: 1, offset: 0 })
    return true
  }

  // *******************************************************************
  // Application Methods
  // *******************************************************************
  async listAllApplications ({ network }) {
    let { result } = await this.client.listApplications(network, {
      limit: 9999,
      offset: 0
    })
    return result
  }

  async buildApplication (network, remoteApp) {
    remoteApp = await this.client.loadApplication(network, remoteApp.id)
    let integration = await this.client.loadApplicationIntegration(network, remoteApp.id, 'http')
      .catch(err => {
        if (err.statusCode !== 404) throw err
      })
    let props = ['name', 'description', 'payloadCodec', 'payloadDecoderScript', 'payloadEncoderScript']
    let application = R.pick(props, remoteApp)
    if (integration) application.baseUrl = integration.uplinkDataURL
    return application
  }

  async createApplication ({ network, application }) {
    // TODO: obtain serviceProfile and org and pass them to buildNetworkApplication
    return this.client.createApplication(network, this.buildNetworkApplication(application))
  }

  async updateApplication ({ network, remoteId, application }) {
    // TODO: obtain serviceProfile and org and pass them to buildNetworkApplication
    return this.client.updateApplication(network, remoteId, {
      id: remoteId,
      ...this.buildNetworkApplication(application)
    })
  }

  async removeApplication ({ network, remoteId, stopApplication }) {
    if (stopApplication) {
      await this.stopApplication({ network, remoteId })
    }
    await this.client.deleteApplication(network, remoteId)
  }

  async startApplication ({ network, networkDeployment, url }) {
    const { remoteId } = networkDeployment.meta
    const body = {
      ackNotificationURL: url,
      errorNotificationURL: url,
      joinNotificationURL: url,
      uplinkDataURL: url,
      statusNotificationURL: url,
      locationNotificationURL: url
    }
    try {
      await this.client.loadApplicationIntegration(network, remoteId, 'http')
      await this.client.updateApplicationIntegration(network, remoteId, 'http', body)
    }
    catch (err) {
      if (err.statusCode !== 404) throw err
      await this.client.createApplicationIntegration(network, remoteId, 'http', body)
    }
  }

  async stopApplication ({ network, remoteId }) {
    try {
      await this.client.loadApplicationIntegration(network, remoteId, 'http')
    }
    catch (err) {
      if (err.statusCode === 404) return
      throw err
    }
    await this.client.deleteApplicationIntegration(network, remoteId, 'http')
  }

  buildNetworkApplication (app, serviceProfileID, organizationID) {
    let props = [
      'name', 'description', 'payloadCodec', 'payloadDecoderScript', 'payloadEncoderScript'
    ]
    return {
      ...R.pick(props, app),
      organizationID,
      serviceProfileID
    }
  }

  // *******************************************************************
  // Device Profile Methods
  // *******************************************************************
  async listAllDeviceProfiles (network) {
    const { result } = await this.client.listDeviceProfiles(network, {
      limit: 9999,
      offset: 0
    })
    return result
  }

  async createDeviceProfile ({ network, deviceProfile }) {
    // TODO: obtain serviceProfile and org and pass them to buildNetworkDeviceProfile
    return this.client.createDeviceProfile(network, this.buildNetworkDeviceProfile(deviceProfile))
  }

  async updateDeviceProfile ({ network, remoteId, deviceProfile }) {
    // TODO: obtain serviceProfile and org and pass them to buildNetworkDeviceProfile
    return this.client.updateDeviceProfile(network, remoteId, {
      id: remoteId,
      ...this.buildNetworkDeviceProfile(deviceProfile)
    })
  }

  async removeDeviceProfile ({ network, remoteId }) {
    await this.client.deleteDeviceProfile(network, remoteId)
  }

  async buildDeviceProfile (network, remoteDeviceProfile) {
    remoteDeviceProfile = await this.client.loadDeviceProfile(network, remoteDeviceProfile.id)
    return R.omit(['createdAt', 'updatedAt'], remoteDeviceProfile)
  }

  buildNetworkDeviceProfile (deviceProfile, networkServerId, organizationId) {
    const props = [
      'name', 'description', 'classBTimeout', 'classCTimeout', 'factoryPresetFreqs', 'macVersion',
      'maxDutyCycle', 'maxEIRP', 'pingSlotDR', 'pingSlotFreq', 'pingSlotPeriod',
      'regParamsRevision', 'rfRegion', 'rxDROffset1', 'rxDataRate2', 'rxDelay1', 'rxFreq2',
      'supports32bitFCnt', 'supportsClassB', 'supportsClassC', 'supportsJoin'
    ]
    return {
      networkServerID: networkServerId,
      organizationID: organizationId,
      ...R.pick(props, deviceProfile)
    }
  }

  // *******************************************************************
  // Device Methods
  // *******************************************************************
  async listAllApplicationDevices (network, remoteApp) {
    const { result } = await this.client.listDevices(network, remoteApp.id, { limit: 9999, offset: 0 })
    return result
  }

  async createDevice (args) {
    const { network, device, deviceProfile } = args
    const remoteDevice = await this.client.createDevice(network, this.buildNetworkDevice(args))
    if (deviceProfile.supportsJoin && device.deviceKeys) {
      await this.client.createDeviceKeys(network, device.devEUI, device.deviceKeys)
    }
    else if (device.deviceActivation && device.deviceActivation.fCntUp >= 0) {
      await this.client.activateDevice(network, device.devEUI, device.deviceActivation)
    }
    return remoteDevice
  }

  async updateDevice (args) {
    const { network, device, deviceProfile, remoteId } = args
    const remoteDevice = await this.client.updateDevice(network, remoteId, {
      id: remoteId,
      ...this.buildNetworkDevice(args)
    })
    if (deviceProfile.supportsJoin && device.deviceKeys) {
      await this.client.updateDeviceKeys(network, device.devEUI, device.deviceKeys)
    }
    else if (device.deviceActivation) {
      await this.client.deleteDeviceActivation(network, device.devEUI)
      await this.client.activateDevice(network, device.devEUI, device.deviceActivation)
    }
    return remoteDevice
  }

  async removeDevice ({ network, remoteId }) {
    // TODO: make delete device keys/activation conditional
    // What about deleteDeviceActivation?
    await this.client.deleteDeviceKeys(network, remoteId)
    await this.client.deleteDevice(network, remoteId)
  }

  async buildDevice (network, remoteDevice, deviceProfile) {
    remoteDevice = await this.client.loadDevice(network, remoteDevice.id)
    let props = [
      'name', 'description', 'devEUI', 'deviceStatusBattery', 'deviceStatusMargin', 'lastSeenAt',
      'location', 'referenceAltitude', 'skipFCntCheck'
    ]
    const device = R.pick(props, remoteDevice)
    if (deviceProfile.supportsJoin) {
      device.deviceKeys = await this.client.loadDeviceKeys(network, remoteDevice.devEUI)
    }
    else {
      device.deviceActivation = await this.client.loadDeviceActivation(network, remoteDevice.devEUI)
    }
    return device
  }

  buildNetworkDevice ({ device, remoteApplicationId, remoteDeviceProfileId }) {
    return { device: {
      ...R.pick(['name', 'description', 'devEUI', 'skipFCntCheck'], device),
      applicationID: remoteApplicationId,
      deviceProfileID: remoteDeviceProfileId
    } }
  }

  async passDataToDevice ({ network, remoteId, data }) {
    data = renameKeys({ jsonData: 'jsonObject' }, data)
    return this.client.createDeviceMessage(network, remoteId, { ...data, devEUI: remoteId })
  }
}
