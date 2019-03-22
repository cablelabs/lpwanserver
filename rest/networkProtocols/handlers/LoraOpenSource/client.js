const requestClient = require('request-promise')
const R = require('ramda')
const { URLSearchParams } = require('url')
const appLogger = require('../../lib/appLogger.js')
const { lift } = require('../../../lib/utils')

module.exports = class LoraOpenSourceClient {
  async request (network, opts, session, transform = R.identity) {
    opts.url = this.constructUrl({ network, path: opts.url })
    let body
    try {
      body = await requestClient(this.addRequestDefaults(opts, session))
    }
    catch (err) {
      appLogger.log(`HTTP request to network server failed:  ${err}`, 'error')
      appLogger.log(JSON.stringify(opts), 'error')
      throw err
    }
    return transform(body)
  }

  addRequestDefaults (opts, session) {
    if (opts.json == null) opts.json = true
    opts.agentOptions = {
      secureProtocol: 'TLSv1_2_method',
      rejectUnauthorized: false
    }
    if (session) {
      opts.headers = R.merge(opts.headers, { Authorization: `Bearer ${session.connection}` })
    }
    return opts
  }

  constructUrl ({ network, url, params }) {
    if (params && !R.isEmpty(params)) {
      const qs = new URLSearchParams(params).toString()
      url = `${url}?${qs}`
    }
    if (network) {
      url = `${network.baseUrl}/${url}`
    }
    // remove possible double slash
    return url.replace(/([^:]\/)\/+/g, '$1')
  }

  login (network, body) {
    const opts = { method: 'POST', url: '/internal/login', body }
    return this.request(network, opts, null, R.prop('jwt'))
  }

  loadOrganization (network, session, id) {
    const opts = { url: `/organizations/${id}` }
    return this.request(network, opts, session, lift(['organization']))
  }

  listOrganizations (network, session, params) {
    let opts = { url: this.constructUrl({ url: '/organizations', params }) }
    return this.request(network, opts, session)
  }

  createOrganization (network, session, body) {
    const opts = { method: 'POST', url: '/organizations', body }
    return this.request(network, opts, session)
  }

  replaceOrganization (network, session, body) {
    const opts = { method: 'PUT', url: `/organizations/${body.id}`, body }
    return this.request(network, opts, session)
  }

  deleteOrganization (network, session, id) {
    const opts = { method: 'DELETE', url: `/organizations/${id}` }
    return this.request(network, opts, session)
  }

  createUser (network, session, body) {
    const opts = { method: 'POST', url: '/users', body }
    return this.request(network, opts, session)
  }

  deleteUser (network, session, id) {
    const opts = { method: 'DELETE', url: `/users/${id}` }
    return this.request(network, opts, session)
  }

  createServiceProfile (network, session, body) {
    const opts = { method: 'POST', url: '/service-profiles', body }
    return this.request(network, opts, session)
  }

  listNetworkServers (network, session, params) {
    let opts = { url: this.constructUrl({ url: '/network-servers', params }) }
    return this.request(network, opts, session)
  }

  loadNetworkServer (network, session, id) {
    const opts = { url: `/network-servers/${id}` }
    return this.request(network, opts, session, lift(['networkServer']))
  }

  listApplications (network, session, params) {
    let opts = { url: this.constructUrl({ url: '/applications', params }) }
    return this.request(network, opts, session)
  }

  createApplication (network, session, body) {
    const opts = { method: 'POST', url: '/applications', body }
    return this.request(network, opts, session)
  }

  loadApplication (network, session, id) {
    const opts = { url: `/applications/${id}` }
    return this.request(network, opts, session, lift(['application']))
  }

  replaceApplication (network, session, body) {
    const opts = { method: 'PUT', url: `/applications/${body.id}`, body }
    return this.request(network, opts, session)
  }

  deleteApplication (network, session, id) {
    const opts = { method: 'DELETE', url: `/applications/${id}` }
    return this.request(network, opts, session)
  }

  loadDeviceProfile (network, session, id) {
    const opts = { url: `/device-profiles/${id}` }
    return this.request(network, opts, session, lift(['deviceProfile']))
  }

  listDeviceProfiles (network, session, params) {
    const opts = { url: this.constructUrl({ url: '/device-profiles', params }) }
    return this.request(network, opts, session)
  }

  createDeviceProfile (network, session, body) {
    const opts = { method: 'POST', url: '/device-profiles', body }
    return this.request(network, opts, session)
  }

  replaceDeviceProfile (network, session, body) {
    const opts = { method: 'PUT', url: `/device-profiles/${body.id}`, body }
    return this.request(network, opts, session)
  }

  deleteDeviceProfile (network, session, id) {
    const opts = { method: 'DELETE', url: `/device-profiles/${id}` }
    return this.request(network, opts, session)
  }

  loadDevice (network, session, id) {
    const opts = { url: `/devices/${id}` }
    return this.request(network, opts, session, lift(['device']))
  }

  listDevices (network, session, params) {
    // overwritten by all extending classes
  }

  createDevice (network, session, body) {
    const opts = { url: '/devices', body }
    return this.request(network, opts, session)
  }

  loadDeviceKeys (network, session, devEUI) {
    const opts = { url: `/devices/${devEUI}/keys` }
    return this.request(opts, network, session, lift(['deviceKeys']))
  }

  replaceDevice (network, session, devEUI, body) {
    const opts = { method: 'PUT', url: `/devices/${devEUI}`, body }
    return this.request(network, opts, session)
  }

  deleteDevice (network, session, devEUI) {
    const opts = { method: 'DELETE', url: `/devices/${devEUI}` }
    return this.request(network, opts, session)
  }

  createDeviceKeys (network, session, devEUI, body) {
    const opts = { method: 'POST', url: `/devices/${devEUI}/keys`, body }
    return this.request(network, opts, session)
  }

  replaceDeviceKeys (network, session, devEUI, body) {
    const opts = { method: 'PUT', url: `/devices/${devEUI}/keys`, body }
    return this.request(network, opts, session)
  }

  deleteDeviceKeys (network, session, devEUI) {
    const opts = { method: 'DELETE', url: `/devices/${devEUI}/keys` }
    return this.request(network, opts, session)
  }

  loadDeviceActivation (network, session, devEUI) {
    const opts = { url: `/devices/${devEUI}/activation` }
    return this.request(opts, network, session, lift(['deviceActivation']))
  }

  activateDevice (network, session, devEUI, body) {
    const opts = { method: 'POST', url: `/devices/${devEUI}/activate`, body }
    return this.request(network, opts, session)
  }

  deleteDeviceActivation (network, session, devEUI) {
    const opts = { method: 'DELETE', url: `/devices/${devEUI}/activation` }
    return this.request(network, opts, session)
  }

  loadServiceProfile (network, session, id) {
    const opts = { url: `/service-profiles/${id}` }
    return this.request(network, opts, session, lift(['serviceProfile']))
  }

  listServiceProfiles (network, session, params) {
    let opts = { url: this.constructUrl({ url: '/service-profiles', params }) }
    return this.request(network, opts, session)
  }

  loadApplicationIntegration (network, session, appId, id) {
    const opts = { url: `/applications/${appId}/integrations/${id}` }
    return this.request(opts, network, session, lift(['integration']))
  }

  createApplicationIntegration (network, session, appId, id, body) {
    const opts = { method: 'POST', url: `/applications/${appId}/integrations/${id}`, body }
    return this.request(opts, network, session)
  }

  replaceApplicationIntegration (network, session, appId, id, body) {
    const opts = { method: 'PUT', url: `/applications/${appId}/integrations/${id}`, body }
    return this.request(network, opts, session)
  }

  deleteApplicationIntegration (network, session, appId, id) {
    const opts = { method: 'DELETE', url: `/applications/${appId}/integrations/${id}` }
    return this.request(opts, network, session)
  }
}
