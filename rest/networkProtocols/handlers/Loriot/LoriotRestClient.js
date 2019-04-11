const RestClient = require('../../RestClient')
const R = require('ramda')
// const { renameKeys } = require('../../../lib/utils')

module.exports = class LoraOpenSourceRestClient extends RestClient {
  // constructor () {
  //   super()
  //   this.transformId = renameKeys({ _id: 'id' })
  //   const transformIdsInQuery = R.evolve({ result: R.map(this.transformId) })
  //   this.transformAppQueryResponse = R.compose(
  //     transformIdsInQuery,
  //     renameKeys({ total: 'totalCount', apps: 'result' })
  //   )
  //   this.transformAppQueryResponse = R.compose(
  //     transformIdsInQuery,
  //     renameKeys({ total: 'totalCount', devices: 'result' })
  //   )
  // }

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

  idHex (num) {
    return num.toString(16).toUpperCase()
  }

  // formatQueryParams (params) {
  //   const result = R.pick(['filter', 'sort'], params)
  //   if (params.limit) result.perPage = params.limit
  //   if (params.offset) result.page = Math.ceil(params.offset / params.limit)
  //   return result
  // }

  listApplications (session, network, params) {
    // params = this.formatParams(params)
    let opts = { url: this.constructUrl({ url: '/apps', params }) }
    return this.request(network, opts, session)
  }

  createApplication (session, network, body) {
    const opts = { method: 'POST', url: '/apps', body }
    return this.request(network, opts, session)
  }

  loadApplication (session, network, id) {
    const opts = { url: `/app/${this.idHex(id)}` }
    return this.request(network, opts, session)
  }

  updateApplication (session, network, id, body) {
    body = R.omit(['id'], body)
    const opts = { method: 'POST', url: `/app/${this.idHex(id)}`, body }
    return this.request(network, opts, session)
  }

  deleteApplication (session, network, id) {
    const opts = { method: 'DELETE', url: `/app/${this.idHex(id)}` }
    return this.request(network, opts, session)
  }

  listApplicationIntegrations (session, network, appId) {
    const opts = { url: `/app/${this.idHex(appId)}/outputs` }
    return this.request(network, opts, session)
  }

  createApplicationIntegration (session, network, appId, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/outputs`, body }
    return this.request(network, opts, session)
  }

  updateApplicationIntegrations (session, network, appId, body) {
    const opts = { method: 'PUT', url: `/app/${this.idHex(appId)}/outputs`, body }
    return this.request(network, opts, session)
  }

  deleteApplicationIntegration (session, network, appId, id) {
    const opts = { method: 'DELETE', url: `/app/${this.idHex(appId)}/outputs/${id}` }
    return this.request(network, opts, session)
  }

  listDevices (session, network, appId, params) {
    let opts = { url: this.constructUrl({ url: `/app/${this.idHex(appId)}/devices`, params }) }
    return this.request(network, opts, session)
  }

  createDevice (session, network, appId, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/devices`, body }
    return this.request(network, opts, session)
  }

  loadDevice (session, network, appId, id) {
    const opts = { url: `/app/${this.idHex(appId)}/device/${id}` }
    return this.request(network, opts, session)
  }

  updateDevice (session, network, appId, id, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/device/${id}`, body }
    return this.request(network, opts, session)
  }

  deleteDevice (session, network, appId, id) {
    const opts = { method: 'DELETE', url: `/app/${this.idHex(appId)}/device/${id}` }
    return this.request(network, opts, session)
  }

  updateDeviceKeys (session, network, appId, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/devices/otaa`, body }
    return this.request(network, opts, session)
  }

  activateDevice (session, network, appId, body) {
    const opts = { method: 'POST', url: `/app/${this.idHex(appId)}/devices/abp`, body }
    return this.request(network, opts, session)
  }
}