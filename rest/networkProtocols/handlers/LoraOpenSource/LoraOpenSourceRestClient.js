const RestClient = require('../../RestClient')
const R = require('ramda')
const { lift } = require('../../../lib/utils')

module.exports = class LoraOpenSourceRestClient extends RestClient {
  async request (network, opts, session, transformResponse) {
    opts.url = this.constructUrl({ network, url: opts.url })
    return super.request({
      opts: this.addRequestDefaults(opts, session),
      transformResponse
    })
  }

  addRequestDefaults (opts, session) {
    opts.agentOptions = {
      secureProtocol: 'TLSv1_2_method',
      rejectUnauthorized: false
    }
    if (session) {
      opts.headers = R.merge(opts.headers, { Authorization: `Bearer ${session.connection}` })
    }
    return opts
  }

  login (network, body) {
    const opts = { method: 'POST', url: '/internal/login', body }
    return this.request(network, opts, null, R.prop('jwt'))
  }

  loadOrganization (session, network, id) {
    const opts = { url: `/organizations/${id}` }
    return this.request(network, opts, session, lift(['organization']))
  }

  listOrganizations (session, network, params) {
    let opts = { url: this.constructUrl({ url: '/organizations', params }) }
    return this.request(network, opts, session)
  }

  createOrganization (session, network, body) {
    const opts = { method: 'POST', url: '/organizations', body }
    return this.request(network, opts, session)
  }

  updateOrganization (session, network, id, body) {
    const opts = { method: 'PUT', url: `/organizations/${id}`, body }
    return this.request(network, opts, session)
  }

  deleteOrganization (session, network, id) {
    const opts = { method: 'DELETE', url: `/organizations/${id}` }
    return this.request(network, opts, session)
  }

  createUser (session, network, body) {
    const opts = { method: 'POST', url: '/users', body }
    return this.request(network, opts, session)
  }

  deleteUser (session, network, id) {
    const opts = { method: 'DELETE', url: `/users/${id}` }
    return this.request(network, opts, session)
  }

  createServiceProfile (session, network, body) {
    const opts = { method: 'POST', url: '/service-profiles', body }
    return this.request(network, opts, session)
  }

  updateServiceProfile (session, network, id, body) {
    const opts = { method: 'POST', url: `/service-profiles/${id}`, body }
    return this.request(network, opts, session)
  }

  listNetworkServers (session, network, params) {
    let opts = { url: this.constructUrl({ url: '/network-servers', params }) }
    return this.request(network, opts, session)
  }

  loadNetworkServer (session, network, id) {
    const opts = { url: `/network-servers/${id}` }
    return this.request(network, opts, session, lift(['networkServer']))
  }

  listApplications (session, network, params) {
    let opts = { url: this.constructUrl({ url: '/applications', params }) }
    return this.request(network, opts, session)
  }

  createApplication (session, network, body) {
    const opts = { method: 'POST', url: '/applications', body }
    return this.request(network, opts, session)
  }

  loadApplication (session, network, id) {
    const opts = { url: `/applications/${id}` }
    return this.request(network, opts, session, lift(['application']))
  }

  updateApplication (session, network, id, body) {
    const opts = { method: 'PUT', url: `/applications/${id}`, body }
    return this.request(network, opts, session)
  }

  deleteApplication (session, network, id) {
    const opts = { method: 'DELETE', url: `/applications/${id}` }
    return this.request(network, opts, session)
  }

  loadDeviceProfile (session, network, id) {
    const opts = { url: `/device-profiles/${id}` }
    return this.request(network, opts, session, lift(['deviceProfile']))
  }

  listDeviceProfiles (session, network, params) {
    const opts = { url: this.constructUrl({ url: '/device-profiles', params }) }
    return this.request(network, opts, session)
  }

  createDeviceProfile (session, network, body) {
    const opts = { method: 'POST', url: '/device-profiles', body }
    return this.request(network, opts, session)
  }

  updateDeviceProfile (session, network, id, body) {
    const opts = { method: 'PUT', url: `/device-profiles/${id}`, body }
    return this.request(network, opts, session)
  }

  deleteDeviceProfile (session, network, id) {
    const opts = { method: 'DELETE', url: `/device-profiles/${id}` }
    return this.request(network, opts, session)
  }

  loadDevice (session, network, appId, id) {
    const opts = { url: `/devices/${id}` }
    return this.request(network, opts, session, lift(['device']))
  }

  listDevices () {
    // overwritten by all extending classes
  }

  createDevice (session, network, appId, body) {
    const opts = { method: 'POST', url: '/devices', body }
    return this.request(network, opts, session)
  }

  updateDevice (session, network, appId, id, body) {
    const opts = { method: 'PUT', url: `/devices/${id}`, body }
    return this.request(network, opts, session)
  }

  deleteDevice (session, network, id) {
    const opts = { method: 'DELETE', url: `/devices/${id}` }
    return this.request(network, opts, session)
  }

  loadDeviceKeys (session, network, id) {
    const opts = { url: `/devices/${id}/keys` }
    return this.request(network, opts, session, lift(['deviceKeys']))
  }

  createDeviceKeys (session, network, id, body) {
    const opts = { method: 'POST', url: `/devices/${id}/keys`, body }
    return this.request(network, opts, session)
  }

  updateDeviceKeys (session, network, id, body) {
    const opts = { method: 'PUT', url: `/devices/${id}/keys`, body }
    return this.request(network, opts, session)
  }

  deleteDeviceKeys (session, network, id) {
    const opts = { method: 'DELETE', url: `/devices/${id}/keys` }
    return this.request(network, opts, session)
  }

  loadDeviceActivation (session, network, id) {
    const opts = { url: `/devices/${id}/activation` }
    return this.request(network, opts, session, lift(['deviceActivation']))
  }

  activateDevice (session, network, id, body) {
    const opts = { method: 'POST', url: `/devices/${id}/activate`, body }
    return this.request(network, opts, session)
  }

  deleteDeviceActivation (session, network, id) {
    const opts = { method: 'DELETE', url: `/devices/${id}/activation` }
    return this.request(network, opts, session)
  }

  loadServiceProfile (session, network, id) {
    const opts = { url: `/service-profiles/${id}` }
    return this.request(network, opts, session, lift(['serviceProfile']))
  }

  listServiceProfiles (session, network, params) {
    let opts = { url: this.constructUrl({ url: '/service-profiles', params }) }
    return this.request(network, opts, session)
  }

  loadApplicationIntegration (session, network, appId, id) {
    const opts = { url: `/applications/${appId}/integrations/${id}` }
    return this.request(network, opts, session, lift(['integration']))
  }

  createApplicationIntegration (session, network, appId, id, body) {
    const opts = { method: 'POST', url: `/applications/${appId}/integrations/${id}`, body }
    return this.request(network, opts, session)
  }

  updateApplicationIntegration (session, network, appId, id, body) {
    const opts = { method: 'PUT', url: `/applications/${appId}/integrations/${id}`, body }
    return this.request(network, opts, session)
  }

  deleteApplicationIntegration (session, network, appId, id) {
    const opts = { method: 'DELETE', url: `/applications/${appId}/integrations/${id}` }
    return this.request(network, opts, session)
  }
}
