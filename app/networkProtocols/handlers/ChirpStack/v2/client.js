const ChirpStackRestClient = require('../ChirpStackRestClient')
const R = require('ramda')

module.exports = class ChirpStackV2RestClient extends ChirpStackRestClient {
  createOrganization (network, body) {
    return super.createOrganization(network, { organization: body })
  }
  updateOrganization (network, body) {
    return super.updateOrganization(network, { organization: body })
  }
  async createUser (network, body) {
    const props = ['organizations', 'password']
    return super.createUser(network, {
      ...R.pick(props, body),
      user: R.omit(props, body)
    })
  }
  createServiceProfile (network, body) {
    return super.createServiceProfile(network, { serviceProfile: body })
  }
  updateServiceProfile (network, id, body) {
    return super.updateServiceProfile(network, id, { serviceProfile: body })
  }
  createApplication (network, body) {
    return super.createApplication(network, { application: body })
  }
  updateApplication (network, id, body) {
    return super.updateApplication(network, id, { application: body })
  }
  createApplicationIntegration (network, appId, id, body) {
    return super.createApplicationIntegration(network, appId, id, { integration: body })
  }
  updateApplicationIntegration (network, appId, id, body) {
    return super.updateApplicationIntegration(network, appId, id, { integration: body })
  }
  createDeviceProfile (network, body) {
    return super.createDeviceProfile(network, { deviceProfile: body })
  }
  updateDeviceProfile (network, id, body) {
    return super.updateDeviceProfile(network, id, { deviceProfile: body })
  }
  createDevice (network, body) {
    return super.createDevice(network, { device: body })
  }
  updateDevice (network, id, body) {
    return super.updateDevice(network, id, { device: body })
  }
  createDeviceKeys (network, id, body) {
    return super.createDeviceKeys(network, id, { deviceKeys: body })
  }
  updateDeviceKeys (network, id, body) {
    return super.updateDeviceKeys(network, id, { deviceKeys: body })
  }
  activateDevice (network, id, body) {
    return super.activateDevice(network, id, { deviceActivation: body })
  }
  listDevices (network, appId, params) {
    const opts = { url: this.constructUrl({ url: '/devices', params: { ...params, applicationID: appId } }) }
    return this.request(network, opts)
  }
  createDeviceMessage (network, id, body) {
    return super.createDeviceMessage(network, id, { deviceQueueItem: body })
  }
  async listDeviceMessages (network, id) {
    const { deviceQueueItems } = await super.listDeviceMessages(network, id)
    return { result: deviceQueueItems }
  }
  createNetworkServer (network, body) {
    return super.createNetworkServer(network, { networkServer: body })
  }
}
