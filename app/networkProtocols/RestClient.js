const requestClient = require('request-promise')
const R = require('ramda')
const { URLSearchParams } = require('url')
var { log } = require('../lib/log')
const { joinUrl } = require('../lib/utils')
const EventEmitter = require('events')

module.exports = class RestClient extends EventEmitter {
  constructor ({ cache } = {}) {
    super()
    this.cache = cache || new Map()
  }

  async request ({ opts, transformResponse = R.identity }) {
    if (opts.json == null) opts.json = true
    let body
    try {
      body = await requestClient(opts)
      log.debug(`NETWORK REQUEST`, { opts })
      log.debug(`NETWORK RESPONSE`, { body })
    }
    catch (err) {
      log.verbose(`NETWORK ERROR`, { opts, error: err })
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
      url = joinUrl(network.baseUrl, url)
    }
    // remove possible double slash
    return url.replace(/([^:]\/)\/+/g, '$1')
  }
}
