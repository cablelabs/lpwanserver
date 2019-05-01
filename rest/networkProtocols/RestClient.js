const requestClient = require('request-promise')
const R = require('ramda')
const { URLSearchParams } = require('url')
const appLogger = require('../lib/appLogger.js')

module.exports = class RestClient {
  constructor ({ cache } = {}) {
    this.cache = cache || new Map()
  }

  async request ({ opts, transformResponse = R.identity }) {
    if (opts.json == null) opts.json = true
    let body
    try {
      body = await requestClient(opts)
      appLogger.log(`NETWORK REQUEST: ${JSON.stringify(opts)}`, 'info')
      appLogger.log(`NETWORK RESPONSE: ${JSON.stringify(body || {})}`, 'info')
    }
    catch (err) {
      appLogger.log(`NETWORK REQUEST: ${JSON.stringify(opts)}`, 'error')
      appLogger.log(`NETWORK ERROR: ${err}`, 'error')
      throw err
    }
    return transformResponse(body)
  }

  constructUrl ({ network, url, params }) {
    if (params && !R.isEmpty(params)) {
      const qs = new URLSearchParams(params).toString()
      url = `${url}?${qs}`
    }
    if (network && url.indexOf('http') !== 0) {
      url = `${network.baseUrl}/${url}`
    }
    // remove possible double slash
    return url.replace(/([^:]\/)\/+/g, '$1')
  }
}
