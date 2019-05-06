const RestClient = require('../../RestClient')
const R = require('ramda')
const jwt = require('jsonwebtoken')

module.exports = class TtnRestClient extends RestClient {
  _request (network, opts, session, transformResponse) {
    opts.url = this.constructUrl({ network, url: opts.url })
    return super.request({
      opts: this.addRequestDefaults(opts, session),
      transformResponse
    })
  }

  async request (network, opts, transformResponse) {
    const session = await this.getSession(network)
    return this._request(network, opts, session, transformResponse)
  }

  async appRequest (network, appId, opts, transformResponse) {
    const appSession = await this.getAppSession(network, appId)
    return this._request(network, opts, appSession, transformResponse)
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
      opts.headers = R.merge(opts.headers, { Authorization: `Bearer ${session.connection}` })
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
      session = { accessToken, data: jwt.decode(accessToken), appSessions: {} }
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
    return this.request(network, opts, R.prop('access_token'))
  }

  async getAppSession (network, appId) {
    let session = await this.getSession()
    let appSession = session.appSessions[appId]
    if (!appSession || (appSession.data.exp * 1000) < Date.now()) {
      const accessToken = await this.fetchAppScopeToken(network, appId)
      appSession = { accessToken, data: jwt.decode(accessToken) }
      this.cache.set('session', R.mergeDeepRight(session, { appSessions: { [appId]: appSession } }))
    }
    return appSession
  }

  createApplication (network, body) {
    const opts = { method: 'POST', url: '/applications', body }
    return this.request(network, opts)
  }

  registerApplicationWithHandler (network, id) {
    return this.appRequest(network, id, {
      method: 'POST',
      url: `http://us-west.thethings.network:8084/applications`,
      body: { app_id: id }
    })
  }

  listApplications (network) {
    return this.request(network, { url: 'api/v2/applications' })
  }

  loadApplication (network, id) {
    return this.appRequest(network, id, { url: `applications/${id}` })
  }

  updateApplication (network, id, body) {
    return this.appRequest(network, id, { method: 'PUT', url: `applications/${id}`, body })
  }

  deleteApplication (network, id) {
    return this.appRequest(network, id, { method: 'DELETE', url: `applications/${id}` })
  }

  updateHandlerApplication (network, id, body) {
    return this.appRequest(network, id, {
      method: 'PUT',
      url: `http://us-west.thethings.network:8084/applications/${id}`,
      body
    })
  }

  async loadHandlerApplication (network, id) {
    const app = await this.appRequest(network, { url: `https://console.thethingsnetwork.org/api/applications/${id}` })
    return this.appRequest(network, id, { url: `http://${appRegion(app)}.thethings.network:8084/applications/${id}` })
  }

  createApplicationIntegration (network, appId, id, body) {
    const opts = { method: 'POST', url: `applications/${appId}/integrations/${id}`, body }
    return this.appRequest(network, appId, opts)
  }

  deleteApplicationIntegration (network, appId, id) {
    const opts = { method: 'DELETE', url: `applications/${appId}/integrations/${id}` }
    return this.appRequest(network, appId, opts)
  }

  createDevice (network, appId, body) {
    return this.appRequest(network, appId, {
      method: 'POST',
      url: `http://us-west.thethings.network:8084/applications/${appId}/devices`,
      body
    })
  }

  listDevices (network, app) {
    return this.appRequest(network, app.id, {
      url: `http://${appRegion(app)}.thethings.network:8084/applications/${app.id}/devices`
    })
  }

  loadDevice (network, id) {
    return this.request(network, { url: `devices/${id}` })
  }

  updateDevice (network, id, body) {
    return this.request(network, { method: 'PUT', url: `devices/${id}`, body })
  }

  updateDeviceKeys (network, id, body) {
    return this.request(network, { method: 'PUT', url: `devices/${id}/keys`, body })
  }

  deleteDevice (network, id) {
    return this.request(network, { method: 'DELETE', url: `devices/${id}` })
  }

  deleteDeviceKeys (network, id) {
    return this.request(network, { method: 'DELETE', url: `devices/${id}/keys` })
  }
}

const appRegion = R.compose(
  R.replace('ttn-handler-', ''),
  x => x.handler || x.serviceProfileID
  // R.tap(x => console.log('**appRegion**', require('util').inspect(x)))
)
