const RestClient = require('../../RestClient')
const R = require('ramda')
const { lift } = require('../../../lib/utils')
const jwt = require('jsonwebtoken')

module.exports = class LoraOpenSourceRestClient extends RestClient {
  async request (network, opts, transformResponse) {
    const session = await this.getSession(network)
    opts.url = this.constructUrl({ network, url: opts.url })
    return super.request({
      opts: this.addRequestDefaults(opts, session),
      transformResponse
    })
  }

  async getSession (network) {
    const sessionKey = `session:${network.id}`
    let session = this.cache.get(sessionKey)
    if (!session || (session.data.exp * 1000) < Date.now()) {
      const accessToken = await this.login(network)
      session = { accessToken, data: jwt.decode(accessToken) }
      this.cache.set(sessionKey, session)
    }
    return session
  }

  addRequestDefaults (opts, session) {
    opts.agentOptions = {
      secureProtocol: 'TLSv1_2_method',
      rejectUnauthorized: false
    }
    if (session) {
      opts.headers = R.merge(opts.headers, { Authorization: `Bearer ${session.accessToken}` })
    }
    return opts
  }

  login (network) {
    const opts = this.addRequestDefaults({
      method: 'POST',
      url: this.constructUrl({ network, url: '/internal/login' }),
      body: R.pick(['username', 'password'], network.securityData)
    })
    return super.request({ opts, transformResponse: R.prop('jwt') })
  }

  loadOrganization (network, id) {
    const opts = { url: `/organizations/${id}` }
    return this.request(network, opts, lift(['organization']))
  }

  listOrganizations (network, params) {
    let opts = { url: this.constructUrl({ url: '/organizations', params }) }
    return this.request(network, opts)
  }

  createOrganization (network, body) {
    const opts = { method: 'POST', url: '/organizations', body }
    return this.request(network, opts)
  }

  updateOrganization (network, id, body) {
    const opts = { method: 'PUT', url: `/organizations/${id}`, body }
    return this.request(network, opts)
  }

  deleteOrganization (network, id) {
    const opts = { method: 'DELETE', url: `/organizations/${id}` }
    return this.request(network, opts)
  }

  createUser (network, body) {
    const opts = { method: 'POST', url: '/users', body }
    return this.request(network, opts)
  }

  deleteUser (network, id) {
    const opts = { method: 'DELETE', url: `/users/${id}` }
    return this.request(network, opts)
  }

  createServiceProfile (network, body) {
    const opts = { method: 'POST', url: '/service-profiles', body }
    return this.request(network, opts)
  }

  updateServiceProfile (network, id, body) {
    const opts = { method: 'POST', url: `/service-profiles/${id}`, body }
    return this.request(network, opts)
  }

  createNetworkServer (network, body) {
    const opts = { method: 'POST', url: '/network-servers', body }
    return this.request(network, opts)
  }

  listNetworkServers (network, params) {
    let opts = { url: this.constructUrl({ url: '/network-servers', params }) }
    return this.request(network, opts)
  }

  loadNetworkServer (network, id) {
    const opts = { url: `/network-servers/${id}` }
    return this.request(network, opts, lift(['networkServer']))
  }

  listApplications (network, params) {
    let opts = { url: this.constructUrl({ url: '/applications', params }) }
    return this.request(network, opts)
  }

  createApplication (network, body) {
    const opts = { method: 'POST', url: '/applications', body }
    return this.request(network, opts)
  }

  loadApplication (network, id) {
    const opts = { url: `/applications/${id}` }
    return this.request(network, opts, lift(['application']))
  }

  updateApplication (network, id, body) {
    const opts = { method: 'PUT', url: `/applications/${id}`, body }
    return this.request(network, opts)
  }

  deleteApplication (network, id) {
    const opts = { method: 'DELETE', url: `/applications/${id}` }
    return this.request(network, opts)
  }

  loadDeviceProfile (network, id) {
    const opts = { url: `/device-profiles/${id}` }
    return this.request(network, opts, lift(['deviceProfile']))
  }

  listDeviceProfiles (network, params) {
    const opts = { url: this.constructUrl({ url: '/device-profiles', params }) }
    return this.request(network, opts)
  }

  createDeviceProfile (network, body) {
    const opts = { method: 'POST', url: '/device-profiles', body }
    return this.request(network, opts)
  }

  updateDeviceProfile (network, id, body) {
    const opts = { method: 'PUT', url: `/device-profiles/${id}`, body }
    return this.request(network, opts)
  }

  deleteDeviceProfile (network, id) {
    const opts = { method: 'DELETE', url: `/device-profiles/${id}` }
    return this.request(network, opts)
  }

  loadDevice (network, id) {
    const opts = { url: `/devices/${id}` }
    return this.request(network, opts, lift(['device']))
  }

  listDevices () {
    // overwritten by all extending classes
  }

  createDevice (network, body) {
    const opts = { method: 'POST', url: '/devices', body }
    return this.request(network, opts)
  }

  updateDevice (network, id, body) {
    const opts = { method: 'PUT', url: `/devices/${id}`, body }
    return this.request(network, opts)
  }

  deleteDevice (network, id) {
    const opts = { method: 'DELETE', url: `/devices/${id}` }
    return this.request(network, opts)
  }

  loadDeviceKeys (network, id) {
    const opts = { url: `/devices/${id}/keys` }
    return this.request(network, opts, lift(['deviceKeys']))
  }

  createDeviceKeys (network, id, body) {
    const opts = { method: 'POST', url: `/devices/${id}/keys`, body }
    return this.request(network, opts)
  }

  updateDeviceKeys (network, id, body) {
    const opts = { method: 'PUT', url: `/devices/${id}/keys`, body }
    return this.request(network, opts)
  }

  deleteDeviceKeys (network, id) {
    const opts = { method: 'DELETE', url: `/devices/${id}/keys` }
    return this.request(network, opts)
  }

  loadDeviceActivation (network, id) {
    const opts = { url: `/devices/${id}/activation` }
    return this.request(network, opts, lift(['deviceActivation']))
  }

  activateDevice (network, id, body) {
    const opts = { method: 'POST', url: `/devices/${id}/activate`, body }
    return this.request(network, opts)
  }

  deleteDeviceActivation (network, id) {
    const opts = { method: 'DELETE', url: `/devices/${id}/activation` }
    return this.request(network, opts)
  }

  loadServiceProfile (network, id) {
    const opts = { url: `/service-profiles/${id}` }
    return this.request(network, opts, lift(['serviceProfile']))
  }

  listServiceProfiles (network, params) {
    let opts = { url: this.constructUrl({ url: '/service-profiles', params }) }
    return this.request(network, opts)
  }

  loadApplicationIntegration (network, appId, id) {
    const opts = { url: `/applications/${appId}/integrations/${id}` }
    return this.request(network, opts, lift(['integration']))
  }

  createApplicationIntegration (network, appId, id, body) {
    const opts = { method: 'POST', url: `/applications/${appId}/integrations/${id}`, body }
    return this.request(network, opts)
  }

  updateApplicationIntegration (network, appId, id, body) {
    const opts = { method: 'PUT', url: `/applications/${appId}/integrations/${id}`, body }
    return this.request(network, opts)
  }

  deleteApplicationIntegration (network, appId, id) {
    const opts = { method: 'DELETE', url: `/applications/${appId}/integrations/${id}` }
    return this.request(network, opts)
  }

  createDeviceMessage (network, id, body) {
    const lens = R.lensPath(['deviceQueueItem', 'jsonObject'])
    if (typeof R.view(lens, body) === 'object') {
      body = R.set(lens, JSON.stringify(R.view(lens, body)), body)
    }
    const opts = { method: 'POST', url: `/devices/${id}/queue`, body }
    return this.request(network, opts)
  }

  listDeviceMessages (network, id) {
    return this.request(network, { url: `/devices/${id}/queue` })
  }
}
