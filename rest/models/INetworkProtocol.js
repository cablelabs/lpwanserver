// Configuration access.
var nconf = require('nconf')

//* *****************************************************************************
// The NetworkProtocol interface.
//* *****************************************************************************
function NetworkProtocol () {
  this.impl = require('./dao/' +
                             nconf.get('impl_directory') +
                             '/networkProtocols.js')
}

NetworkProtocol.prototype.retrieveNetworkProtocols = async function (options) {
  let recs = await this.impl.retrieveNetworkProtocols(options)
  console.log(recs)
  let len = recs.records.length
  for (let i = 0; i < len; i++) {
    let rec = recs.records[i]
    let handler = require('../networkProtocols/' + rec.protocolHandler)
    rec.metaData = handler.metaData
    recs.records[i] = rec
  }
  return recs
}

NetworkProtocol.prototype.retrieveNetworkProtocol = function (id) {
  return this.impl.retrieveNetworkProtocol(id)
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
