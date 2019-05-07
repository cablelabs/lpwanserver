
module.exports = {
  dataValue: null,
  networks: {
    async retrieveNetwork (networkId) {
      return {
        networkId: 1,
        networkProtocolId: 1
      }
    }
  },
  networkProtocols: {
    async retrieveNetworkProtocol (networkProtocolId) {
      return ({})
    }
  },
  networkProtocolAPI: {
    async getProtocol (network) {
      return {
        sessionData: {},
        api: require('../../../rest/networkProtocols/LoRaOpenSource_2.js')
      }
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
    async retrieveProtocolData (networkId, networkProtocolId, key) {
      return { dataValue: this.dataValue }
    },
    async createProtocolData (networkId, networkProtocolId, key, data) {
      this.dataValue = data
    }
  },
  reportingProtocols: {
    async retrieveReportingProtocol (id) {
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
    }
  },
  passwordPolicies: {
    validatePassword () {
      return true
    }
  },
  applicationNetworkTypeLinks: {
    async retrieveApplicationNetworkTypeLinks () {
      return { records: [] }
    }
  }
}
