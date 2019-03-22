const LoraOpenSourceRestClient = require('../client')
const R = require('ramda')

module.exports = class LoraOpenSourceV1RestClient extends LoraOpenSourceRestClient {
  createOrganization (network, session, body) {
    return super.createOrganization(network, session, { organization: body })
  }
  replaceOrganization (network, session, body) {
    return super.replaceOrganization(network, session, { organization: body })
  }
  async createUser (network, session, body) {
    const props = ['organizations', 'password']
    return super.createUser(network, session, {
      ...R.pick(props, body),
      user: R.omit(props, body)
    })
  }
  createServiceProfile (network, session, body) {
    return super.createServiceProfile(network, session, { serviceProfile: body })
  }
  createApplication (network, session, body) {
    return super.createApplication(network, session, { application: body })
  }
  replaceApplication (network, session, body) {
    return super.replaceApplication(network, session, { application: body })
  }
  createApplicationIntegration (network, session, appId, id, body) {
    return super.createApplication(network, session, appId, id, { integration: body })
  }
  replaceApplicationIntegration (network, session, appId, id, body) {
    return super.replaceApplicationIntegration(network, session, appId, id, { integration: body })
  }
  createDeviceProfile (network, session, body) {
    return super.createDeviceProfile(network, session, { deviceProfile: body })
  }
  replaceDeviceProfile (network, session, body) {
    return super.replaceDeviceProfile(network, session, { deviceProfile: body })
  }
  createDevice (network, session, body) {
    return super.createDevice(network, session, { device: body })
  }
  replaceDevice (network, session, devEUI, body) {
    return super.replaceDevice(network, session, devEUI, { device: body })
  }
  createDeviceKeys (network, session, devEUI, body) {
    return super.createDeviceKeys(network, session, devEUI, { deviceKeys: body })
  }
  replaceDeviceKeys (network, session, devEUI, body) {
    return super.replaceDevice(network, session, devEUI, { deviceKeys: body })
  }
  activateDevice (network, session, devEUI, body) {
    return super.activateDevice(network, session, devEUI, { deviceActivation: body })
  }
  listDevices (network, session, params) {
    const opts = { url: this.constructUrl({ url: '/devices', params }) }
    return this.request(network, opts, session)
  }
}

