const RestClient = require('../../RestClient')
const R = require('ramda')
const jwt = require('jsonwebtoken')
const { account, application } = require('ttn')
const appLogger = require('../../../lib/appLogger')
const { joinUrl } = require('../../../lib/utils')

module.exports = class TtnRestClient extends RestClient {
  constructor ({ cache } = {}) {
    super({ cache })
    if (!this.cache.get('appKeys')) this.cache.set('appKeys', {})
    this.ttnClients = { apps: {} }
  }

  _request (network, opts, session, transformResponse) {
    opts.url = this.constructUrl({ network, url: opts.url })
    return super.request({
      opts: this.addRequestDefaults(opts, session),
      transformResponse
    })
  }

  async httpRequest (network, opts, transformResponse) {
    const session = await this.getSession(network)
    return this._request(network, opts, session, transformResponse)
  }

  async appHttpRequest (network, appId, opts, transformResponse) {
    const appSession = await this.getAppSession(network, appId)
    return this._request(network, opts, appSession, transformResponse)
  }

  async regionHttpRequest (network, appId, opts, transformResponse) {
    const region = await this.appRegion(network, appId)
    opts.url = joinUrl(`http://${region}.thethings.network:8084`, opts.url)
    return this.appHttpRequest(network, appId, opts, transformResponse)
  }

  authorizationRequest (network, opts) {
    const { clientId, clientSecret } = network.securityData
    opts = R.mergeDeepLeft(opts, {
      method: 'POST',
      url: `users/token`,
      headers: {
        authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      }
    })
    return this._request(network, opts, null, R.prop('access_token'))
  }

  addRequestDefaults (opts, session) {
    if (session) {
      opts.headers = R.merge(opts.headers, { Authorization: `Bearer ${session.accessToken}` })
    }
    return opts
  }

  authorizeWithPassword (network, scope = ['apps', 'gateways', 'components']) {
    return this.authorizationRequest(network, {
      body: {
        ...R.pick(['username', 'password'], network.securityData),
        grant_type: 'password',
        scope
      }
    })
  }

  authorizeWithCode (network) {
    return this.authorizationRequest(network, {
      body: {
        ...R.pick(['code', 'redirect_uri'], network.securityData),
        grant_type: 'authorization_code'
      }
    })
  }

  login (network) {
    const sd = network.securityData
    return sd.username && sd.password
      ? this.authorizeWithPassword(network)
      : sd.code && sd.redirect_uri
        ? this.authorizeWithCode(network)
        : Promise.reject(new Error('Missing credentials to authorize with The Things Network.'))
  }

  async getSession (network) {
    const sessionKey = `session:${network.id}`
    let session = this.cache.get(sessionKey)
    if (!session || (session.data.exp * 1000) < Date.now()) {
      const accessToken = await this.login(network)
      session = R.mergeDeepRight(this.cache.get(sessionKey), {
        accessToken,
        data: jwt.decode(accessToken),
        appSessions: {}
      })
      this.cache.set(sessionKey, session)
    }
    return session
  }

  fetchAppScopeToken (network, appId) {
    const opts = {
      method: 'POST',
      url: `users/restrict-token`,
      body: { scope: [`apps:${appId}`] }
    }
    return this.httpRequest(network, opts, R.prop('access_token'))
  }

  async getAppSession (network, id) {
    let session = await this.getSession(network)
    const sessionKey = `session:${network.id}`
    let appSession = session.appSessions[id]
    if (!appSession || (appSession.data.exp * 1000) < Date.now()) {
      const accessToken = await this.fetchAppScopeToken(network, id)
      appSession = { accessToken, data: jwt.decode(accessToken) }
      this.cache.set(sessionKey, R.mergeDeepRight(
        this.cache.get(sessionKey),
        { appSessions: { [id]: appSession } }
      ))
    }
    return appSession
  }

  async getAccountClient (network) {
    const session = await this.getSession(network)
    this.ttnClients.account = account(session.accessToken)
    return this.ttnClients
  }

  async getAppClient (network, appId) {
    const session = await this.getAppSession(network, appId)
    const { client, accessToken } = this.ttnClients.apps[appId] || {}
    if (!client || accessToken !== session.accessToken) {
      this.ttnClients.apps[appId] = {
        accessToken: session.accessToken,
        client: application(appId, session.accessToken)
      }
    }
    return this.ttnClients.apps[appId].client
  }

  async appRegion (network, appId) {
    const client = await this.getAppClient(network, appId)
    return client.netAddress.split('.')[0]
  }

  async accountClientRequest (network, method, ...args) {
    const logReq = () => appLogger.log(`TTN REQUEST: ${method}: ${JSON.stringify(args)}`)
    try {
      const { account } = await this.getAccountClient(network)
      const res = await (args.length ? account[method](...args) : account[method]())
      logReq()
      appLogger.log(`TTN RESPONSE: ${JSON.stringify(res)}`)
      return res
    }
    catch (err) {
      logReq()
      appLogger.log(`TTN ERROR: ${err}`, 'error')
      throw err
    }
  }

  async appClientRequest (network, clientOpts, method, ...args) {
    const logReq = () => appLogger.log(`TTN APP REQUEST: APP_ID: ${clientOpts.appId}: ${clientOpts.client || 'application'}.${method}: ${JSON.stringify(args)}`)
    try {
      let client = await this.getAppClient(network, clientOpts.appId)
      appLogger.log(`PRE_REQUEST: ${clientOpts.appId}: ${client.appID}: ${client.netAddress}`)
      if (clientOpts.client === 'account') client = client.accountClient
      const res = await (args.length ? client[method](...args) : client[method]())
      logReq()
      appLogger.log(`TTN RESPONSE: ${JSON.stringify(res)}`)
      return res
    }
    catch (err) {
      logReq()
      appLogger.log(`TTN ERROR: ${err}`, 'error')
      throw err
    }
  }

  async createApplication (network, body) {
    // return this.httpRequest(network, { method: 'POST', url: 'applications', body })
    return this.accountClientRequest(network, 'createApplication', body)
  }

  registerApplication (network, appId, region = 'us-west') {
    return this.appHttpRequest(network, appId, {
      method: 'POST',
      url: `http://${region}.thethings.network:8084/applications`,
      body: { app_id: appId }
    })
  }

  async unregisterApplication (network, appId) {
    return this.regionHttpRequest(network, appId, { method: 'DELETE', url: `applications/${appId}` })
    // return this.appClientRequest(network, { appId }, 'unregister')
  }

  listApplications (network) {
    // return this.httpRequest(network, { url: 'applications' })
    return this.accountClientRequest(network, 'getAllApplications')
  }

  async loadAccountApplication (network, appId) {
    // return this.httpRequest(network, { url: `applications/${appId}` })
    return this.appClientRequest(network, { appId, client: 'account' }, 'getApplication', appId)
  }

  updateAccountApplication (network, id, body) {
    return this.appHttpRequest(network, id, { method: 'PUT', url: `applications/${id}`, body })
  }

  deleteAccountApplication (network, id) {
    return this.appHttpRequest(network, id, { method: 'DELETE', url: `applications/${id}` })
    // return this.accountClientRequest(network, 'deleteApplication', id)
  }

  updateHandlerApplication (network, id, body) {
    return this.regionHttpRequest(network, id, {
      method: 'PUT',
      url: `/applications/${id}`,
      body
    })
  }

  loadHandlerApplication (network, appId) {
    return this.regionHttpRequest(network, appId, { url: `applications/${appId}` })
    // return this.appClientRequest(network, { appId }, 'get')
  }

  createApplicationIntegration (network, appId, body) {
    const url = `https://console.thethingsnetwork.org/api/applications/${appId}/integrations/http-ttn`
    return this.appHttpRequest(network, appId, { method: 'POST', url, body })
  }

  updateApplicationIntegration (network, appId, id, body) {
    const url = `https://console.thethingsnetwork.org/api/applications/${appId}/integrations/http-ttn/${id}`
    return this.appHttpRequest(network, appId, { method: 'PATCH', url, body })
  }

  loadApplicationIntegration (network, appId, id) {
    // https://integrations.thethingsnetwork.org/ttn-eu/api/v2/down/my-app-id/my-process-id?key=ttn-account-v2.secret
    const url = `https://console.thethingsnetwork.org/api/applications/${appId}/integrations/http-ttn/${id}`
    return this.appHttpRequest(network, appId, { url })
  }

  deleteApplicationIntegration (network, appId, id) {
    const opts = { method: 'DELETE', url: `applications/${appId}/integrations/${id}` }
    return this.appHttpRequest(network, appId, opts)
  }

  createDevice (network, appId, body) {
    return this.regionHttpRequest(network, appId, { method: 'POST', url: `applications/${appId}/devices`, body })
    // return this.appClientRequest(network, { appId }, 'registerDevice', body.dev_id, body)
  }

  listDevices (network, appId) {
    return this.regionHttpRequest(network, appId, { url: `applications/${appId}/devices` })
    // return this.appClientRequest(network, { appId }, 'devices')
  }

  loadDevice (network, appId, id) {
    return this.regionHttpRequest(network, appId, { url: `applications/${appId}/devices/${id}` })
    // return this.appClientRequest(network, { appId }, 'device', id)
  }

  updateDevice (network, appId, id, body) {
    return this.regionHttpRequest(network, appId, { method: 'PUT', url: `applications/${appId}/devices/${id}`, body })
    // return this.appClientRequest(network, { appId }, 'updateDevice', id, body)
  }

  updateDeviceKeys (network, id, body) {
    return this.httpRequest(network, { method: 'PUT', url: `devices/${id}/keys`, body })
  }

  deleteDevice (network, appId, id) {
    return this.regionHttpRequest(network, appId, { method: 'DELETE', url: `applications/${appId}/devices/${id}` })
    // return this.appClientRequest(network, { appId }, 'deleteDevice', id)
  }

  deleteDeviceKeys (network, id) {
    return this.httpRequest(network, { method: 'DELETE', url: `devices/${id}/keys` })
  }
}
