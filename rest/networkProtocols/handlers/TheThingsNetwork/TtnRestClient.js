const RestClient = require('../../RestClient')
const R = require('ramda')

module.exports = class TtnRestClient extends RestClient {
  async request (network, opts, session, transformResponse) {
    opts.url = this.constructUrl({ network, url: opts.url })
    return super.request({
      opts: this.addRequestDefaults(opts, session),
      transformResponse
    })
  }

  addRequestDefaults (opts, session) {
    if (session) {
      opts.headers = R.merge(opts.headers, { Authorization: `Bearer ${session.connection}` })
    }
    return opts
  }

  authorizationRequest (network, opts) {
    let auth = Buffer
      .from(`${network.securityData.clientId}:${network.securityData.clientSecret}`)
      .toString('base64')
    opts = Object.assign({
      method: 'POST',
      url: `users/token`,
      headers: {
        authorization: `Basic ${auth}`
      }
    }, opts)
    return this.request(network, opts)
  }

  authorizeWithPassword (network, scope = []) {
    if (!scope.length) {
      scope = ['apps', 'gateways', 'components', 'apps:cable-labs-prototype']
    }
    return this.authorizationRequest(network, {
      body: {
        grant_type: 'password',
        username: network.securityData.username,
        password: network.securityData.password,
        scope
      }
    })
  }

  async appRequest (session, network, appId, opts, secondAttempt = false) {
    if (!session.appTokens) session.appTokens = {}
    if (!session.appTokens[appId]) {
      const body = await this.request(network, {
        method: 'POST',
        url: `users/restrict-token`,
        body: {
          scope: [`apps:${appId}`]
        }
      }, session)
      session.appTokens[appId] = body.access_token
    }
    try {
      return this.request(network, opts, { connection: session.appTokens[appId] })
    }
    catch (err) {
      if (secondAttempt || (err.statusCode !== 401 && err.statusCode !== 403)) throw err
      delete session.appTokens[appId]
      return this.appRequest(session, network, appId, opts, true)
    }
  }

  createApplication (session, network, body) {
    const opts = { method: 'POST', url: '/applications', body }
    return this.request(network, opts, session)
  }

  registerApplicationWithHandler (session, network, appId) {
    return this.appRequest(session, network, appId, {
      method: 'POST',
      url: `http://us-west.thethings.network:8084/applications`,
      body: { app_id: appId }
    })
  }

  createDevice (session, network, appId, body) {
    return this.appRequest(session, network, appId, {
      method: 'POST',
      url: `http://us-west.thethings.network:8084/applications/${appId}/devices`,
      body
    })
  }
}
