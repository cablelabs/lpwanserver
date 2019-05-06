const RestClient = require('../../RestClient')
const R = require('ramda')

module.exports = class LoriotRestClient extends RestClient {
  async request (network, opts, transformResponse) {
    opts.url = this.constructUrl({ network, url: opts.url })
    return super.request({
      opts: this.addRequestDefaults(opts, network.securityData.apiKey),
      transformResponse
    })
  }

  addRequestDefaults (opts, apiKey) {
    if (apiKey) {
      opts.headers = R.merge(opts.headers, { Authorization: `Bearer ${apiKey}` })
    }
    return opts
  }

  idHex (num) {
    return num.toString(16).toUpperCase()
  }

  listApplications (network, params) {
    // params = this.formatParams(params)
    let opts = { url: this.constructUrl({ url: '/apps', params }) }
    return this.request(network, opts)
  }

  createApplication (network, body) {
    const opts = { method: 'POST', url: '/apps', body }
    return this.request(network, opts)
  }

  loadApplication (network, id) {
    const opts = { url: `/app/${this.idHex(id)}` }
    return this.request(network, opts)
  }

  // Causes 500 error on Loriot
  // method is POST according to open-api spec
  updateApplication (network, id, body) {
    body = R.omit(['id'], body)
    const opts = { method: 'POST', url: `/app/${this.idHex(id)}`, body }
    return this.request(network, opts)
  }

  deleteApplication (network, id) {
    const opts = { method: 'DELETE', url: `/app/${this.idHex(id)}` }
    return this.request(network, opts)
  }

  listApplicationIntegrations (network, appId) {
    const opts = { url: `/app/${this.idHex(appId)}/outputs` }
    return this.request(network, opts)
  }

  createApplicationIntegration (network, appId, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/outputs`, body }
    return this.request(network, opts)
  }

  updateApplicationIntegrations (network, appId, body) {
    const opts = { method: 'PUT', url: `/app/${this.idHex(appId)}/outputs`, body }
    return this.request(network, opts)
  }

  deleteApplicationIntegration (network, appId, id) {
    const opts = { method: 'DELETE', url: `/app/${this.idHex(appId)}/outputs/${id}` }
    return this.request(network, opts)
  }

  listDevices (network, appId, params) {
    let opts = { url: this.constructUrl({ url: `/app/${this.idHex(appId)}/devices`, params }) }
    return this.request(network, opts)
  }

  createDevice (network, appId, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/devices`, body }
    return this.request(network, opts)
  }

  createOtaaDevice (network, appId, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/devices/otaa`, body }
    return this.request(network, opts)
  }

  createAbpDevice (network, appId, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/devices/abp`, body }
    return this.request(network, opts)
  }

  loadDevice (network, appId, id) {
    const opts = { url: `/app/${this.idHex(appId)}/device/${id}` }
    return this.request(network, opts)
  }

  updateDevice (network, appId, id, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/device/${id}`, body }
    return this.request(network, opts)
  }

  deleteDevice (network, appId, id) {
    const opts = { method: 'DELETE', url: `/app/${this.idHex(appId)}/device/${id}` }
    return this.request(network, opts)
  }
}
