const requestClient = require('request-promise')
const R = require('ramda')
const { URLSearchParams } = require('url')
const appLogger = require('../../../lib/appLogger')
const EventEmitter = require('events')

module.exports = class IpDeviceRestClient extends EventEmitter {
  constructor ({ cache } = {}) {
    super()
    this.cache = cache || new Map()
  }

  async request ({ opts, transformResponse = R.identity }) {
    if (opts.json == null) opts.json = true
    let body
    try {
      body = await requestClient(opts)
      appLogger.log(`IP DEVICE REQUEST: ${JSON.stringify(opts)}`, 'info')
      appLogger.log(`IP DEVICE RESPONSE: ${JSON.stringify(body || {})}`, 'info')
    }
    catch (err) {
      appLogger.log(`IP DEVICE REQUEST: ${JSON.stringify(opts)}`, 'error')
      appLogger.log(`IP DEVICE ERROR: ${err}`, 'error')
      throw err
    }
    return transformResponse(body)
  }

  constructUrl ({ url, params }) {
    if (params && !R.isEmpty(params)) {
      const qs = new URLSearchParams(params).toString()
      url = `${url}?${qs}`
    }
    // remove possible double slash
    return url.replace(/([^:]\/)\/+/g, '$1')
  }

  createDeviceMessage ({ remoteAddress, remotePort }, body) {
    const opts = { url: this.constructUrl(`https://${remoteAddress}:${remotePort}`) }
    if (body.data) {
      opts.json = false
      opts.body = body.data
    }
    else {
      opts.body = body.jsonData
    }
    return this.request(opts)
  }
}
