// Configuration access.
var nconf = require('nconf')
const appLogger = require('../lib/appLogger')
const path = require('path')

//* *****************************************************************************
// The NetworkProtocol interface.
//* *****************************************************************************
function NetworkProtocol () {
  this.impl = require('./dao/' +
                             nconf.get('impl_directory') +
                             '/networkProtocols.js')
}

NetworkProtocol.prototype.retrieveNetworkProtocols = async function (options) {
  let result = await this.impl.retrieveNetworkProtocols(options)
  const handlerDir = path.join(__dirname, '../networkProtocols/handlers')
  return {
    ...result,
    records: result.records.map(x => {
      const { metaData } = require(path.join(handlerDir, x.protocolHandler))
      return { ...x, metaData }
    })
  }
}

NetworkProtocol.prototype.retrieveNetworkProtocol = async function (id) {
  let rec = await this.impl.retrieveNetworkProtocol(id)
  let handler = require('../networkProtocols/' + rec.protocolHandler)
  rec.metaData = handler.metaData
  return rec
}

NetworkProtocol.prototype.createNetworkProtocol = function (name, networkTypeId, protocolHandler) {
  return this.impl.createNetworkProtocol(name, networkTypeId, protocolHandler)
}

NetworkProtocol.prototype.updateNetworkProtocol = function (record) {
  return this.impl.updateNetworkProtocol(record)
}

NetworkProtocol.prototype.deleteNetworkProtocol = function (id) {
  return this.impl.deleteNetworkProtocol(id)
}

NetworkProtocol.prototype.upsertNetworkProtocol = function (record) {
  return this.impl.upsertNetworkProtocol(record)
}

module.exports = NetworkProtocol
