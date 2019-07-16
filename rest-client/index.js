const { AxiosRestApi, AxiosRestApiCache } = require('../lib/axios-rest-client')

class LpwanServerRestApi extends AxiosRestApi {
  constructor (opts) {
    super(opts)
    this.urls.deviceDownlinks = '/devices/:id/downlinks'
  }

  async login (opts) {
    opts = { ...opts, url: '/sessions', method: 'POST' }
    const result = await this.axios(opts)
    this.authHeaders = { authorization: `Bearer ${result.data}` }
    return result.data
  }

  importDevices (urlParams, opts) {
    const url = `/applications/:id/import-devices`
    return this.axios(this._axiosOpts('applications', url, urlParams, { ...opts, method: 'POST' }))
  }
}

class LpwanServerRestApiCache extends AxiosRestApiCache {
  list (name, result) {
    const list = name === 'ip-device-downlinks' ? result.data : result.data.records
    return this._cacheUpsert(name, list)
  }
}

module.exports = {
  LpwanServerRestApi,
  LpwanServerRestApiCache
}
