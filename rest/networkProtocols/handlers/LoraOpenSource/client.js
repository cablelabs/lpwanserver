const requestClient = require('request-promise')
const R = require('ramda')
const { URLSearchParams } = require('url')
const appLogger = require('../../lib/appLogger.js')
const { lift } = require('../../../lib/utils')

module.exports = class LoraOpenSourceClient {
  request (network, opts, session) {
    opts.url = constructUrl({ network, path: opts.url })
    return requestClient(this.addRequestDefaults(opts, session))
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

  async login (network, body) {
    const opts = { method: 'POST', url: '/internal/login', body }
    const { jwt } = await appLogger.logOnThrow(
      () => this.request(network, opts),
      err => `Error on login: ${err}`
    )
    return jwt
  }

  async loadOrganization (network, session, id) {
    const opts = { url: `/organizations/${id}` }
    const body = await appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on load organization ${id}: ${err}`
    )
    return lift(['organization'], body)
  }

  listOrganizations (network, session, params) {
    let opts = { url: constructUrl({ url: '/organizations', params }) }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error querying organizations: ${err}`
    )
  }

  createOrganization (network, session, body) {
    const opts = { method: 'POST', url: '/organizations', body }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on create organization ${body.name}: ${err}`
    )
  }

  replaceOrganization (network, session, body) {
    const opts = { method: 'PUT', url: `/organizations/${body.id}`, body }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on replace organization ${body.id}: ${err}`
    )
  }

  deleteOrganization (network, session, id) {
    const opts = { method: 'DELETE', url: `/organizations/${id}` }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on delete organization ${id}: ${err}`
    )
  }

  createUser (network, session, body) {
    const opts = { method: 'POST', url: '/users', body }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on create user ${body.username}: ${err}`
    )
  }

  deleteUser (network, session, id) {
    const opts = { method: 'DELETE', url: `/users/${id}` }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on delete user ${id}: ${err}`
    )
  }

  createServiceProfile (network, session, body) {
    const opts = { method: 'POST', url: '/service-profiles', body }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error creating service profile ${body.name}: ${err}`
    )
  }

  listNetworkServers (network, session, params) {
    let opts = { url: constructUrl({ url: '/network-servers', params }) }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error querying network servers: ${err}`
    )
  }

  async loadNetworkServer (network, session, id) {
    const opts = { url: `/network-servers/${id}` }
    const body = await appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on load network server: ${err}`
    )
    return lift(['networkServer'], body)
  }

  listApplications (network, session, params) {
    let opts = { url: constructUrl({ url: '/applications', params }) }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error querying applications: ${err}`
    )
  }

  createApplication (network, session, body) {
    const opts = { method: 'POST', url: '/applications', body }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on create application ${body.name}: ${err}`
    )
  }

  async loadApplication (network, session, id) {
    const opts = { url: `/applications/${id}` }
    const body = await appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on get application ${id}: ${err}`
    )
    return lift(['application'], body)
  }

  replaceApplication (network, session, body) {
    const opts = { method: 'PUT', url: `/applications/${body.id}`, body }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on replace application ${body.id}: ${err}`
    )
  }

  deleteApplication (network, session, id) {
    const opts = { method: 'DELETE', url: `/applications/${id}` }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on delete application ${id}: ${err}`
    )
  }

  async loadDeviceProfile (network, session, id) {
    const opts = { url: `/device-profiles/${id}` }
    const body = await appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on get device profile ${id}: ${err}`
    )
    return lift(['deviceProfile'], body)
  }

  listDeviceProfiles (network, session, params) {
    let opts = { url: constructUrl({ url: '/device-profiles', params }) }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error querying device profiles: ${err}`
    )
  }

  async loadDevice (network, session, id) {
    const opts = { url: `/devices/${id}` }
    const body = await appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on get device ${id}: ${err}`
    )
    return lift(['device'], body)
  }

  listDevices (network, session, params) {
    let opts = { url: constructUrl({ url: '/devices', params }) }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error querying devices: ${err}`
    )
  }

  async loadDeviceKeys (network, session, devEUI, params) {
    const opts = { url: constructUrl({ url: `/devices/${devEUI}/keys`, params }) }
    const body = await appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on get keys for device ${devEUI}: ${err}`
    )
    return lift(['deviceKeys'], body)
  }

  async loadDeviceActivation (network, session, device) {
    const opts = { url: `/devices/${device.devEUI}/activation` }
    const body = await appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on get activation for device ${device.id}: ${err}`
    )
    return lift(['deviceActivation'], body)
  }

  async loadServiceProfile (network, session, id) {
    const opts = { url: `/service-profiles/${id}` }
    const body = await appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on get service profile ${id}: ${err}`
    )
    return lift(['serviceProfile'], body)
  }

  listServiceProfiles (network, session, params) {
    let opts = { url: constructUrl({ url: '/service-profiles', params }) }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error querying service profiles: ${err}`
    )
  }

  async loadApplicationIntegration (network, session, appId, id) {
    const opts = { url: `/applications/${appId}/integrations/${id}` }
    const body = await appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on get http integration for application ${appId}: ${err}`
    )
    return lift(['integration'], body)
  }

  createApplicationIntegration (network, session, appId, id, body) {
    const opts = { method: 'POST', url: `/applications/${appId}/integrations/${id}`, body }
    return appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on create http integration for application ${appId}: ${err}`
    )
  }

  replaceApplicationIntegration (network, session, appId, body) {
    const opts = { method: 'PUT', url: `/applications/${appId}/integrations/${body.id}`, body }
    return appLogger.logOnThrow(
      () => this.request(network, opts, session),
      err => `Error on replace ${body.id} integration for application ${appId}: ${err}`
    )
  }

  deleteApplicationIntegration (network, session, appId, id) {
    const opts = { method: 'DELETE', url: `/applications/${appId}/integrations/${id}` }
    return appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on delete http integration for application ${appId}: ${err}`
    )
  }
}

function constructUrl ({ network, url, params }) {
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
