// Logging
const { log } = require('../log')
const { attempt } = require('../lib/utils')

//* *****************************************************************************
// The NetworkProtocol Data Access object.
//
// Allows NetworkProtocols to access data for the current company, application,
// device, etc., so that we don't end up pre-loading data the protocol doesn't
// need.  Also, caches data so that repeated hits on the database can be
// avoided.  This object is expected to be short-lived, allowing the cache to
// expire between operations.
//* *****************************************************************************
// Class constructor.
//
// Sets up the structure for access to the database implementation and keeps
// track of the "global" function for the lifespan of this object for logging.
//
// models   - The this.modelAPI, giving access to the data access apis.
// fdesc    - The function description for logging, outlining why the data is
//            being accessed.
//
module.exports = class NetworkProtocolDataAccess {
  constructor (models, fdesc = 'Unspecified function') {
    this.modelAPI = models
    this.fdesc = fdesc
    this.cache = {}
    this.logs = {}
  }
  async cacheFirst (path, request, errMessage) {
    // Cache was causing errors.  Disabling.
    // Next cache implementation should be Redis or Memcache at the model level.
    return attempt(
      request,
      err => log.error(`${this.funcDesc}: ${errMessage}`, err)
    )
  }
  getApplicationById (id) {
    return this.cacheFirst(
      ['applications', `${id}`],
      () => this.modelAPI.applications.load(id),
      `Failed to load application ${id}`
    )
  }
  getDeviceById (id) {
    return this.cacheFirst(
      ['devices', `${id}`],
      () => this.modelAPI.devices.load(id),
      `Failed to load device ${id}`
    )
  }
  async getDeviceProfileById (id) {
    return this.cacheFirst(
      ['deviceProfiles', `${id}`],
      () => this.modelAPI.deviceProfiles.load(id),
      `Failed to load device profile ${id}`
    )
  }
  async getApplicationByDeviceId (devId) {
    let dev = await this.getDeviceById(devId)
    return this.getApplicationById(dev.application.id)
  }
  async getDeviceProfileByDeviceIdNetworkTypeId (devId, ntId) {
    let dnt = await this.getDeviceNetworkType(devId, ntId)
    return this.getDeviceProfileById(dnt.deviceProfile.id)
  }
  async getApplicationNetworkType (applicationId, networkTypeId) {
    const request = async () => {
      const [ apps ] = await this.modelAPI.applicationNetworkTypeLinks.list({ applicationId, networkTypeId })
      return apps[0]
    }
    return this.cacheFirst(
      ['applicationNetworkTypeLinks', `${applicationId}:${networkTypeId}`],
      request,
      `Failed to load ApplicationNetworkTypeLink for application ${applicationId} and networkType ${networkTypeId}`
    )
  }
  async getDeviceNetworkType (deviceId, networkTypeId) {
    const request = async () => {
      const [ devNtls ] = await this.modelAPI.deviceNetworkTypeLinks.list({ deviceId, networkTypeId, limit: 1 })
      return devNtls[0]
    }
    return this.cacheFirst(
      ['applicationNetworkTypeLinks', `${deviceId}:${networkTypeId}`],
      request,
      `Failed to load DeviceNetworkTypeLink for device ${deviceId} and networkType ${networkTypeId}`
    )
  }
  async getDevicesForDeviceProfile (deviceProfileId) {
    const request = async () => {
      let [devs] = await this.modelAPI.devices.list({ 'deviceProfileId': deviceProfileId })
      // Put devices in cache (cache is disabled)
      // devs.forEach(x => R.assocPath(['devices', `${x.id}`], x, this.cache))
      return devs.map(x => x.id)
    }
    const devIds = await this.cacheFirst(
      ['devicesInProfile', deviceProfileId],
      request,
      `Failed to load devices for DeviceProfile ${deviceProfileId}`
    )
    return Promise.all(devIds.map(id => this.getDeviceById(id)))
  }
  initLog (networkType, network) {
    const key = !network ? 0 : network.id
    this.logs[key] = {
      logs: [],
      networkTypeName: networkType.name,
      networkName: !network ? `All networks of type ${networkType.name}` : network.name
    }
  }
  addLog (network, message) {
    // Message objects are not a good thing.  Try a couple of common ones, then
    // resort to stringify
    if (typeof message === 'object') {
      message = formatObjectMessage(message)
    }
    const key = network ? network.id : 0
    this.logs[key].logs.push(message)
  }
  getLogs () {
    // Filter out networks that have no logs
    return Object.keys(this.logs).reduce((acc, id) => {
      if (this.logs[id].logs.length) acc[id] = this.logs[id]
      return acc
    }, {})
  }
  deleteProtocolDataForKey (networkId, networkProtocolId, keyStartsWith) {
    return this.modelAPI.protocolData.clearProtocolData(networkId, networkProtocolId, keyStartsWith)
  }
  getProtocolDataWithData (networkId, keyLike, data) {
    return this.modelAPI.protocolData.reverseLookupProtocolData(networkId, keyLike, data)
  }
}

function formatObjectMessage (msg) {
  if (!msg.syscall) return JSON.stringify(msg)
  switch (msg.code) {
    case 'ECONNREFUSED': return 'Cannot connect to remote network server'
    case 'ETIMEDOUT': return 'Remote server timed out on request'
    default: return `${msg.syscall} returned ${msg.code}`
  }
}
