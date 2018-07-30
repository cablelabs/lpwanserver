var protocolData = {}

exports.createProtocolData = function (networkId, networkProtocolId, key, data) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    protocolData.id = 1
    protocolData.networkId = networkId
    protocolData.networkProtocolId = networkProtocolId
    protocolData.dataIdentifier = key
    protocolData.dataValue = data
    resolve(protocolData)
  })
}

// Retrieve a protocolData record by id.
//
// id - the record id of the protocolData.
//
// Returns a promise that executes the retrieval.
exports.retrieveProtocolDataRecord = function (id) {
  return new Promise(function (resolve, reject) {
    resolve(protocolData)
  })
}

exports.retrieveProtocolData = function (networkId, networkProtocolId, key) {
  return new Promise(function (resolve, reject) {
    resolve(protocolData.dataValue)
  })
}

exports.updateProtocolData = function (pd) {
  return new Promise(function (resolve, reject) {
    protocolData = pd
    resolve(protocolData)
  })
}

exports.deleteProtocolData = function (id) {
  return new Promise(function (resolve, reject) {
    protocolData = {}
    resolve(protocolData)
  })
}

exports.clearProtocolData = function (networkId, networkProtocolId, keyStartsWith) {
  return new Promise(function (resolve, reject) {
    resolve()
  })
}

exports.reverseLookupProtocolData = function (networkId, keyLike, data) {
  return new Promise(function (resolve, reject) {
    resolve(protocolData)
  })
}
