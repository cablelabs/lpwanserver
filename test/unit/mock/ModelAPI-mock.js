
module.exports = {
  dataValue: null,
  networks: {
    async load (networkId) {
      return {
        networkId: 1,
        networkProtocolId: 1
      }
    }
  },
  networkProtocols: {
    async load (networkProtocolId) {
      return ({})
    }
  },
  networkProtocolAPI: {
    async getProtocol (network) {
      return {
        sessionData: {},
        api: require('../../../rest/networkProtocols/LoRaOpenSource_2.js')
      }
    },
    async connect () {
    },
    async test () {
    }
  },
  networkTypeAPI: {
    async addDeviceProfile (nwkId, dpId) {
      return ({})
    },
    async pushDeviceProfile (nwkId, dpId) {
      return ({})
    },
    async connect () {
      return ({})
    },
    async test () {
      return ({})
    }
  },
  protocolData: {
    async load () {
      return { dataValue: this.dataValue }
    },
    async create (networkId, networkProtocolId, key, data) {
      this.dataValue = data
    },
    async loadValue () {
      return this.dataValue
    },
    async upsert (network, key, data) {
      this.dataValue = data
    }
  },
  reportingProtocols: {
    async load (id) {
      if (id === 1) {
        return (
          {
            id: id,
            reportingProtocolId: 1,
            protocolHandler: 'postHandler.js'
          })
      }
      else {
        throw new Error('Application Not Found')
      }
    },
    getHandler () {
      return { report: () => ({}) }
    }
  },
  passwordPolicies: {
    validatePassword () {
      return true
    }
  },
  applicationNetworkTypeLinks: {
    async list () {
      return [[]]
    }
  }
}
