/**
 * This is a Mock Network for Unit Testing
 */

var network = {}

exports.createNetwork = function (name, networkProviderId, networkTypeId, networkProtocolId, baseUrl, securityData) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    network.id = 1
    network.name = name
    network.networkProviderId = networkProviderId
    network.networkTypeId = networkTypeId
    network.networkProtocolId = networkProtocolId
    network.baseUrl = baseUrl
    network.securityData = securityData
    resolve(network)
  })
}

exports.retrieveNetwork = function (id) {
  return new Promise(function (resolve, reject) {
    let obj2 = JSON.parse(JSON.stringify(network));
    resolve(obj2)
  })
}

exports.updateNetwork = function (np) {
  return new Promise(function (resolve, reject) {
    network = np
    resolve(network)
  })
}

exports.deleteNetwork = function (networkId) {
  return new Promise(function (resolve, reject) {
    let temp = network
    network = {}
    resolve(temp)
  })
}

exports.retrieveNetworks = function (options) {
  return new Promise(function (resolve, reject) {
    let temp = {
      records: [network]
    }
    resolve(temp)
  })
}
