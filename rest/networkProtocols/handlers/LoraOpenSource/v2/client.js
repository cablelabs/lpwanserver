const LoraOpenSourceRestClient = require('../LoraOpenSourceRestClient')
const R = require('ramda')

module.exports = class LoraOpenSourceV1RestClient extends LoraOpenSourceRestClient {
  createOrganization (session, network, body) {
    return super.createOrganization(session, network, { organization: body })
  }
  updateOrganization (session, network, body) {
    return super.updateOrganization(session, network, { organization: body })
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
  updateServiceProfile (session, network, id, body) {
    return super.updateServiceProfile(session, network, id, { serviceProfile: body })
  }
  createApplication (session, network, body) {
    return super.createApplication(session, network, { application: body })
  }
  updateApplication (session, network, id, body) {
    return super.updateApplication(session, network, id, { application: body })
  }
  createApplicationIntegration (session, network, appId, id, body) {
    return super.createApplication(session, network, appId, id, { integration: body })
  }
  updateApplicationIntegration (session, network, appId, id, body) {
    return super.updateApplicationIntegration(session, network, appId, id, { integration: body })
  }
  createDeviceProfile (session, network, body) {
    return super.createDeviceProfile(session, network, { deviceProfile: body })
  }
  updateDeviceProfile (session, network, id, body) {
    return super.updateDeviceProfile(session, network, id, { deviceProfile: body })
  }
  createDevice (session, network, appId, body) {
    return super.createDevice(session, network, appId, { device: body })
  }
  updateDevice (session, network, appId, id, body) {
    return super.updateDevice(session, network, appId, id, { device: body })
  }
  createDeviceKeys (session, network, id, body) {
    return super.createDeviceKeys(session, network, id, { deviceKeys: body })
  }
  updateDeviceKeys (session, network, id, body) {
    return super.updateDevice(session, network, id, { deviceKeys: body })
  }
  activateDevice (session, network, id, body) {
    return super.activateDevice(session, network, id, { deviceActivation: body })
  }
  listDevices (session, network, appId, params) {
    const opts = { url: this.constructUrl({ url: '/devices', params: { ...params, applicationID: appId } }) }
    return this.request(network, opts, session)
  }
}
