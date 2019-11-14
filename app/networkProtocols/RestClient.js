const requestClient = require('request-promise')
const R = require('ramda')
const { URLSearchParams } = require('url')
const { joinUrl } = require('../lib/utils')
const EventEmitter = require('events')
const { log } = require('../lib/log')

module.exports = class RestClient extends EventEmitter {
  constructor ({ cache } = {}) {
    super()
    this.cache = cache || new Map()
    this.logger = log
  }

  async request ({ opts, transformResponse = R.identity }) {
    if (opts.json == null) opts.json = true
    let body
    try {
      body = await requestClient(opts)
      if (this.logger) {
        this.logger.info(`NETWORK REQUEST`, { opts })
        this.logger.info(`NETWORK RESPONSE`, { body })
      }
    }
    catch (err) {
      if (this.logger) {
        this.logger.error(`NETWORK ERROR`, { opts, error: err })
      }
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
