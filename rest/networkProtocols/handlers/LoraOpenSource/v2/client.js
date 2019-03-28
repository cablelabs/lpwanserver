const LoraOpenSourceRestClient = require('../client')
const R = require('ramda')

module.exports = class LoraOpenSourceV1RestClient extends LoraOpenSourceRestClient {
  createOrganization (session, network, body) {
    return super.createOrganization(session, network, { organization: body })
  }
  replaceOrganization (session, network, body) {
    return super.replaceOrganization(session, network, { organization: body })
  }
  async createUser (session, network, body) {
    const props = ['organizations', 'password']
    return super.createUser(session, network, {
      ...R.pick(props, body),
      user: R.omit(props, body)
    })
  }
  createServiceProfile (session, network, body) {
    return super.createServiceProfile(session, network, { serviceProfile: body })
  }
  replaceServiceProfile (session, network, id, body) {
    return super.createServiceProfile(session, network, id, { serviceProfile: body })
  }
  createApplication (session, network, body) {
    return super.createApplication(session, network, { application: body })
  }
  replaceApplication (session, network, id, body) {
    return super.replaceApplication(session, network, id, { application: body })
  }
  createApplicationIntegration (session, network, appId, id, body) {
    return super.createApplication(session, network, appId, id, { integration: body })
  }
  replaceApplicationIntegration (session, network, appId, id, body) {
    return super.replaceApplicationIntegration(session, network, appId, id, { integration: body })
  }
  createDeviceProfile (session, network, body) {
    return super.createDeviceProfile(session, network, { deviceProfile: body })
  }
  replaceDeviceProfile (session, network, id, body) {
    return super.replaceDeviceProfile(session, network, id, { deviceProfile: body })
  }
  createDevice (session, network, body) {
    return super.createDevice(session, network, { device: body })
  }
  replaceDevice (session, network, devEUI, body) {
    return super.replaceDevice(session, network, devEUI, { device: body })
  }
  createDeviceKeys (session, network, devEUI, body) {
    return super.createDeviceKeys(session, network, devEUI, { deviceKeys: body })
  }
  replaceDeviceKeys (session, network, devEUI, body) {
    return super.replaceDevice(session, network, devEUI, { deviceKeys: body })
  }
  activateDevice (session, network, devEUI, body) {
    return super.activateDevice(session, network, devEUI, { deviceActivation: body })
  }
  listDevices (session, network, params) {
    const opts = { url: this.constructUrl({ url: '/devices', params }) }
    return this.request(network, opts, session)
  }
}

