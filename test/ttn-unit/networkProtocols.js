var networkProtocol = {
  id: 1,
  name: 'The Things Network',
  networkTypeId: 1,
  protocolHandler: 'TheThingsNetwork.js'
}

exports.createNetworkProtocol = function (name, networkTypeId, protocolHandler) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    networkProtocol.id = 1
    networkProtocol.name = name
    networkProtocol.networkTypeId = networkTypeId
    networkProtocol.protocolHandler = protocolHandler
    resolve(networkProtocol)
  })
}

exports.upsertNetworkProtocol = function (np) {
  return new Promise(function (resolve, reject) {
    resolve(networkProtocol)
  })
}

// Retrieve a networkProtocol record by id.
//
// id - the record id of the networkProtocol.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkProtocol = function (id) {
  return new Promise(function (resolve, reject) {
    resolve(networkProtocol)
  })
}

// Update the networkProtocol record.
//
// networkProtocol - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetworkProtocol = function (np) {
  return new Promise(function (resolve, reject) {
    resolve(networkProtocol)
  })
}

// Delete the networkProtocol record.
//
// networkProtocolId - the id of the networkProtocol record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkProtocol = function (networkProtocolId) {
  return new Promise(function (resolve, reject) {
    resolve(networkProtocol)
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all networkProtocols from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllNetworkProtocols = function () {
  return new Promise(function (resolve, reject) {
    resolve(networkProtocol)
  })
}

/**
 * Retrieves a subset of the networkProtocols in the system given the options.
 *
 * Options include limits on the number of companies returned, the offset to
 * the first company returned (together giving a paging capability), and a
 * search string on networkProtocol name or type.
 *
 */
exports.retrieveNetworkProtocols = function (options) {
  return new Promise(function (resolve, reject) {
    resolve(networkProtocol)
  })
}
