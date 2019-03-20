// Configuration access.
var nconf = require('nconf')
const appLogger = require('../lib/appLogger')
const path = require('path')

const handlerDir = path.join(__dirname, '../networkProtocols/handlers')

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
  
  return {
    ...result,
    records: result.records.map(x => {
      const metaData = require(path.join(handlerDir, x.protocolHandler, 'metadata'))
      return { ...x, metaData }
    })
  }
}

NetworkProtocol.prototype.retrieveNetworkProtocol = async function (id) {
  let rec = await this.impl.retrieveNetworkProtocol(id)
  const metaData = require(path.join(handlerDir, rec.protocolHandler, 'metadata'))
  return { ...rec, metaData }
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
