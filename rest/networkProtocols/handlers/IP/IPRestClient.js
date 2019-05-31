const requestClient = require('request-promise')
const R = require('ramda')
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

  createDeviceMessage ({ remoteAddress, remotePort }, body) {
    remoteAddress = removeIpv4ToIpv6Mapping(remoteAddress)
    const opts = { url: `https://${remoteAddress}:${remotePort}` }
    if (body.data) {
      opts.json = false
      opts.body = body.data
    }
    else {
      opts.body = body.jsonData
    }
    appLogger.log(`CREATE_DEVICE_MESSAGE: ${JSON.stringify(opts)}`)
    return this.request({ opts })
  }
}

function removeIpv4ToIpv6Mapping (address) {
  const isMapped = /^::?(ffff)?:(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/
  return isMapped.test(address) ? address.replace(/^.*:/, '') : address
}
