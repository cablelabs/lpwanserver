const NetworkProtocol = require('../../NetworkProtocol')
const R = require('ramda')

module.exports = class ChirpStack extends NetworkProtocol {
  async connect ({ network }) {
    const { username, password } = network.securityData
    if (!(username && password)) {
      throw new Error('Username and/or password missing.  Cannot connect.')
    }
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
      offset: 0,
      params: { orgainzationID: network.networkSettings.orgainzationID }
    })
    return result
  }

  async createApplication ({ network, application }) {
    return this.client.createApplication(network, this.buildNetworkApplication(network, application))
  }

  async updateApplication ({ network, remoteId, application }) {
    return this.client.updateApplication(network, remoteId, {
      id: remoteId,
      ...this.buildNetworkApplication(network, application)
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
      locationNotificationURL: url,
      headers: [
        {
          key: 'Authorization',
          value: `Basic ${Buffer.from(`${network.id}:${network.securityData.uplinkApiKey}`).toString('base64')}`
        }
      ]
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

  async buildApplication ({ network, remoteApplication }) {
    remoteApplication = await this.client.loadApplication(network, remoteApplication.id)
    let integration = await this.client.loadApplicationIntegration(network, remoteApplication.id, 'http')
      .catch(err => {
        if (err.statusCode !== 404) throw err
      })
    let props = ['id', 'name', 'description', 'payloadCodec', 'payloadDecoderScript', 'payloadEncoderScript']
    let application = R.pick(props, remoteApplication)
    if (integration) application.baseUrl = integration.uplinkDataURL
    return application
  }

  buildNetworkApplication (network, app) {
    let props = [
      'name', 'description', 'payloadCodec', 'payloadDecoderScript', 'payloadEncoderScript'
    ]
    return {
      ...R.pick(props, app),
      ...R.pick(['organizationID', 'serviceProfileID'], network.networkSettings)
    }
  }

  // *******************************************************************
  // Device Profile Methods
  // *******************************************************************
  async listAllDeviceProfiles ({ network }) {
    const { result } = await this.client.listDeviceProfiles(network, {
      limit: 9999,
      offset: 0,
      params: { orgainzationID: network.networkSettings.orgainzationID }
    })
    return result
  }

  async createDeviceProfile ({ network, deviceProfile }) {
    return this.client.createDeviceProfile(network, this.buildNetworkDeviceProfile(network, deviceProfile))
  }

  async updateDeviceProfile ({ network, remoteId, deviceProfile }) {
    return this.client.updateDeviceProfile(network, remoteId, {
      id: remoteId,
      ...this.buildNetworkDeviceProfile(network, deviceProfile)
    })
  }

  async removeDeviceProfile ({ network, remoteId }) {
    await this.client.deleteDeviceProfile(network, remoteId)
  }

  async buildDeviceProfile ({ network, remoteDeviceProfile }) {
    remoteDeviceProfile = await this.client.loadDeviceProfile(network, remoteDeviceProfile.id)
    if (remoteDeviceProfile.supports32bitFCnt && !remoteDeviceProfile.supports32BitFCnt) {
      remoteDeviceProfile.supports32BitFCnt = remoteDeviceProfile.supports32bitFCnt
    }
    delete remoteDeviceProfile.supports32bitFCnt
    const relIds = ['organizationID', 'networkServerID']
    const unknownIds = relIds
      .filter(x => remoteDeviceProfile[x])
      .filter(x => remoteDeviceProfile[x] !== network.networkSettings[x])
    if (!unknownIds.length) {
      return R.omit([...relIds, 'createdAt', 'updatedAt'], remoteDeviceProfile)
    }
    const relStr = key => `${key}:(Network:${network.networkSettings[key]})(DeviceProfile:${remoteDeviceProfile[key]})`
    let msg = `Remote DeviceProfile relationship IDs don't match those in network.  ${unknownIds.map(relStr).join('; ')}`
    throw new Error(msg)
  }

  buildNetworkDeviceProfile (network, deviceProfile) {
    const props = [
      'name', 'description', 'classBTimeout', 'classCTimeout', 'factoryPresetFreqs', 'macVersion',
      'maxDutyCycle', 'maxEIRP', 'pingSlotDR', 'pingSlotFreq', 'pingSlotPeriod',
      'regParamsRevision', 'rfRegion', 'rxDROffset1', 'rxDataRate2', 'rxDelay1', 'rxFreq2',
      'supports32bitFCnt', 'supportsClassB', 'supportsClassC', 'supportsJoin'
    ]
    return {
      ...R.pick(['networkServerID', 'organizationID'], network.networkSettings),
      ...R.pick(props, deviceProfile)
    }
  }

  // *******************************************************************
  // Device Methods
  // *******************************************************************
  async listAllApplicationDevices ({ network, remoteApplication }) {
    const { result } = await this.client.listDevices(network, remoteApplication.id, { limit: 9999, offset: 0 })
    return result
  }

  async createDevice (args) {
    const { network, deviceProfile } = args
    const { device, deviceKeys, deviceActivation } = this.buildNetworkDevice(args)
    await this.client.createDevice(network, device)
    if (deviceProfile.supportsJoin && deviceKeys) {
      await this.client.createDeviceKeys(network, device.devEUI, deviceKeys)
    }
    else if (deviceActivation && deviceActivation.fCntUp >= 0) {
      await this.client.activateDevice(network, device.devEUI, deviceActivation)
    }
    return { id: device.devEUI }
  }

  async updateDevice (args) {
    const { network, deviceProfile, remoteId } = args
    const { device, deviceKeys, deviceActivation } = this.buildNetworkDevice(args)
    const result = await this.client.updateDevice(network, remoteId, device)
    if (deviceProfile.supportsJoin && deviceKeys) {
      await this.client.updateDeviceKeys(network, device.devEUI, deviceKeys)
    }
    else if (deviceActivation) {
      await this.client.deleteDeviceActivation(network, device.devEUI)
      await this.client.activateDevice(network, device.devEUI, deviceActivation)
    }
    return result
  }

  async removeDevice ({ network, remoteId }) {
    // TODO: does deviceActivation or deviceKeys need to be deleted first?
    await this.client.deleteDevice(network, remoteId)
  }

  async buildDevice ({ network, remoteDevice, deviceProfile }) {
    remoteDevice = await this.client.loadDevice(network, remoteDevice.devEUI)
    let props = [
      'name', 'description', 'devEUI', 'deviceStatusBattery', 'deviceStatusMargin', 'lastSeenAt',
      'location', 'referenceAltitude', 'skipFCntCheck'
    ]
    const device = R.pick(props, remoteDevice)
    device.id = device.devEUI
    try {
      if (deviceProfile.supportsJoin) {
        device.deviceKeys = await this.client.loadDeviceKeys(network, remoteDevice.devEUI)
      }
      else {
        device.deviceActivation = await this.client.loadDeviceActivation(network, remoteDevice.devEUI)
      }
    }
    catch (err) {
      console.error(err.toString())
      // device does not have keys or activation
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

  async passDataToDevice ({ network, remoteDeviceId, data }) {
    return this.client.createDeviceMessage(network, remoteDeviceId, { ...data, devEUI: remoteDeviceId })
  }
}
